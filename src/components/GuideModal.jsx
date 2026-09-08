import React from 'react';
import { X, Tent, Shield, AlertTriangle, Compass, CheckCircle2, Flame, ExternalLink } from 'lucide-react';

export default function GuideModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-id-row">
              <span className="brand-badge">Ontario Outdoor Guide</span>
            </div>
            <h2 className="modal-name">Crown Land Regulations & User Guide</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close guide modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Section 1: 21-Day Camping Rule */}
          <div className="policy-block">
            <div className="policy-block-title">
              <Tent size={16} className="text-emerald" />
              <span>The 21-Day Crown Land Camping Rule</span>
            </div>
            <div className="policy-text-card">
              <p style={{ marginBottom: 10 }}>
                <strong>Canadian Residents:</strong> May camp free of charge for up to <strong>21 days on any one site</strong> in a calendar year on Crown land where camping is permitted. After 21 days, you must move your person, camping unit, and equipment at least 100 metres to allow the site to regenerate.
              </p>
              <p>
                <strong>Non-Residents of Canada:</strong> Must purchase an Ontario Crown Land Camping Permit (issued per person, per night) unless you meet specific exemptions (e.g., camping in an authorized watercraft or staying at an outpost camp). Note that non-residents are restricted from camping on Crown land in designated Northern "Green Zones."
              </p>
            </div>
          </div>

          {/* Section 2: Land Designations Explained */}
          <div className="policy-block">
            <div className="policy-block-title">
              <Shield size={16} />
              <span>Crown Land Designations Explained</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="policy-text-card" style={{ borderLeft: '4px solid var(--color-general)' }}>
                <strong style={{ color: 'var(--color-general)' }}>General Use Area (G):</strong>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  Represents the majority of Ontario Crown land. Managed for multiple uses: dispersed camping, hunting, sport fishing, ATV travel, prospecting, and forestry. Minimal restrictions apply.
                </p>
              </div>

              <div className="policy-text-card" style={{ borderLeft: '4px solid var(--color-enhanced)' }}>
                <strong style={{ color: 'var(--color-enhanced)' }}>Enhanced Management Area (E):</strong>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  Special designated zones where specific values (remote recreation, fish & wildlife habitats, or access corridors) take precedence. Camping and hunting are often allowed, but road access or motorized vehicles may have restrictions.
                </p>
              </div>

              <div className="policy-text-card" style={{ borderLeft: '4px solid var(--color-conservation)' }}>
                <strong style={{ color: 'var(--color-conservation)' }}>Conservation Reserve (C):</strong>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  Protects natural heritage, old growth, and sensitive ecosystems. Non-destructive recreation (hiking, hunting, backcountry camping, fishing) is generally permitted, while commercial logging and mining exploration are prohibited.
                </p>
              </div>

              <div className="policy-text-card" style={{ borderLeft: '4px solid var(--color-park)' }}>
                <strong style={{ color: 'var(--color-park)' }}>Provincial Park (P):</strong>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  Regulated under Ontario Parks. Free dispersed camping is <strong>not</strong> permitted. Campers must obtain permits and stay at designated backcountry or frontcountry sites.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Essential Outdoor Rules */}
          <div className="policy-block">
            <div className="policy-block-title">
              <Flame size={16} style={{ color: '#f59e0b' }} />
              <span>Campfires, Safety & Ethics</span>
            </div>
            <div className="policy-text-card">
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
                <li><strong>Fire Safety:</strong> Always check whether a <em>Restricted Fire Zone (RFZ)</em> is in effect before lighting an open campfire. Keep water and a shovel nearby and drown fires completely until cold to the touch.</li>
                <li><strong>Hunting & Fishing:</strong> Carry a valid Outdoors Card and respect Wildlife Management Unit (WMU) and Fisheries Management Zone (FMZ) boundaries.</li>
                <li><strong>Vehicle & ATV Use:</strong> You must wear an approved helmet, have vehicle registration, and carry valid insurance when riding on forest access roads.</li>
                <li><strong>Leave No Trace:</strong> Pack out everything you pack in. Do not cut live standing timber or leave garbage behind.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Data source: Ontario Ministry of Natural Resources & Forestry
          </span>
          <a
            href="https://www.ontario.ca/page/recreational-activities-on-crown-land"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-modal-action btn-action-primary"
          >
            <span>Official Government Portal</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
