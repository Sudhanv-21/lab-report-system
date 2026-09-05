import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { createId } from '../../utils/formatters.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

export function TemplatesView() {
  const { templates, saveTemplate, deleteTemplate } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => templates[0]?.id || '');
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  const activeTmpl = templates.find((template) => template.id === selectedTemplateId) || templates[0];

  useEffect(() => {
    setDraft(activeTmpl ? clone(activeTmpl) : null);
    setEditing(false);
  }, [selectedTemplateId, templates]);

  if (!draft) return null;

  const updateDraft = (changes) => setDraft((current) => ({ ...current, ...changes }));
  const updateSection = (sectionId, changes) => updateDraft({
    sections: draft.sections.map((section) => section.id === sectionId ? { ...section, ...changes } : section)
  });
  const updateTest = (sectionId, testId, changes) => updateSection(sectionId, {
    tests: draft.sections.find((section) => section.id === sectionId).tests.map((test) => test.id === testId ? { ...test, ...changes } : test)
  });
  const saveDraft = () => {
    saveTemplate(clone(draft));
    setEditing(false);
  };
  const createDoctorTemplate = () => {
    const name = doctorName.trim();
    if (!name) return;
    const doctor = name.startsWith('Dr.') ? name : `Dr. ${name}`;
    const next = { ...clone(draft), id: `doctor-${createId()}`, name: `${doctor} Template`, forDoctor: doctor, doctors: [doctor] };
    saveTemplate(next);
    setDoctorName('');
    setSelectedTemplateId(next.id);
  };
  const addSection = () => {
    const section = { id: createId(), name: 'New test group', tests: [] };
    updateDraft({ sections: [...draft.sections, section] });
  };
  const addTest = (sectionId) => {
    const section = draft.sections.find((item) => item.id === sectionId);
    updateSection(sectionId, { tests: [...section.tests, { id: createId(), name: 'New parameter', unit: '', referenceRange: '', options: [], abnormalOptions: [], criticalOptions: [], criticalLow: '', criticalHigh: '', formula: '' }] });
  };

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
            {templates.map((template) => (
              <button key={template.id} className={`nav-pill ${template.id === draft.id ? 'active' : ''}`} style={{ textAlign: 'left', width: '100%', justifyContent: 'flex-start' }} type="button" onClick={() => setSelectedTemplateId(template.id)}>
                {template.forDoctor ? `${template.forDoctor} Template` : template.name}
              </button>
            ))}
          </div>
          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Doctors Templates</h3>
          <input value={doctorName} onChange={(event) => setDoctorName(event.target.value)} placeholder="Doctor name" />
          <button className="secondary-btn" type="button" style={{ width: '100%', marginTop: '8px' }} onClick={createDoctorTemplate}>Create from selected</button>
        </div>

        <div className="template-details card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            {editing ? <input value={draft.name || ''} onChange={(event) => updateDraft({ name: event.target.value })} /> : <h3 style={{ margin: 0 }}>{draft.name}</h3>}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>{draft.sections?.length || 0} Test Groups</span>
              <button className={editing ? 'primary-btn' : 'ghost-btn'} type="button" onClick={() => editing ? saveDraft() : setEditing(true)}>{editing ? 'Save' : 'Edit'}</button>
            </div>
          </div>

          {editing && (
            <div className="field-group" style={{ marginBottom: '16px' }}>
              <label>Assigned doctor</label>
              <input value={draft.forDoctor || ''} placeholder="Default template" onChange={(event) => updateDraft({ forDoctor: event.target.value || null, doctors: event.target.value ? [event.target.value] : draft.doctors })} />
            </div>
          )}

          <div className="sections-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {draft.sections?.map((section) => (
              <div key={section.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  {editing ? <input value={section.name} onChange={(event) => updateSection(section.id, { name: event.target.value })} /> : <h4 style={{ margin: 0, color: 'var(--primary-strong)' }}>{section.name}</h4>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{section.tests?.length || 0} Subtests</span>
                </div>

                <div className="table-responsive">
                  <table className="test-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Parameter</th><th>Unit</th><th>Reference Interval</th><th>Critical Limits / Formula</th></tr></thead>
                    <tbody>
                      {section.tests?.map((test) => (
                        <tr key={test.id}>
                          <td>{editing ? <input value={test.name || ''} onChange={(event) => updateTest(section.id, test.id, { name: event.target.value })} /> : <strong>{test.name}</strong>}</td>
                          <td>{editing ? <input value={test.unit || ''} onChange={(event) => updateTest(section.id, test.id, { unit: event.target.value })} /> : (test.unit || '—')}</td>
                          <td>{editing ? <textarea rows="2" value={test.referenceRange || ''} onChange={(event) => updateTest(section.id, test.id, { referenceRange: event.target.value })} /> : (test.referenceRange || '—')}</td>
                          <td>
                            {editing ? <>
                              <input placeholder="Formula" value={test.formula || ''} onChange={(event) => updateTest(section.id, test.id, { formula: event.target.value })} />
                              <input placeholder="Critical low" value={test.criticalLow || ''} onChange={(event) => updateTest(section.id, test.id, { criticalLow: event.target.value })} />
                              <input placeholder="Critical high" value={test.criticalHigh || ''} onChange={(event) => updateTest(section.id, test.id, { criticalHigh: event.target.value })} />
                              <input placeholder="Options, comma separated" value={(test.options || []).join(', ')} onChange={(event) => updateTest(section.id, test.id, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
                            </> : <>
                              {test.formula && <span className="badge">Formula: {test.formula}</span>}
                              {test.criticalLow && <span className="badge" style={{ color: 'var(--danger)' }}>Min: {test.criticalLow}</span>}
                              {test.criticalHigh && <span className="badge" style={{ color: 'var(--danger)' }}>Max: {test.criticalHigh}</span>}
                              {!test.formula && !test.criticalLow && !test.criticalHigh && '—'}
                            </>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editing && <button className="secondary-btn" type="button" onClick={() => addTest(section.id)}>+ Add parameter</button>}
              </div>
            ))}
          </div>

          {editing && <button className="secondary-btn" type="button" onClick={addSection}>+ Add test group</button>}
          {editing && draft.forDoctor && <button className="ghost-btn" type="button" style={{ marginLeft: '8px' }} onClick={() => deleteTemplate(draft.id)}>Delete doctor template</button>}
        </div>
      </div>
    </div>
  );
}
