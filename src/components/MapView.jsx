import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { LAND_DESIGNATIONS } from '../data/activities';

// Tile Layer definitions
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
  mapCenter = [46.0, -80.0],
  mapZoom = 7,
  onBoundsChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const labelLayerRef = useRef(null);
  const [activeBasemap, setActiveBasemap] = useState('dark');

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
        if (onBoundsChange) {
          const bounds = map.getBounds();
          onBoundsChange([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ]);
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

    // Remove existing tile and label layers
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

  // Update GeoJSON Polygons
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
        `, { sticky: true, className: 'map-custom-tooltip' });

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

  return (
    <div className="map-view-container" id="map-view-container">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="map-element" id="leaflet-map" />

      {/* Basemap Switcher */}
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

      {/* Map Control Buttons */}
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
