import React, { useEffect, useState } from 'react';
import { X, ExternalLink, MapPin, Copy, Check, Download, Search, FileText, Compass, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchPolicyDetails, fetchPermittedUses } from '../services/clupaApi';
import { LAND_DESIGNATIONS } from '../data/activities';

function getDesignationBadgeClass(designation) {
  if (!designation) return 'badge-general';
  const found = LAND_DESIGNATIONS.find(d => 
    d.name.toLowerCase() === designation.toLowerCase() ||
    designation.toLowerCase().includes(d.name.toLowerCase())
  );
  return found ? found.badgeClass : 'badge-general';
}

export function getLandStatusInfo(designation = '', ident = '') {
  const d = designation.toLowerCase();
  const id = ident.toUpperCase();

  if (d.includes('park') || id.startsWith('P') || id.startsWith('PP')) {
    return {
      type: 'park',
      badge: 'Ontario Provincial Park',
      badgeClass: 'badge-park',
      headline: '🏞️ Ontario Provincial Park',
      headlineSubtitle: 'Regulated Protected Area (Ontario Parks)',
      tagline: 'Strict conservation area managed under the Provincial Parks and Conservation Reserves Act. Standard Crown land dispersed recreation does not apply.',
      campingNotice: 'Designated campsite reservation & Ontario Parks permit required. Random/dispersed Crown land camping is NOT permitted.',
      huntingNotice: 'Hunting is prohibited or strictly limited to specific designated wildlife seasons by park regulation.',
      accessNotice: 'Motorized vehicles (ATVs, snowmobiles, trucks) restricted to authorized public park roads only.',
      isCrownFreeCamp: false
    };
  }

  if (d.includes('conservation') || id.startsWith('C')) {
    return {
      type: 'conservation',
      badge: 'Conservation Reserve',
      badgeClass: 'badge-conservation',
      headline: '🛡️ Conservation Reserve',
      headlineSubtitle: 'Protected Public Land (Non-Operating Nature Reserve)',
      tagline: 'Permanently protected public land preserving significant natural ecosystems. Traditional low-impact public recreation is welcomed.',
      campingNotice: 'Free 21-day dispersed camping permitted for Canadian residents (practice Leave-No-Trace). Commercial development prohibited.',
      huntingNotice: 'Hunting, trapping, and angling permitted under standard provincial Fish & Wildlife regulations and open seasons.',
      accessNotice: 'Existing recreational trails, portages, and water access routes permitted. New road construction is prohibited.',
      isCrownFreeCamp: true
    };
  }

  if (d.includes('enhanced') || id.startsWith('E')) {
    return {
      type: 'enhanced',
      badge: 'Enhanced Management Area',
      badgeClass: 'badge-enhanced',
      headline: '🧭 Enhanced Management Area (EMA)',
      headlineSubtitle: 'Multi-Use Public Crown Land with Special Guidelines',
      tagline: 'Public Crown land specifically managed to safeguard remote recreation, fish/wildlife corridors, or intensive forestry.',
      campingNotice: 'Free 21-day dispersed camping permitted for Canadian residents, subject to local resource guidelines.',
      huntingNotice: 'Hunting, trapping, angling, and traditional outdoor recreation permitted under provincial game seasons.',
      accessNotice: 'Motorized trail and road access permitted; certain seasonal access restrictions may apply to protect remote values.',
      isCrownFreeCamp: true
    };
  }

  if (d.includes('forest') || id.startsWith('F')) {
    return {
      type: 'forest',
      badge: 'Forest Reserve',
      badgeClass: 'badge-forest',
      headline: '🌳 Forest Reserve',
      headlineSubtitle: 'Interim Protected Public Land',
      tagline: 'Public Crown land proposed for future park or conservation reserve status while accommodating pre-existing mineral rights or mining claims.',
      campingNotice: 'Free 21-day dispersed Crown land camping permitted for Canadian residents.',
      huntingNotice: 'Hunting, fishing, and traditional outdoor recreation permitted under provincial regulations.',
      accessNotice: 'Recreational access permitted; please respect active mineral claims and exploration work.',
      isCrownFreeCamp: true
    };
  }

  // Default: General Use Area
  return {
    type: 'general',
    badge: 'Public Crown Land',
    badgeClass: 'badge-general',
    headline: '🌲 Public Crown Land (General Use Area)',
    headlineSubtitle: 'Open Ontario Public Land (Multi-Use Area)',
    tagline: 'The primary public land resource across Ontario, managed for sustainable multi-use outdoor recreation, forestry, and resource exploration.',
    campingNotice: 'Free 21-day dispersed camping allowed for Canadian residents on any one site per calendar year.',
    huntingNotice: 'Hunting, trapping, and fishing fully permitted under standard provincial game open seasons and bag limits.',
    accessNotice: 'Motorized vehicle access (ATVs, snowmobiles, dirt bikes, 4x4s) permitted on existing Crown roads and trails.',
    isCrownFreeCamp: true
  };
}

