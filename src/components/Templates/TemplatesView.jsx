import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export function TemplatesView() {
  const { templates, saveTemplate, deleteTemplate } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => templates[0]?.id || '');

  const activeTmpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="view-container templates-view">
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <h2>Test Templates & Reference Range Builder</h2>
        <p className="muted-text">Manage test profiles, biological intervals, and automated formula parameters.</p>
      </div>

      <div className="templates-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
        <div className="templates-sidebar card">
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Templates</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                className={`nav-pill ${tmpl.id === activeTmpl?.id ? 'active' : ''}`}
                style={{ textAlign: 'left', width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setSelectedTemplateId(tmpl.id)}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        <div className="template-details card">
          {activeTmpl ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{activeTmpl.name}</h3>
                <span className="badge" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  {activeTmpl.sections?.length || 0} Test Groups
                </span>
              </div>

              <div className="sections-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeTmpl.sections?.map((section) => (
                  <div key={section.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: 'var(--primary-strong)' }}>{section.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {section.tests?.length || 0} Subtests
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="test-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Unit</th>
                            <th>Reference Interval</th>
                            <th>Critical Limits / Formula</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.tests?.map((t) => (
                            <tr key={t.id}>
                              <td><strong>{t.name}</strong></td>
                              <td>{t.unit || '—'}</td>
                              <td>{t.referenceRange || '—'}</td>
                              <td>
                                {t.formula && <span className="badge">Formula: {t.formula}</span>}
                                {t.criticalLow && <span className="badge" style={{ color: 'var(--danger)' }}>Min: {t.criticalLow}</span>}
                                {t.criticalHigh && <span className="badge" style={{ color: 'var(--danger)' }}>Max: {t.criticalHigh}</span>}
                                {!t.formula && !t.criticalLow && !t.criticalHigh && '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted-text">Select a template to inspect details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
