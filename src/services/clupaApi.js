// Use /api-lio proxy (configured in vite.config.js for dev, and vercel.json / _redirects for production)
const LIO_BASE_URL = '/api-lio/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open06/MapServer';
const DIRECT_LIO_BASE_URL = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open06/MapServer';

// In-memory cache to avoid duplicate network requests
const memoryCache = new Map();

/**
 * Fetch spatial features (polygons) from CLUPA Provincial (Layer 5)
 * Supports bounding box queries, designation filters, and text search
 */
export async function fetchClupaFeatures({
  bbox = null,
  designations = [],
  keyword = '',
  districtId = null,
  limit = 80
} = {}) {
  const cacheKey = `features_${JSON.stringify({ bbox, designations, keyword, districtId, limit })}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    outFields: 'POLICY_IDENT,NAME_ENG,DESIGNATION_ENG,CATEGORY_ENG,SYS_AREA,OGF_ID',
    returnGeometry: 'true',
    f: 'geojson',
    resultRecordCount: limit.toString()
  });

  // Where clauses
  const whereClauses = ['1=1'];

  if (designations && designations.length > 0) {
    const formatted = designations.map(d => `'${d.replace(/'/g, "''")}'`).join(',');
    whereClauses.push(`DESIGNATION_ENG IN (${formatted})`);
  }

  if (keyword && keyword.trim()) {
    const clean = keyword.trim().replace(/'/g, "''").toUpperCase();
    whereClauses.push(`(UPPER(NAME_ENG) LIKE '%${clean}%' OR UPPER(POLICY_IDENT) LIKE '%${clean}%')`);
  }

  params.append('where', whereClauses.join(' AND '));

  // Use maxAllowableOffset to generalize polygon vertices for screen display (~200m).
  // This reduces payload size from 15MB+ to ~300KB, making queries finish in <2s instead of timing out!
  params.append('maxAllowableOffset', '0.002');

  if (bbox && bbox.length === 4) {
    // bbox: [west, south, east, north]
    params.append('geometry', bbox.join(','));
    params.append('geometryType', 'esriGeometryEnvelope');
    params.append('spatialRel', 'esriSpatialRelIntersects');
    params.append('inSR', '4326');
    params.append('outSR', '4326');
  }

  const url = `${LIO_BASE_URL}/5/query?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 14000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`CLUPA Layer 5 query failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    // Sort features: prioritize General Use Areas and areas with names
    if (data && data.features) {
      data.features.sort((a, b) => {
        const nameA = a.properties?.NAME_ENG || '';
        const nameB = b.properties?.NAME_ENG || '';
        return nameA.localeCompare(nameB);
      });
    }

    memoryCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Failed to fetch from live CLUPA ArcGIS API, checking fallbacks:', err);
    throw err;
  }
}

/**
 * Fetch detailed policy description and official intent from CLUPA_POLICY (Table 8)
 */
export async function fetchPolicyDetails(policyIdent) {
  if (!policyIdent) return null;
  const cacheKey = `policy_detail_${policyIdent}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const cleanIdent = policyIdent.replace(/'/g, "''");
  // Some policy idents have suffixes like G359/GBS; check prefix or exact
  const where = `POLICY_IDENT = '${cleanIdent}' OR POLICY_IDENT LIKE '${cleanIdent}/%'`;
  const params = new URLSearchParams({
    where,
    outFields: 'OGF_ID,POLICY_IDENT,LAND_AREA_DESCR_ENG,LAND_USE_INTENT_DESCR_ENG,OFFICIAL_AREA_HA,URL_ENG,DATE_POLICY_LAST_UPDATED',
    returnGeometry: 'false',
    f: 'json'
  });

  try {
    const response = await fetch(`${LIO_BASE_URL}/8/query?${params.toString()}`);
    if (!response.ok) throw new Error(`CLUPA Table 8 query failed: ${response.status}`);
    const data = await response.json();
    const result = data.features?.[0]?.attributes || null;
    memoryCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error fetching policy details:', err);
    return null;
  }
}

/**
 * Fetch permitted uses and guidelines for a policy from CLUPA_POLICY_AND_PERMITTED_USE (Table 13)
 */
export async function fetchPermittedUses(clupaPolicyId) {
  if (!clupaPolicyId) return [];
  const cacheKey = `permitted_uses_${clupaPolicyId}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    where: `CLUPA_POLICY_ID = ${clupaPolicyId}`,
    outFields: 'PERMITTED_USE_CLASS_ENG,PERMITTED_USE_TYPE_ENG,PERMITTED_FLG_ENG,PERMITTED_USE_GUIDELINES_ENG',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '200'
  });

  try {
    const response = await fetch(`${LIO_BASE_URL}/13/query?${params.toString()}`);
    if (!response.ok) throw new Error(`CLUPA Table 13 query failed: ${response.status}`);
    const data = await response.json();
    const uses = (data.features || []).map(f => f.attributes);
    memoryCache.set(cacheKey, uses);
    return uses;
  } catch (err) {
    console.error('Error fetching permitted uses:', err);
    return [];
  }
}

