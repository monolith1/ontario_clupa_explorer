import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, ZoomIn, ZoomOut, Maximize2, Flame, Trees, ShieldAlert, Sparkles, X, Check, RotateCw, Palette, ChevronDown, MapPin } from 'lucide-react';
import { LAND_DESIGNATIONS } from '../data/activities';
import { fetchWmuFeatures, fetchUnpatentedParcels, fetchRestrictedFireZones } from '../services/clupaApi';
import { MNR_DISTRICTS } from '../data/districts';

// Free, public basemap tiles without API keys or watermarks
const BASEMAPS = {
  dark: {
    name: 'Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap',
    labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
  },
  topo: {
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, Intermap, USGS'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Earthstar Geographics'
  },
  streets: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

function getDesignationColor(designation) {
  if (!designation) return '#10b981';
  const found = LAND_DESIGNATIONS.find(d => 
    d.name.toLowerCase() === designation.toLowerCase() ||
    designation.toLowerCase().includes(d.name.toLowerCase())
  );
  return found ? found.color : '#10b981';
}

export default function MapView({
  features = [],
  selectedFeature,
  onSelectFeature,
  mapCenter = [45.35, -80.03],
  mapZoom = 9,
  onBoundsChange,
  isSplitView = false,
  onSearchBbox,
  currentDistrict,
  currentRegion,
  onSelectDistrict
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const labelLayerRef = useRef(null);

  // Overlay layer refs
  const wmuLayerRef = useRef(null);
  const unpatentedLayerRef = useRef(null);
  const rfzLayerRef = useRef(null);

  const [activeBasemap, setActiveBasemap] = useState('dark');
  const [activeOverlays, setActiveOverlays] = useState({
    wmu: false,
    unpatented: false,
    rfz: false
  });
  const [loadingOverlay, setLoadingOverlay] = useState(null); // 'wmu' | 'unpatented' | 'rfz' | null
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 1024 : false;
  });
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);

  const activeOverlayCount = Object.values(activeOverlays).filter(Boolean).length;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false
    });

    mapInstanceRef.current = map;

    // Initial tile layer
    const basemapConfig = BASEMAPS[activeBasemap];
    const tileLayer = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      maxZoom: 18
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    if (basemapConfig.labelUrl) {
      const labelLayer = L.tileLayer(basemapConfig.labelUrl, { maxZoom: 18 }).addTo(map);
      labelLayerRef.current = labelLayer;
    }

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map move listener for viewport queries
    let moveTimeout;
    map.on('moveend', () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        const bounds = map.getBounds();
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ];
        if (onBoundsChange) {
          onBoundsChange(bbox);
        }
        // If unpatented overlay is active, re-fetch for new viewport
        if (activeOverlays.unpatented) {
          loadUnpatentedOverlay(bbox);
        }
      }, 500);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = BASEMAPS[activeBasemap];

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    if (labelLayerRef.current) {
      mapInstanceRef.current.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }

    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 18
    }).addTo(mapInstanceRef.current);
    newLayer.bringToBack();
    tileLayerRef.current = newLayer;

    if (config.labelUrl) {
      const newLabelLayer = L.tileLayer(config.labelUrl, { maxZoom: 18 }).addTo(mapInstanceRef.current);
      labelLayerRef.current = newLabelLayer;
    }
  }, [activeBasemap]);

  // Update CLUPA Provincial Polygons
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (geoJsonLayerRef.current) {
      mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
    }

    if (!features || features.length === 0) return;

    const geoJsonData = {
      type: 'FeatureCollection',
      features: features
    };

    const layer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const designation = feature.properties?.DESIGNATION_ENG || '';
        const isSelected = selectedFeature && selectedFeature.properties?.POLICY_IDENT === feature.properties?.POLICY_IDENT;
        const color = getDesignationColor(designation);

        return {
          fillColor: color,
          fillOpacity: isSelected ? 0.65 : 0.35,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1.5,
          dashArray: isSelected ? '' : '2',
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties || {};
        const ident = props.POLICY_IDENT || 'Area';
        const name = props.NAME_ENG || 'Crown Land';
        const desig = props.DESIGNATION_ENG || 'General Use';
        const areaHa = props.SYS_AREA ? Math.round(props.SYS_AREA / 10000).toLocaleString() : 'N/A';

        // Tooltip
        featureLayer.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 12px;">
            <strong style="color: var(--emerald-primary); font-size: 13px;">${ident}</strong> - ${name}<br/>
            <span style="color: #94a3b8;">${desig} • ${areaHa} ha</span>
          </div>
        `, { sticky: true });

        // Click handler
        featureLayer.on('click', () => {
          if (onSelectFeature) {
            onSelectFeature(feature);
          }
        });

        // Hover styling
        featureLayer.on('mouseover', () => {
          featureLayer.setStyle({
            fillOpacity: 0.6,
            weight: 2.5
          });
        });

        featureLayer.on('mouseout', () => {
          const isSelected = selectedFeature && selectedFeature.properties?.POLICY_IDENT === feature.properties?.POLICY_IDENT;
          if (!isSelected) {
            featureLayer.setStyle({
              fillOpacity: 0.35,
              weight: 1.5
            });
          }
        });
      }
    }).addTo(mapInstanceRef.current);

    geoJsonLayerRef.current = layer;
  }, [features, selectedFeature]);

  // Center/Fly to selected feature
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedFeature) return;
    try {
      const tempLayer = L.geoJSON(selectedFeature);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.flyToBounds(bounds, {
          padding: [60, 60],
          duration: 1.2,
          maxZoom: 13
        });
      }
    } catch (e) {
      console.warn('Could not zoom to selected feature:', e);
    }
  }, [selectedFeature]);

  // Overlay 1: WMU (Wildlife Management Units)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!activeOverlays.wmu) {
      if (wmuLayerRef.current) {
        mapInstanceRef.current.removeLayer(wmuLayerRef.current);
        wmuLayerRef.current = null;
      }
      return;
    }

    if (wmuLayerRef.current) return;

    setLoadingOverlay('wmu');
    fetchWmuFeatures().then((data) => {
      if (!mapInstanceRef.current || !activeOverlays.wmu) {
        setLoadingOverlay(null);
        return;
      }

      const layer = L.geoJSON(data, {
        style: {
          color: '#f59e0b', // Amber
          weight: 2,
          dashArray: '5, 5',
          fillColor: '#f59e0b',
          fillOpacity: 0.04
        },
        onEachFeature: (feat, l) => {
          const unit = feat.properties?.OFFICIAL_NAME || 'Unknown';
          l.bindTooltip(`WMU ${unit}`, {
            permanent: true,
            direction: 'center',
            className: 'wmu-label-tooltip'
          });
          l.bindPopup(`
            <div style="font-family: var(--font-body); padding: 4px;">
              <strong style="color: #f59e0b; font-size: 14px;">🎯 Wildlife Management Unit: WMU ${unit}</strong>
              <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                Ontario Hunting Regulations apply. Open seasons, moose/deer/bear tags, and firearm discharge rules are regulated by WMU ${unit}.
              </div>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      wmuLayerRef.current = layer;
      setLoadingOverlay(null);
    }).catch(() => setLoadingOverlay(null));
  }, [activeOverlays.wmu]);

  // Overlay 2: Unpatented Crown Land Parcels loader
  const loadUnpatentedOverlay = useCallback((bbox) => {
    if (!mapInstanceRef.current || !bbox) return;

    setLoadingOverlay('unpatented');
    fetchUnpatentedParcels({ bbox, limit: 120 }).then((data) => {
      if (!mapInstanceRef.current) {
        setLoadingOverlay(null);
        return;
      }

      if (unpatentedLayerRef.current) {
        mapInstanceRef.current.removeLayer(unpatentedLayerRef.current);
      }

      const layer = L.geoJSON(data, {
        style: {
          color: '#06b6d4', // Cyan
          weight: 1.5,
          fillColor: '#06b6d4',
          fillOpacity: 0.28
        },
        onEachFeature: (feat, l) => {
          const p = feat.properties || {};
          const area = p.AREA_IN_HA ? Math.round(p.AREA_IN_HA).toLocaleString() + ' ha' : 'N/A';
          const loc = p.SURVEY_LOCATION_IDENT || 'Unpatented Crown parcel';
          l.bindPopup(`
            <div style="font-family: var(--font-body); padding: 4px;">
              <strong style="color: #06b6d4; font-size: 14px;">🌲 Unpatented Crown Land Parcel</strong>
              <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                <strong>Survey:</strong> ${loc}<br/>
                <strong>Area:</strong> ${area}<br/>
                <span style="color: #22d3ee;">Official Public Crown Land Tenure</span>
              </div>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      unpatentedLayerRef.current = layer;
      setLoadingOverlay(null);
    }).catch(() => setLoadingOverlay(null));
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!activeOverlays.unpatented) {
      if (unpatentedLayerRef.current) {
        mapInstanceRef.current.removeLayer(unpatentedLayerRef.current);
        unpatentedLayerRef.current = null;
      }
      return;
    }

    const bounds = mapInstanceRef.current.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    loadUnpatentedOverlay(bbox);
  }, [activeOverlays.unpatented, loadUnpatentedOverlay]);

  // Overlay 3: Restricted Fire Zones (RFZ)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!activeOverlays.rfz) {
      if (rfzLayerRef.current) {
        mapInstanceRef.current.removeLayer(rfzLayerRef.current);
        rfzLayerRef.current = null;
      }
      return;
    }

    if (rfzLayerRef.current) return;

    setLoadingOverlay('rfz');
    fetchRestrictedFireZones().then((data) => {
      if (!mapInstanceRef.current || !activeOverlays.rfz) {
        setLoadingOverlay(null);
        return;
      }

      const layer = L.geoJSON(data, {
        style: {
          color: '#ef4444', // Red
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#ef4444',
          fillOpacity: 0.16
        },
        onEachFeature: (feat, l) => {
          const name = feat.properties?.OFFICIAL_NAME || '';
          l.bindPopup(`
            <div style="font-family: var(--font-body); padding: 4px;">
              <strong style="color: #ef4444; font-size: 14px;">🔥 Restricted Fire Zone: Zone ${name}</strong>
              <div style="color: #fca5a5; font-size: 12px; margin-top: 4px;">
                Open campfires, bonfires, and charcoal BBQs are <strong>PROHIBITED</strong> in this zone during active fire orders. Portable gas/propane camping stoves only.
              </div>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      rfzLayerRef.current = layer;
      setLoadingOverlay(null);
    }).catch(() => setLoadingOverlay(null));
  }, [activeOverlays.rfz]);

  const toggleOverlay = (key) => {
    setActiveOverlays(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle Locate Me (GPS)
  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current.flyTo([latitude, longitude], 11, { duration: 1.5 });
        L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(mapInstanceRef.current).bindPopup('Your Current Location').openPopup();
      },
      (err) => {
        alert('Could not retrieve GPS location: ' + err.message);
      }
    );
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || !geoJsonLayerRef.current) return;
    const bounds = geoJsonLayerRef.current.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Reset search this area and fly to center/zoom when district or region changes
  useEffect(() => {
    setShowSearchThisArea(false);
    if (!mapInstanceRef.current || !mapCenter) return;
    mapInstanceRef.current.flyTo(mapCenter, mapZoom, {
      duration: 1.1,
      easeLinearity: 0.25
    });
  }, [mapCenter, mapZoom]);

  // Set showSearchThisArea on map pan/zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMove = () => {
      setShowSearchThisArea(true);
    };

    map.on('dragend', handleMove);
    map.on('zoomend', handleMove);

    return () => {
      map.off('dragend', handleMove);
      map.off('zoomend', handleMove);
    };
  }, []);

  return (
    <div className="map-view-container" id="map-view-container">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="map-element" id="leaflet-map" />

      {/* Floating "Search This Map Area" Button (Triggered when user pans/zooms map) */}
      {showSearchThisArea && (
        <button
          id="btn-search-this-area"
          className="btn-search-this-area"
          onClick={() => {
            if (!mapInstanceRef.current) return;
            const bounds = mapInstanceRef.current.getBounds();
            const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
            if (onSearchBbox) {
              onSearchBbox(bbox);
            }
            setShowSearchThisArea(false);
          }}
          title="Load Crown Land policies for the currently visible map viewport"
        >
          <RotateCw size={14} />
          <span>Search This Map Area</span>
        </button>
      )}

      {/* Desktop Controls (Hidden in Split View or on Mobile to avoid any menu collision) */}
      {!isSplitView && (
        <div className="map-desktop-controls">
          {/* Basemap Switcher (Top Right) */}
          <div className="map-basemap-selector" id="basemap-selector">
            {Object.keys(BASEMAPS).map((key) => (
              <button
                key={key}
                id={`basemap-${key}`}
                className={`basemap-btn ${activeBasemap === key ? 'active' : ''}`}
                onClick={() => setActiveBasemap(key)}
              >
                {BASEMAPS[key].name}
              </button>
            ))}
          </div>

          {/* Map Overlays Toolbar (Stacked below Basemaps) */}
          <div className="map-overlay-selector" id="map-overlay-selector">
            <span className="overlay-selector-label">Overlays:</span>
            <button
              id="overlay-btn-wmu"
              className={`overlay-chip-btn ${activeOverlays.wmu ? 'active-wmu' : ''}`}
              onClick={() => toggleOverlay('wmu')}
              title="Toggle Wildlife Management Units (WMU) Hunting Boundaries"
            >
              <Crosshair size={13} />
              <span>WMU Units</span>
              {loadingOverlay === 'wmu' && <span className="spinner" style={{ width: 10, height: 10 }} />}
            </button>

            <button
              id="overlay-btn-unpatented"
              className={`overlay-chip-btn ${activeOverlays.unpatented ? 'active-unpatented' : ''}`}
              onClick={() => toggleOverlay('unpatented')}
              title="Toggle Unpatented Crown Land Parcels (Exact Public Tenure vs Private Lots)"
            >
              <Trees size={13} />
              <span>Public Parcels</span>
              {loadingOverlay === 'unpatented' && <span className="spinner" style={{ width: 10, height: 10 }} />}
            </button>

            <button
              id="overlay-btn-rfz"
              className={`overlay-chip-btn ${activeOverlays.rfz ? 'active-rfz' : ''}`}
              onClick={() => toggleOverlay('rfz')}
              title="Toggle Restricted Fire Zones (Active Fire Bans & Campfire Prohibitions)"
            >
              <Flame size={13} />
              <span>Fire Bans (RFZ)</span>
              {loadingOverlay === 'rfz' && <span className="spinner" style={{ width: 10, height: 10 }} />}
            </button>

            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

            {/* Map Legend Toggle Button */}
            <button
              id="btn-toggle-legend-top"
              className={`overlay-chip-btn ${legendOpen ? 'active-legend' : ''}`}
              onClick={() => setLegendOpen(prev => !prev)}
              title="Show or hide the on-map Crown Land Legend"
            >
              <Palette size={13} className={legendOpen ? 'text-emerald' : ''} />
              <span>Legend</span>
              <span className={`toggle-status-mini ${legendOpen ? 'on' : 'off'}`}>
                {legendOpen ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Layer Settings Button (Visible on Mobile OR in Split View to prevent collision) */}
      <button
        id="btn-mobile-layers"
        className={`mobile-layers-btn ${mobileLayersOpen ? 'active' : ''} ${isSplitView ? 'split-view-visible' : ''}`}
        onClick={() => setMobileLayersOpen(!mobileLayersOpen)}
        aria-label="Map layers and basemaps"
        title="Toggle Map Basemaps and Overlays"
      >
        <Layers size={16} />
        <span>Layers</span>
        {activeOverlayCount > 0 && (
          <span className="mobile-layers-badge">{activeOverlayCount}</span>
        )}
      </button>

      {/* Layers Drawer / Popover */}
      {mobileLayersOpen && (
        <div className="mobile-layers-popover" id="mobile-layers-popover">
          <div className="mobile-layers-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Layers size={16} className="text-emerald" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Map Layers & Overlays</span>
            </div>
            <button
              className="btn-close-popover"
              onClick={() => setMobileLayersOpen(false)}
              aria-label="Close layers menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Basemap Section */}
          <div className="mobile-layers-section">
            <div className="mobile-layers-section-title">Basemap</div>
            <div className="mobile-basemaps-grid">
              {Object.keys(BASEMAPS).map((key) => (
                <button
                  key={key}
                  className={`mobile-basemap-card ${activeBasemap === key ? 'active' : ''}`}
                  onClick={() => setActiveBasemap(key)}
                >
                  <span className="mobile-basemap-card-name">{BASEMAPS[key].name}</span>
                  {activeBasemap === key && <Check size={14} className="text-emerald" />}
                </button>
              ))}
            </div>
          </div>

          {/* Geospatial Overlays Section */}
          <div className="mobile-layers-section">
            <div className="mobile-layers-section-title">Geospatial Overlays</div>
            <div className="mobile-overlays-list">
              <button
                className={`mobile-overlay-row ${activeOverlays.wmu ? 'active-wmu' : ''}`}
                onClick={() => toggleOverlay('wmu')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Crosshair size={15} style={{ color: '#f59e0b' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>WMU Hunting Units</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wildlife management boundaries</div>
                  </div>
                </div>
                {loadingOverlay === 'wmu' ? (
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                ) : (
                  <span className={`toggle-pill ${activeOverlays.wmu ? 'on-wmu' : 'off'}`}>
                    {activeOverlays.wmu ? 'ON' : 'OFF'}
                  </span>
                )}
              </button>

              <button
                className={`mobile-overlay-row ${activeOverlays.unpatented ? 'active-unpatented' : ''}`}
                onClick={() => toggleOverlay('unpatented')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Trees size={15} style={{ color: '#06b6d4' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Public Parcels</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unpatented Crown land survey</div>
                  </div>
                </div>
                {loadingOverlay === 'unpatented' ? (
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                ) : (
                  <span className={`toggle-pill ${activeOverlays.unpatented ? 'on-unpatented' : 'off'}`}>
                    {activeOverlays.unpatented ? 'ON' : 'OFF'}
                  </span>
                )}
              </button>

              <button
                className={`mobile-overlay-row ${activeOverlays.rfz ? 'active-rfz' : ''}`}
                onClick={() => toggleOverlay('rfz')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Flame size={15} style={{ color: '#ef4444' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Fire Bans (RFZ)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Restricted fire zones</div>
                  </div>
                </div>
                {loadingOverlay === 'rfz' ? (
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                ) : (
                  <span className={`toggle-pill ${activeOverlays.rfz ? 'on-rfz' : 'off'}`}>
                    {activeOverlays.rfz ? 'ON' : 'OFF'}
                  </span>
                )}
              </button>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                className={`mobile-overlay-row ${legendOpen ? 'active-legend' : ''}`}
                onClick={() => {
                  setLegendOpen(prev => !prev);
                  setMobileLayersOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Palette size={15} className="text-emerald" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Map Legend</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Show designation colors on map</div>
                  </div>
                </div>
                <span className={`toggle-pill ${legendOpen ? 'on-legend' : 'off'}`}>
                  {legendOpen ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Left Toolbar: Legend & District Quick Switcher */}
      <div className="map-bottom-left-bar" id="map-bottom-left-bar">
        {/* Map Legend Button */}
        <button
          id="btn-map-legend"
          className={`map-legend-btn ${legendOpen ? 'active' : ''}`}
          onClick={() => setLegendOpen(!legendOpen)}
          title="View Crown Land Map Designation Legend"
        >
          <Palette size={14} />
          <span>Legend</span>
        </button>

        {/* Quick District Switcher Pill */}
        <div className="district-quick-jump">
          <button
            id="btn-district-jump"
            className="btn-district-jump"
            onClick={() => setDistrictMenuOpen(!districtMenuOpen)}
            title="Switch MNR District across Ontario"
          >
            <MapPin size={13} className="text-emerald" />
            <span>{currentDistrict ? currentDistrict.name : (currentRegion && currentRegion.id !== 'all' ? currentRegion.name : 'Explore District')}</span>
            <ChevronDown size={13} />
          </button>

          {districtMenuOpen && (
            <div className="district-dropdown-popover" id="district-dropdown-popover">
              <div className="district-dropdown-header">
                <span>Select Ontario District</span>
                <button className="btn-close-popover" onClick={() => setDistrictMenuOpen(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="district-dropdown-list">
                {MNR_DISTRICTS.map(d => (
                  <button
                    key={d.id}
                    className={`district-dropdown-item ${currentDistrict?.id === d.id ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectDistrict) onSelectDistrict(d.id);
                      setDistrictMenuOpen(false);
                      setShowSearchThisArea(false);
                    }}
                  >
                    <span>{d.name}</span>
                    <span className="district-dropdown-region">{d.region}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Map Legend Popover */}
      {legendOpen && (
        <div className="map-legend-popover" id="map-legend-popover">
          <div className="map-legend-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={15} className="text-emerald" />
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Crown Land Map Legend</span>
            </div>
            <button
              className="btn-close-popover"
              onClick={() => setLegendOpen(false)}
              aria-label="Close legend"
            >
              <X size={15} />
            </button>
          </div>

          <div className="legend-items-list">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: '#10b981' }} />
              <div>
                <div className="legend-name">General Use Area</div>
                <div className="legend-sub">Public Crown land • Free 21-day camping allowed</div>
              </div>
            </div>

            <div className="legend-item">
              <span className="legend-swatch" style={{ background: '#38bdf8' }} />
              <div>
                <div className="legend-name">Enhanced Management (EMA)</div>
                <div className="legend-sub">Multi-use Crown land • Specific recreation/resource rules</div>
              </div>
            </div>

            <div className="legend-item">
              <span className="legend-swatch" style={{ background: '#f59e0b' }} />
              <div>
                <div className="legend-name">Conservation Reserve</div>
                <div className="legend-sub">Protected nature reserve • Traditional recreation permitted</div>
              </div>
            </div>

            <div className="legend-item">
              <span className="legend-swatch" style={{ background: '#fb7185' }} />
              <div>
                <div className="legend-name">Provincial Park</div>
                <div className="legend-sub">Regulated park • Ontario Parks permit & fee required</div>
              </div>
            </div>

            <div className="legend-item">
              <span className="legend-swatch" style={{ background: '#c084fc' }} />
              <div>
                <div className="legend-name">Forest Reserve</div>
                <div className="legend-sub">Interim protected land with active mining rights</div>
              </div>
            </div>

            {activeOverlayCount > 0 && (
              <>
                <div className="legend-divider" />

                {activeOverlays.wmu && (
                  <div className="legend-item">
                    <span className="legend-swatch-line" style={{ borderColor: '#f59e0b', borderStyle: 'dashed' }} />
                    <div>
                      <div className="legend-name">WMU Hunting Boundaries</div>
                      <div className="legend-sub">Wildlife Management Units (hunting seasons & tags)</div>
                    </div>
                  </div>
                )}

                {activeOverlays.unpatented && (
                  <div className="legend-item">
                    <span className="legend-swatch" style={{ background: '#06b6d4', opacity: 0.5 }} />
                    <div>
                      <div className="legend-name">Public Crown Parcels</div>
                      <div className="legend-sub">Verified public Crown tenure vs private patented lots</div>
                    </div>
                  </div>
                )}

                {activeOverlays.rfz && (
                  <div className="legend-item">
                    <span className="legend-swatch-line" style={{ borderColor: '#ef4444', borderStyle: 'dashed' }} />
                    <div>
                      <div className="legend-name">Fire Bans (RFZ)</div>
                      <div className="legend-sub">Restricted fire zones (active campfire prohibitions)</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="legend-footer-tip">
            💡 <em>Tap any colored area on the map to see its full policy and camping rules.</em>
          </div>
        </div>
      )}

      {/* Map Control Buttons (Bottom Right) */}
      <div style={{ position: 'absolute', bottom: 85, right: 10, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          id="btn-fit-bounds"
          className="btn-header"
          onClick={handleFitBounds}
          title="Zoom to all matching areas"
          style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-glass)' }}
        >
          <Maximize2 size={16} />
        </button>
        <button
          id="btn-locate-gps"
          className="btn-header"
          onClick={handleLocateMe}
          title="Locate my position in Ontario"
          style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-glass)' }}
        >
          <Crosshair size={16} />
        </button>
      </div>
    </div>
  );
}
