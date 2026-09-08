import React from 'react';
import { Search, X, RotateCcw, MapPin, Layers, Sparkles, Tent, Crosshair, Fish, Compass, Navigation, Snowflake, Footprints, Anchor, Apple, Pickaxe, Trees, Home } from 'lucide-react';
import { MNR_REGIONS, MNR_DISTRICTS, POPULAR_TOWNS } from '../data/districts';
import { ACTIVITIES, LAND_DESIGNATIONS } from '../data/activities';

// Map icon string to Lucide component
const ICON_MAP = {
  Tent,
  Crosshair,
  Fish,
  Compass,
  Navigation,
  Snowflake,
  Footprints,
  Anchor,
  Apple,
  Pickaxe,
  Trees,
  Home
};

export default function FilterPanel({
  filters,
  onChangeFilters,
  onResetFilters,
  onSelectTown,
  matchingCount,
  loading,
  collapsed
}) {
  const {
    keyword,
    districtId,
    regionId,
    designations,
    activities
  } = filters;

  // Filter districts based on selected region
  const filteredDistricts = MNR_DISTRICTS.filter(d => 
    !regionId || regionId === 'all' || d.region === regionId
  );

  const handleTextChange = (e) => {
    onChangeFilters({ ...filters, keyword: e.target.value });
  };

  const handleClearText = () => {
    onChangeFilters({ ...filters, keyword: '' });
  };

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    onChangeFilters({
      ...filters,
      regionId: newRegion,
      districtId: '' // reset district if region changes
    });
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    onChangeFilters({ ...filters, districtId: newDistrict });
  };

  const handleToggleDesignation = (name) => {
    const exists = designations.includes(name);
    const updated = exists
      ? designations.filter(d => d !== name)
      : [...designations, name];
    onChangeFilters({ ...filters, designations: updated });
  };

  const handleActivityStatusChange = (activityId, newStatus) => {
    // newStatus: 'any' | 'Yes' | 'Maybe' | 'No'
    const updated = { ...activities };
    if (newStatus === 'any') {
      delete updated[activityId];
    } else {
      updated[activityId] = newStatus;
    }
    onChangeFilters({ ...filters, activities: updated });
  };

  const activeActivityFilterCount = Object.keys(activities).length;
  const isFiltered = keyword || districtId || (regionId && regionId !== 'all') || designations.length > 0 || activeActivityFilterCount > 0;

  return (
    <aside className={`sidebar-panel ${collapsed ? 'collapsed' : ''}`} id="sidebar-filters">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-title-group">
          <Layers size={18} className="text-emerald" />
          <h2 className="sidebar-title">Filters & Activities</h2>
          {matchingCount !== null && (
            <span className="filter-count-badge" id="results-count-badge">
              {loading ? '...' : matchingCount}
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            id="btn-reset-all-filters"
            className="btn-reset-filters"
            onClick={onResetFilters}
            title="Reset all search filters"
          >
            <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
            Reset
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {/* 1. Keyword / Policy ID Search */}
        <section className="filter-section">
          <label className="filter-section-title" htmlFor="filter-search-input">
            <span>Search Area or Policy ID</span>
            {keyword && <span style={{ textTransform: 'none', color: 'var(--emerald-primary)' }}>Active</span>}
          </label>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              id="filter-search-input"
              type="text"
              className="search-input"
              placeholder="e.g. G362, Nestor Falls, Parry Sound..."
              value={keyword}
              onChange={handleTextChange}
            />
            {keyword && (
              <button
                id="btn-clear-search"
                className="search-clear-btn"
                onClick={handleClearText}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>

        {/* 2. District & Region */}
        <section className="filter-section">
          <div className="filter-section-title">
            <span>MNR District & Region</span>
            <MapPin size={14} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Region Dropdown */}
            <div className="select-wrapper">
              <select
                id="select-region"
                className="custom-select"
                value={regionId || 'all'}
                onChange={handleRegionChange}
              >
                {MNR_REGIONS.map(reg => (
                  <option key={reg.id} value={reg.id}>{reg.name}</option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <div className="select-wrapper">
              <select
                id="select-district"
                className="custom-select"
                value={districtId || ''}
                onChange={handleDistrictChange}
              >
                <option value="">-- All Districts ({filteredDistricts.length}) --</option>
                {filteredDistricts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Towns shortcut */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '100%' }}>Popular Hubs:</span>
              {POPULAR_TOWNS.slice(0, 6).map(town => (
                <button
                  key={town.name}
                  className="status-pill"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
                  onClick={() => onSelectTown(town)}
                >
                  {town.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Land Designation Filter */}
        <section className="filter-section">
          <div className="filter-section-title">
            <span>Land Designation</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
              {designations.length === 0 ? 'All Types' : `${designations.length} Selected`}
            </span>
          </div>

          <div className="designation-grid">
            {LAND_DESIGNATIONS.map((desig) => {
              const isSelected = designations.includes(desig.name);
              return (
                <div
                  key={desig.code}
                  id={`designation-card-${desig.code}`}
                  className={`designation-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleDesignation(desig.name)}
                  title={desig.description}
                  style={{ '--card-border': desig.color }}
                >
                  <div
                    className="designation-indicator"
                    style={{ backgroundColor: desig.color }}
                  />
                  <span>{desig.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Permitted Activity Multi-Filter */}
        <section className="filter-section">
          <div className="filter-section-title">
            <span>Permitted Activities & Uses</span>
            <Sparkles size={14} style={{ color: 'var(--emerald-primary)' }} />
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            Toggle whether each activity must be Permitted (Yes), Conditional (Maybe), or Prohibited (No).
          </p>

          <div className="activity-filters-container">
            {ACTIVITIES.map((activity) => {
              const currentStatus = activities[activity.id] || 'any';
              const IconComponent = ICON_MAP[activity.icon] || Compass;
              const isFiltered = currentStatus !== 'any';

              return (
                <div
                  key={activity.id}
                  id={`activity-row-${activity.id}`}
                  className={`activity-filter-row ${isFiltered ? 'active' : ''}`}
                >
                  <div className="activity-info" title={activity.description}>
                    <div className="activity-icon">
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <div className="activity-name">{activity.shortName}</div>
                    </div>
                  </div>

                  {/* Status Toggle Pills: Any | Yes | Maybe | No */}
                  <div className="status-pill-group">
                    <button
                      className={`status-pill ${currentStatus === 'any' ? 'active-any' : ''}`}
                      onClick={() => handleActivityStatusChange(activity.id, 'any')}
                      title="No restriction on this activity"
                    >
                      Any
                    </button>
                    <button
                      className={`status-pill ${currentStatus === 'Yes' ? 'active-yes' : ''}`}
                      onClick={() => handleActivityStatusChange(activity.id, 'Yes')}
                      title="Must be explicitly permitted (Yes)"
                    >
                      Yes
                    </button>
                    <button
                      className={`status-pill ${currentStatus === 'Maybe' ? 'active-maybe' : ''}`}
                      onClick={() => handleActivityStatusChange(activity.id, 'Maybe')}
                      title="Conditional / with guidelines"
                    >
                      Maybe
                    </button>
                    <button
                      className={`status-pill ${currentStatus === 'No' ? 'active-no' : ''}`}
                      onClick={() => handleActivityStatusChange(activity.id, 'No')}
                      title="Prohibited / Not permitted"
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