/**
 * Batch fetch permitted activities for a list of OGF_IDs (useful for multi-filtering)
 */
export async function batchFetchPermittedUses(policyIds = []) {
  if (!policyIds.length) return {};
  const missing = policyIds.filter(id => !memoryCache.has(`permitted_uses_${id}`));
  
  if (missing.length === 0) {
    const result = {};
    policyIds.forEach(id => {
      result[id] = memoryCache.get(`permitted_uses_${id}`) || [];
    });
    return result;
  }

  // Batch in chunks of 25 to respect URL length limits
  const chunkSize = 25;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const inList = chunk.join(',');
    const params = new URLSearchParams({
      where: `CLUPA_POLICY_ID IN (${inList})`,
      outFields: 'CLUPA_POLICY_ID,PERMITTED_USE_CLASS_ENG,PERMITTED_USE_TYPE_ENG,PERMITTED_FLG_ENG,PERMITTED_USE_GUIDELINES_ENG',
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '2000'
    });

    try {
      const res = await fetch(`${LIO_BASE_URL}/13/query?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Group by CLUPA_POLICY_ID
        const grouped = {};
        (data.features || []).forEach(f => {
          const id = f.attributes.CLUPA_POLICY_ID;
          if (!grouped[id]) grouped[id] = [];
          grouped[id].push(f.attributes);
        });

        chunk.forEach(id => {
          memoryCache.set(`permitted_uses_${id}`, grouped[id] || []);
        });
      }
    } catch (e) {
      console.warn('Batch fetch error for permitted uses chunk:', e);
    }
  }

  const finalResult = {};
  policyIds.forEach(id => {
    finalResult[id] = memoryCache.get(`permitted_uses_${id}`) || [];
  });
  return finalResult;
}

/**
 * Fetch districts for an area from CLUPA_POLICY_AND_MNR_DISTRICT (Table 11)
 */
export async function fetchDistrictsForPolicy(clupaPolicyId) {
  if (!clupaPolicyId) return [];
  const cacheKey = `districts_${clupaPolicyId}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    where: `CLUPA_POLICY_ID = ${clupaPolicyId}`,
    outFields: 'MNR_DISTRICT_NAME_ENG,MNR_REGION_NAME_ENG,LEAD_DISTRICT_IND',
    returnGeometry: 'false',
    f: 'json'
  });

  try {
    const response = await fetch(`${LIO_BASE_URL}/11/query?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    const districts = (data.features || []).map(f => f.attributes);
    memoryCache.set(cacheKey, districts);
    return districts;
  } catch (err) {
    return [];
  }
}

/**
 * Overlay 1: Wildlife Management Units (WMU)
 * LIO_Open05 Layer 5
 */
export async function fetchWmuFeatures() {
  const cacheKey = 'overlay_wmu_all';
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const url = '/api-lio/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open05/MapServer/5/query?where=1%3D1&outFields=OFFICIAL_NAME,OGF_ID&returnGeometry=true&f=geojson&maxAllowableOffset=0.005&resultRecordCount=200';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('WMU fetch failed');
    const data = await res.json();
    memoryCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Failed to load WMU overlay:', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Overlay 2: Unpatented Crown Land Parcels
 * LIO_Open08 Layer 34
 */
export async function fetchUnpatentedParcels({ bbox = null, limit = 80 } = {}) {
  if (!bbox) return { type: 'FeatureCollection', features: [] };

  const cacheKey = `overlay_unpatented_${bbox.join(',')}_${limit}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    where: '1=1',
    geometry: bbox.join(','),
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    outFields: 'OGF_ID,SURVEY_LOCATION_IDENT,AREA_IN_HA',
    returnGeometry: 'true',
    f: 'geojson',
    maxAllowableOffset: '0.002',
    resultRecordCount: limit.toString()
  });

  const url = `/api-lio/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open08/MapServer/34/query?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Unpatented parcels fetch failed');
    const data = await res.json();
    memoryCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Failed to load Unpatented Crown Land overlay:', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Overlay 3: Restricted Fire Zones (RFZ)
 * LIO_Open08 Layer 28
 */
export async function fetchRestrictedFireZones() {
  const cacheKey = 'overlay_rfz_all';
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const url = '/api-lio/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open08/MapServer/28/query?where=1%3D1&outFields=OFFICIAL_NAME,BUSINESS_EFFECTIVE_DATE&returnGeometry=true&f=geojson&maxAllowableOffset=0.005&resultRecordCount=100';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('RFZ fetch failed');
    const data = await res.json();
    memoryCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Failed to load RFZ overlay:', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

