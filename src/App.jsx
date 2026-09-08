import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import MapView from './components/MapView';
import ResultsList from './components/ResultsList';
import PolicyModal from './components/PolicyModal';
import GuideModal from './components/GuideModal';
import { fetchClupaFeatures, batchFetchPermittedUses } from './services/clupaApi';
import { MNR_DISTRICTS } from './data/districts';
import { PRESETS } from './data/presets';
import { ACTIVITIES } from './data/activities';
import { Map, List, Columns, AlertCircle } from 'lucide-react';

const INITIAL_FILTERS = {
  keyword: '',
  regionId: 'all',
  districtId: 'parry_sound', // Start with a rich, popular district by default (Parry Sound)
  designations: [],
  activities: {}
};

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [activePreset, setActivePreset] = useState(null);
  const [features, setFeatures] = useState([]);
  const [permittedUsesMap, setPermittedUsesMap] = useState({});
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [inspectedFeature, setInspectedFeature] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth > 900 : true
  );
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list' | 'split'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map viewport
  const [mapCenter, setMapCenter] = useState([45.35, -80.03]); // Parry Sound
  const [mapZoom, setMapZoom] = useState(9);

  // Active district object
  const currentDistrict = useMemo(() => {
    return MNR_DISTRICTS.find(d => d.id === filters.districtId);
  }, [filters.districtId]);

  // Load data from ArcGIS API
  const loadData = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);

    try {
      let bbox = null;
      if (currentFilters.districtId) {
        const dist = MNR_DISTRICTS.find(d => d.id === currentFilters.districtId);
        if (dist && dist.bbox) {
          bbox = dist.bbox;
          setMapCenter(dist.center);
          setMapZoom(dist.zoom || 9);
        }
      }

      const data = await fetchClupaFeatures({
        bbox,
        designations: currentFilters.designations,
        keyword: currentFilters.keyword,
        limit: 120
      });

      const loadedFeatures = data.features || [];
      setFeatures(loadedFeatures);

      // Extract OGF_IDs to batch-fetch permitted uses
      const ogfIds = loadedFeatures
        .map(f => f.properties?.OGF_ID)
        .filter(Boolean)
        .slice(0, 60); // fetch top 60 in view

      if (ogfIds.length > 0) {
        batchFetchPermittedUses(ogfIds).then(usesMap => {
          setPermittedUsesMap(prev => ({ ...prev, ...usesMap }));
        }).catch(e => {
          console.warn('Permitted uses batch fetch warning:', e);
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading CLUPA data:', err);
      setError('Unable to reach Ontario ArcGIS REST server. Please check connection or retry.');
      setLoading(false);
    }
  }, []);

  // Fetch when filters change (debounced for text search)
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(filters);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.districtId, filters.regionId, filters.designations, filters.keyword, loadData]);

  // Filter features based on active activity requirements
  const filteredFeatures = useMemo(() => {
    const activeActivityIds = Object.keys(filters.activities);
    if (activeActivityIds.length === 0) return features;

    return features.filter(feature => {
      const ogfId = feature.properties?.OGF_ID;
      if (!ogfId) return true;
      const uses = permittedUsesMap[ogfId];
      if (!uses || uses.length === 0) return true; // keep if details not loaded yet

      // Check every active activity filter
      return activeActivityIds.every(actId => {
        const requiredStatus = filters.activities[actId]; // 'Yes' | 'Maybe' | 'No'
        const actDef = ACTIVITIES.find(a => a.id === actId);
        if (!actDef) return true;

        // Find matching use record
        const matchingUse = uses.find(u => 
          actDef.apiTypes.some(apiType => u.PERMITTED_USE_TYPE_ENG === apiType)
        );

        if (!matchingUse) return true;
        return matchingUse.PERMITTED_FLG_ENG === requiredStatus;
      });
    });
  }, [features, filters.activities, permittedUsesMap]);

  // Handle Preset selection
  const handleSelectPreset = (presetId) => {
    if (!presetId) {
      setActivePreset(null);
      setFilters(INITIAL_FILTERS);
      return;
    }

    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);

    const newActivities = {};
    preset.filters.activities.forEach(a => {
      newActivities[a.id] = a.status;
    });

    setFilters(prev => ({
      ...prev,
      designations: preset.filters.designations || [],
      activities: newActivities,
      keyword: preset.filters.keyword || ''
    }));

    // On mobile, close filter drawer to reveal map results
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  };

  // Handle Town selection from quick hubs
  const handleSelectTown = (town) => {
    setFilters(prev => ({
      ...prev,
      districtId: town.districtId
    }));
    setMapCenter(town.coords);
    setMapZoom(11);

    // On mobile, close filter drawer to reveal selected town
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActivePreset(null);
    setFilters(INITIAL_FILTERS);
  };

  // Load data for custom map viewport (when user pans/zooms map)
  const handleSearchBbox = useCallback(async (bbox) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClupaFeatures({
        bbox,
        designations: filters.designations,
        keyword: filters.keyword,
        limit: 120
      });
      const loadedFeatures = data.features || [];
      setFeatures(loadedFeatures);

      const ogfIds = loadedFeatures
        .map(f => f.properties?.OGF_ID)
        .filter(Boolean)
        .slice(0, 60);

      if (ogfIds.length > 0) {
        batchFetchPermittedUses(ogfIds).then(usesMap => {
          setPermittedUsesMap(prev => ({ ...prev, ...usesMap }));
        }).catch(e => console.warn(e));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error querying viewport bbox:', err);
      setError('Unable to fetch Crown Land features for this area.');
      setLoading(false);
    }
  }, [filters.designations, filters.keyword]);

  return (
    <div className="app-container">
      {/* Global Header */}
      <Header
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        onOpenGuide={() => setGuideOpen(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        matchingCount={filteredFeatures.length}
        loading={loading}
      />

      <div className="app-main">
        {/* Sidebar Filters */}
        <FilterPanel
          filters={filters}
          onChangeFilters={(newFilters) => {
            setActivePreset(null);
            setFilters(newFilters);
          }}
          onResetFilters={handleResetFilters}
          onSelectTown={handleSelectTown}
          matchingCount={filteredFeatures.length}
          loading={loading}
          collapsed={!sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className={`content-area ${viewMode === 'split' ? 'is-split-view' : ''}`}>
          {/* View Mode Bar */}
          <div className="view-mode-bar" id="view-mode-bar">
            <button
              id="btn-view-map"
              className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <Map size={15} />
              <span>Map View</span>
            </button>
            <button
              id="btn-view-split"
              className={`view-mode-btn view-mode-btn-split ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              <Columns size={15} />
              <span>Split View</span>
            </button>
            <button
              id="btn-view-list"
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={15} />
              <span>List ({filteredFeatures.length})</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <span>Querying Ontario Crown Land...</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div style={{
              position: 'absolute',
              top: 70,
              left: 20,
              zIndex: 500,
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Views Layout */}
          <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Map Component */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div style={{ flex: viewMode === 'split' ? 1 : '1 1 100%', height: '100%', position: 'relative' }}>
                <MapView
                  features={filteredFeatures}
                  selectedFeature={selectedFeature}
                  onSelectFeature={(feat) => {
                    setSelectedFeature(feat);
                    setInspectedFeature(feat);
                  }}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  isSplitView={viewMode === 'split'}
                  onSearchBbox={handleSearchBbox}
                  currentDistrict={currentDistrict}
                  onSelectDistrict={(distId) => {
                    setFilters(prev => ({ ...prev, districtId: distId }));
                  }}
                />
              </div>
            )}

            {/* List / Cards Component */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <div style={{
                flex: viewMode === 'split' ? 1 : '1 1 100%',
                height: '100%',
                maxWidth: viewMode === 'split' ? '50%' : '100%',
                overflow: 'hidden',
                borderLeft: viewMode === 'split' ? '1px solid var(--border-subtle)' : 'none'
              }}>
                <ResultsList
                  features={filteredFeatures}
                  permittedUsesMap={permittedUsesMap}
                  selectedFeature={selectedFeature}
                  onSelectFeature={(feat) => {
                    setSelectedFeature(feat);
                    if (viewMode === 'list') {
                      setInspectedFeature(feat);
                    }
                  }}
                  onInspectPolicy={(feat) => setInspectedFeature(feat)}
                  loading={loading}
                />
              </div>
            )}
          </div>

          {/* Floating Area Count Badge on Map */}
          {viewMode === 'map' && (
            <div className="results-summary-badge" id="map-results-summary">
              <span>Found <strong>{filteredFeatures.length}</strong> areas</span>
              {currentDistrict && (
                <span style={{ color: 'var(--text-secondary)' }}>
                  in {currentDistrict.name} District
                </span>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Deep-Dive Policy Inspector Modal */}
      {inspectedFeature && (
        <PolicyModal
          feature={inspectedFeature}
          onClose={() => setInspectedFeature(null)}
        />
      )}

      {/* Regulations & 21-Day Camping Guide Modal */}
      {guideOpen && (
        <GuideModal onClose={() => setGuideOpen(false)} />
      )}
    </div>
  );
}
