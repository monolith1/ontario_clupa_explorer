import React from 'react';
import { Compass, BookOpen, Filter, SlidersHorizontal } from 'lucide-react';
import { PRESETS } from '../data/presets';

export default function Header({
  activePreset,
  onSelectPreset,
  onOpenGuide,
  sidebarOpen,
  onToggleSidebar,
  activeFilterCount = 0
}) {
  return (
    <header className="app-header" id="app-header">
      {/* Brand */}
      <div className="header-brand" id="brand-logo" onClick={() => onSelectPreset(null)}>
        <div className="brand-icon-wrapper">
          <Compass size={24} />
        </div>
        <div>
          <div className="brand-title">
            CLUPA Explorer
            <span className="brand-badge">Ontario Live</span>
          </div>
          <div className="brand-subtitle">Crown Land Use Policy Atlas & Activity Finder</div>
        </div>
      </div>

      {/* Quick Discovery Presets */}
      <div className="header-center-presets" id="header-presets">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              className={`preset-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPreset(isActive ? null : preset.id)}
              title={preset.subtitle}
            >
              <span>{preset.icon}</span>
              <span>{preset.title}</span>
            </button>
          );
        })}
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        <button
          id="btn-open-guide"
          className="btn-header"
          onClick={onOpenGuide}
          title="Ontario Crown Land Regulations, 21-day Camping Rules & Designations"
        >
          <BookOpen size={16} />
          <span>Rules Guide</span>
        </button>

        <button
          id="btn-toggle-sidebar"
          className="btn-header"
          onClick={onToggleSidebar}
          title={activeFilterCount > 0 ? `Toggle Filters Panel (${activeFilterCount} active)` : "Toggle Filters Panel"}
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="active-filters-count">{activeFilterCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