export default function PolicyModal({ feature, onClose }) {
  if (!feature) return null;

  const props = feature.properties || {};
  const ident = props.POLICY_IDENT;
  const name = props.NAME_ENG || 'Crown Land Area';
  const desig = props.DESIGNATION_ENG || 'General Use Area';
  const ogfId = props.OGF_ID;

  const statusInfo = getLandStatusInfo(desig, ident);

  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState(null);
  const [permittedUses, setPermittedUses] = useState([]);
  const [activitySearch, setActivitySearch] = useState('');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [intentExpanded, setIntentExpanded] = useState(false);

  // Extract approximate center coordinates from geometry
  let centerCoords = [46.0, -80.0];
  if (feature.geometry) {
    try {
      const coords = feature.geometry.coordinates;
      let sample = null;
      if (feature.geometry.type === 'Polygon' && coords[0] && coords[0][0]) {
        sample = coords[0][0];
      } else if (feature.geometry.type === 'MultiPolygon' && coords[0] && coords[0][0] && coords[0][0][0]) {
        sample = coords[0][0][0];
      }
      if (sample) {
        centerCoords = [sample[1], sample[0]]; // lat, lng
      }
    } catch (e) {}
  }

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadDetails() {
      try {
        const [details, uses] = await Promise.all([
          fetchPolicyDetails(ident),
          ogfId ? fetchPermittedUses(ogfId) : Promise.resolve([])
        ]);

        if (isMounted) {
          setPolicyData(details);
          setPermittedUses(uses || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load policy details:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadDetails();
    return () => { isMounted = false; };
  }, [ident, ogfId]);

  // Copy GPS Coordinates
  const handleCopyCoords = () => {
    const coordStr = `${centerCoords[0].toFixed(5)}, ${centerCoords[1].toFixed(5)}`;
    navigator.clipboard.writeText(coordStr);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Download GeoJSON
  const handleDownloadGeoJson = () => {
    const blob = new Blob([JSON.stringify(feature, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CLUPA_${ident}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter permitted uses
  const filteredUses = permittedUses.filter(u => {
    if (!activitySearch) return true;
    const term = activitySearch.toLowerCase();
    return (
      (u.PERMITTED_USE_TYPE_ENG && u.PERMITTED_USE_TYPE_ENG.toLowerCase().includes(term)) ||
      (u.PERMITTED_USE_CLASS_ENG && u.PERMITTED_USE_CLASS_ENG.toLowerCase().includes(term)) ||
      (u.PERMITTED_USE_GUIDELINES_ENG && u.PERMITTED_USE_GUIDELINES_ENG.toLowerCase().includes(term))
    );
  });

  const areaHa = policyData?.OFFICIAL_AREA_HA || (props.SYS_AREA ? Math.round(props.SYS_AREA / 10000) : null);
  const areaAcres = areaHa ? Math.round(areaHa * 2.47105).toLocaleString() : null;
  const officialReportUrl = policyData?.URL_ENG || `https://www.ontario.ca/page/crown-land-use-policy-atlas`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-id-row">
              <span className="modal-ident">{ident}</span>
              <span className={`map-popup-badge ${getDesignationBadgeClass(desig)}`}>
                {desig}
              </span>
            </div>
            <h2 className="modal-name">{name}</h2>
            <div className="modal-meta-row">
              {areaHa && <span>📐 {areaHa.toLocaleString()} ha (~{areaAcres} acres)</span>}
              <span>📍 {centerCoords[0].toFixed(4)}° N, {Math.abs(centerCoords[1]).toFixed(4)}° W</span>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px', width: 24, height: 24 }} />
              <p>Fetching official policy records from Ontario ArcGIS LIO Service...</p>
            </div>
          ) : (
            <>
              {/* 0. Plain-English Land Status Headline Card (Tester Feedback: instant headline of park, private, or crown land) */}
              <div className={`land-status-card status-${statusInfo.type}`}>
                <div className="status-card-header">
                  <div>
                    <h3 className="status-card-headline">{statusInfo.headline}</h3>
                    <div className="status-card-subtitle">{statusInfo.headlineSubtitle}</div>
                  </div>
                  <span className={`status-pill ${statusInfo.badgeClass}`}>
                    {statusInfo.badge}
                  </span>
                </div>

                <p className="status-card-tagline">{statusInfo.tagline}</p>

                <div className="status-key-points-grid">
                  <div className="status-point-item">
                    <span className="status-point-icon">⛺</span>
                    <div>
                      <div className="status-point-label">Camping Rules</div>
                      <div className="status-point-text">{statusInfo.campingNotice}</div>
                    </div>
                  </div>

                  <div className="status-point-item">
                    <span className="status-point-icon">🎯</span>
                    <div>
                      <div className="status-point-label">Hunting & Angling</div>
                      <div className="status-point-text">{statusInfo.huntingNotice}</div>
                    </div>
                  </div>

                  <div className="status-point-item">
                    <span className="status-point-icon">🚙</span>
                    <div>
                      <div className="status-point-label">Trail & Vehicle Access</div>
                      <div className="status-point-text">{statusInfo.accessNotice}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Government Management Intent (Collapsible Accordion - collapsed by default so Area Description is immediately visible) */}
              {policyData?.LAND_USE_INTENT_DESCR_ENG && (
                <div className="policy-block">
                  <button
                    type="button"
                    id="btn-toggle-management-intent"
                    className="collapsible-block-btn"
                    onClick={() => setIntentExpanded(!intentExpanded)}
                    aria-expanded={intentExpanded}
                  >
                    <div className="policy-block-title" style={{ margin: 0 }}>
                      <Compass size={15} className="text-emerald" />
                      <span>Government Management Intent</span>
                      <span className="collapsible-badge">
                        {intentExpanded ? 'Collapse' : 'Tap to expand'}
                      </span>
                    </div>
                    {intentExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {intentExpanded && (
                    <div className="policy-text-card intent-expanded-card">
                      {policyData.LAND_USE_INTENT_DESCR_ENG}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Land Area Description & Setting */}
              {policyData?.LAND_AREA_DESCR_ENG && (
                <div className="policy-block">
                  <div className="policy-block-title">
                    <FileText size={15} className="text-emerald" />
                    <span>Area Description & Setting</span>
                  </div>
                  <div className="policy-text-card">
                    {policyData.LAND_AREA_DESCR_ENG}
                  </div>
                </div>
              )}

              {/* Permitted Uses Table */}
              <div className="policy-block">
                <div className="policy-block-title" style={{ justifyContent: 'space-between' }}>
                  <span>Permitted Uses & Guidelines ({permittedUses.length})</span>
                  <span style={{ fontSize: '0.75rem', textTransform: 'none', color: 'var(--text-muted)' }}>
                    Ontario MNR Policy Directives
                  </span>
                </div>

                <div className="permitted-table-wrapper">
                  <div className="permitted-search-bar">
                    <Search size={14} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="permitted-search-input"
                      placeholder="Filter activities (e.g. camping, hunting, atv, mining, timber)..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                    {activitySearch && (
                      <button
                        className="search-clear-btn"
                        onClick={() => setActivitySearch('')}
                        style={{ position: 'static' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {filteredUses.length > 0 ? (
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      <table className="permitted-table">
                        <thead>
                          <tr>
                            <th style={{ width: '25%' }}>Activity Class</th>
                            <th style={{ width: '30%' }}>Permitted Use</th>
                            <th style={{ width: '15%' }}>Status</th>
                            <th>Policy Guidelines</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUses.map((use, i) => {
                            const flg = use.PERMITTED_FLG_ENG || 'Unknown';
                            let badgeStyle = 'badge-general';
                            if (flg === 'Yes') badgeStyle = 'badge-yes';
                            else if (flg === 'Maybe') badgeStyle = 'badge-maybe';
                            else if (flg === 'No') badgeStyle = 'badge-no';

                            return (
                              <tr key={i}>
                                <td style={{ color: 'var(--text-secondary)' }}>
                                  {use.PERMITTED_USE_CLASS_ENG}
                                </td>
                                <td>
                                  <strong>{use.PERMITTED_USE_TYPE_ENG}</strong>
                                </td>
                                <td>
                                  <span className={`quick-badge ${badgeStyle}`}>
                                    {flg}
                                  </span>
                                </td>
                                <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                  {use.PERMITTED_USE_GUIDELINES_ENG || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No permitted activities match your filter.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-modal-action btn-action-outline"
              onClick={handleCopyCoords}
              title="Copy latitude and longitude"
            >
              {copiedCoords ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              <span>{copiedCoords ? 'Copied!' : 'Copy GPS'}</span>
            </button>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${centerCoords[0]},${centerCoords[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-modal-action btn-action-outline"
            >
              <MapPin size={14} />
              <span>Google Maps</span>
            </a>

            <button
              className="btn-modal-action btn-action-outline"
              onClick={handleDownloadGeoJson}
              title="Export polygon boundary as GeoJSON"
            >
              <Download size={14} />
              <span>Export GeoJSON</span>
            </button>
          </div>

          <div className="modal-footer-actions">
            <a
              href={officialReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-modal-action btn-action-primary"
            >
              <span>Official Ontario Report</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
