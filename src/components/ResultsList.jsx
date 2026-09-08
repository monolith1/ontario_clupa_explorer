import React, { useState } from 'react';
import { MapPin, Info, ArrowUpDown, Tent, Crosshair, Compass, Fish } from 'lucide-react';
import { LAND_DESIGNATIONS } from '../data/activities';

function getDesignationBadgeClass(designation) {
  if (!designation) return 'badge-general';
  const found = LAND_DESIGNATIONS.find(d => 
    d.name.toLowerCase() === designation.toLowerCase() ||
    designation.toLowerCase().includes(d.name.toLowerCase())
  );
  return found ? found.badgeClass : 'badge-general';
}

export default function ResultsList({
  features = [],
  permittedUsesMap = {},
  selectedFeature,
  onSelectFeature,
  onInspectPolicy,
  loading
}) {
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'size' | 'id'

  // Sort features
  const sortedFeatures = [...features].sort((a, b) => {
    const propsA = a.properties || {};
    const propsB = b.properties || {};

    if (sortBy === 'size') {
      const sizeA = propsA.SYS_AREA || 0;
      const sizeB = propsB.SYS_AREA || 0;
      return sizeB - sizeA;
    }
    if (sortBy === 'id') {
      const idA = propsA.POLICY_IDENT || '';
      const idB = propsB.POLICY_IDENT || '';
      return idA.localeCompare(idB);
    }
    // Default: name
    const nameA = propsA.NAME_ENG || propsA.POLICY_IDENT || '';
    const nameB = propsB.NAME_ENG || propsB.POLICY_IDENT || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="results-panel-container" id="results-panel-container">
      {/* Top Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1400,
        margin: '0 auto 18px',
        padding: '0 4px'
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{features.length}</strong> Crown Land policy areas
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            id="sort-results-select"
            className="custom-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name (A-Z)</option>
            <option value="size">Sort by Size (Largest)</option>
            <option value="id">Sort by Policy ID</option>
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      {sortedFeatures.length > 0 ? (
        <div className="results-grid" id="results-grid">
          {sortedFeatures.map((feature) => {
            const props = feature.properties || {};
            const ident = props.POLICY_IDENT || 'Area';
            const name = props.NAME_ENG || 'Crown Land Area';
            const desig = props.DESIGNATION_ENG || 'General Use Area';
            const ogfId = props.OGF_ID;
            const sizeHa = props.SYS_AREA ? Math.round(props.SYS_AREA / 10000).toLocaleString() : 'N/A';
            const isSelected = selectedFeature && selectedFeature.properties?.POLICY_IDENT === ident;
            const badgeClass = getDesignationBadgeClass(desig);

            // Check permitted uses if available
            const uses = ogfId && permittedUsesMap[ogfId] ? permittedUsesMap[ogfId] : [];
            const campingUse = uses.find(u => u.PERMITTED_USE_TYPE_ENG?.includes('Crown Land Recreation') || u.PERMITTED_USE_TYPE_ENG?.includes('Campground'));
            const huntingUse = uses.find(u => u.PERMITTED_USE_TYPE_ENG === 'Hunting');
            const atvUse = uses.find(u => u.PERMITTED_USE_TYPE_ENG?.includes('All Terrain Vehicle Use, On Trails'));
            const fishUse = uses.find(u => u.PERMITTED_USE_TYPE_ENG === 'Sport Fishing');

            return (
              <div
                key={ident}
                id={`card-${ident}`}
                className={`area-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectFeature(feature)}
              >
                <div>
                  <div className="area-card-top">
                    <div className="area-card-ident">
                      <span>{ident}</span>
                      <span className={`map-popup-badge ${badgeClass}`}>{desig}</span>
                    </div>
                  </div>

                  <h3 className="area-card-name">{name}</h3>

                  <div className="area-card-meta">
                    <span>📐 {sizeHa} ha</span>
                    {props.CATEGORY_ENG && <span>• {props.CATEGORY_ENG}</span>}
                  </div>

                  {/* Activity preview badges */}
                  <div className="area-quick-badges">
                    {campingUse && (
                      <span className={`quick-badge badge-${campingUse.PERMITTED_FLG_ENG?.toLowerCase()}`}>
                        <Tent size={12} />
                        Camping: {campingUse.PERMITTED_FLG_ENG}
                      </span>
                    )}
                    {huntingUse && (
                      <span className={`quick-badge badge-${huntingUse.PERMITTED_FLG_ENG?.toLowerCase()}`}>
                        <Crosshair size={12} />
                        Hunting: {huntingUse.PERMITTED_FLG_ENG}
                      </span>
                    )}
                    {atvUse && (
                      <span className={`quick-badge badge-${atvUse.PERMITTED_FLG_ENG?.toLowerCase()}`}>
                        <Compass size={12} />
                        ATV: {atvUse.PERMITTED_FLG_ENG}
                      </span>
                    )}
                    {fishUse && (
                      <span className={`quick-badge badge-${fishUse.PERMITTED_FLG_ENG?.toLowerCase()}`}>
                        <Fish size={12} />
                        Fishing: {fishUse.PERMITTED_FLG_ENG}
                      </span>
                    )}
                  </div>
                </div>

                <div className="area-card-actions">
                  <button
                    className="btn-card-map"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFeature(feature);
                    }}
                  >
                    <MapPin size={14} />
                    <span>View on Map</span>
                  </button>

                  <button
                    className="btn-card-details"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectPolicy(feature);
                    }}
                  >
                    <Info size={14} />
                    <span>Inspect Policy</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Info size={28} />
          </div>
          <h3 className="empty-state-title">No Crown Land Areas Found</h3>
          <p className="empty-state-desc">
            No policy areas match your current combination of filters. Try selecting a different district, removing some activity restrictions, or clearing your search term.
          </p>
        </div>
      )}
    </div>
  );
}
