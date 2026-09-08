import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export function TemplatesView() {
  const {
    templates,
    deleteTemplate,
    selectedTemplateId,
    selectTemplate,
    templateDraft: draft,
    templateEditing: editing,
    templateDoctorDraft: doctorDraft,
    templateDoctorEditing: doctorEditing,
    startEditingTemplate,
    discardTemplateDraft,
    updateTemplateDraft: updateDraft,
    updateTemplateSection: updateSection,
    updateTemplateTest: updateTest,
    addTemplateSection: addSection,
    addTemplateTest: addTest,
    removeTemplateTest: removeTest,
    insertIntoTemplateFormula: insertIntoFormula,
    startEditingTemplateDoctors,
    saveTemplateDoctors,
    discardTemplateDoctors,
    createDoctorTemplate: createDoctorTemplateAction,
    setTemplateDoctorDraft,
    saveTemplate
  } = useApp();

  const [doctorName, setDoctorName] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');

  if (!draft) return null;

  const handleSaveDraft = () => {
    if (draft) saveTemplate(draft);
  };

  const handleDiscardDraft = () => {
    discardTemplateDraft();
    setNewDoctorName('');
  };

  const handleCreateDoctorTemplate = () => {
    const name = doctorName.trim();
    if (!name) return;
    createDoctorTemplateAction(name);
    setDoctorName('');
  };

  const handleAddDoctorName = () => {
    const name = newDoctorName.trim();
    if (!name) return;
    const doctors = Array.from(new Set([...(doctorDraft || []), name]));
    setTemplateDoctorDraft(doctors);
    startEditingTemplateDoctors();
    setNewDoctorName('');
  };

  const handleUpdateDoctorName = (index, value) => {
    const doctors = [...(doctorDraft || [])];
    doctors[index] = value;
    setTemplateDoctorDraft(doctors);
  };

  const handleRemoveDoctorName = (index) => {
    setTemplateDoctorDraft((doctorDraft || []).filter((_, doctorIndex) => doctorIndex !== index));
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
              <button
                key={template.id}
                className={`nav-pill ${template.id === selectedTemplateId ? 'active' : ''}`}
                style={{ textAlign: 'left', width: '100%', justifyContent: 'flex-start' }}
                type="button"
                onClick={() => selectTemplate(template.id)}
              >
                {template.forDoctor ? `${template.forDoctor} Template` : template.name}
              </button>
            ))}
          </div>
          <div className="doctor-template-panel">
            <div className="doctor-template-heading">
              <div>
                <h3>Doctors Templates</h3>
                <p>Create a doctor-specific copy or add a doctor to this template.</p>
              </div>
              <span className="doctor-template-mark">DR</span>
            </div>
            <label className="doctor-template-label">Create template for</label>
            <input
              className="doctor-template-input"
              value={doctorName}
              onChange={(event) => setDoctorName(event.target.value)}
              placeholder="e.g. Dr. Sharma"
            />
            <button className="secondary-btn doctor-template-action" type="button" onClick={handleCreateDoctorTemplate}>
              Create from selected
            </button>
          </div>
          <div className="doctor-directory-panel">
            <div className="doctor-template-heading">
              <div>
                <h3>Doctors</h3>
                <p>Names available in the Ref. Doctor search.</p>
              </div>
              <span className="doctor-count">{doctorDraft?.length || 0}</span>
            </div>
            <label className="doctor-template-label">Add doctor</label>
            <input
              className="doctor-template-input"
              value={newDoctorName}
              onChange={(event) => setNewDoctorName(event.target.value)}
              placeholder="Search or add doctor"
              list="templateDoctorSuggestions"
            />
            <datalist id="templateDoctorSuggestions">
              {(draft.doctors || []).map((doctor) => (
                <option key={doctor} value={doctor} />
              ))}
            </datalist>
            <div className="doctor-directory-actions">
              {!doctorEditing ? (
                <button className="ghost-btn doctor-template-action" type="button" onClick={startEditingTemplateDoctors}>
                  Edit doctors
                </button>
              ) : (
                <>
                  <button className="ghost-btn doctor-template-action" type="button" onClick={discardTemplateDoctors}>
                    Discard
                  </button>
                  <button className="primary-btn doctor-template-action" type="button" onClick={saveTemplateDoctors}>
                    Save doctors
                  </button>
                </>
              )}
              <button className="ghost-btn doctor-template-action" type="button" onClick={handleAddDoctorName}>
                Add doctor
              </button>
            </div>
            <div className="doctor-template-list">
              {doctorDraft?.length
                ? doctorDraft.map((doctor, index) => (
                    <div className="doctor-template-row" key={`${doctor}-${index}`}>
                      {doctorEditing ? (
                        <input
                          className="doctor-template-input"
                          value={doctor}
                          onChange={(event) => handleUpdateDoctorName(index, event.target.value)}
                        />
                      ) : (
                        <span>{doctor}</span>
                      )}
                      {doctorEditing && (
                        <button
                          className="doctor-template-remove"
                          type="button"
                          onClick={() => handleRemoveDoctorName(index)}
                          aria-label={`Remove ${doctor}`}
                          title={`Remove ${doctor}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                : 'No doctors added'}
            </div>
            {!doctorEditing && <p className="doctor-directory-hint">Use Edit doctors to rename or remove doctors.</p>}
          </div>
        </div>

        <div className="template-details card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            {editing ? (
              <input value={draft.name || ''} onChange={(event) => updateDraft({ name: event.target.value })} />
            ) : (
              <h3 style={{ margin: 0 }}>{draft.name}</h3>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>
                {draft.sections?.length || 0} Test Groups
              </span>
              {editing ? (
                <>
                  <button className="ghost-btn" type="button" onClick={handleDiscardDraft}>
                    Discard
                  </button>
                  <button className="primary-btn" type="button" onClick={handleSaveDraft}>
                    Save
                  </button>
                </>
              ) : (
                <button className="ghost-btn" type="button" onClick={startEditingTemplate}>
                  Edit
                </button>
              )}
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

                {editing && <div className="template-group-style-controls">
                  <select value={section.headingType || 'normal'} onChange={(event) => updateSection(section.id, { headingType: event.target.value })}>
                    <option value="test">Test group name</option>
                    <option value="normal">Normal heading</option>
                  </select>
                  <input type="number" min="8" max="48" placeholder="Heading size" value={section.headingStyle?.fontSize || 15} onChange={(event) => updateSection(section.id, { headingStyle: { ...section.headingStyle, fontSize: Number(event.target.value) || 15 } })} />
                  <select value={section.headingStyle?.fontFamily || ''} onChange={(event) => updateSection(section.id, { headingStyle: { ...section.headingStyle, fontFamily: event.target.value } })}>
                    <option value="">Heading font</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option>
                  </select>
                  <select value={section.headingStyle?.alignment || 'left'} onChange={(event) => updateSection(section.id, { headingStyle: { ...section.headingStyle, alignment: event.target.value } })}>
                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                  </select>
                  <label><input type="checkbox" checked={Boolean(section.headingStyle?.bold)} onChange={(event) => updateSection(section.id, { headingStyle: { ...section.headingStyle, bold: event.target.checked } })} /> Bold</label>
                  <label><input type="checkbox" checked={Boolean(section.headingStyle?.italic)} onChange={(event) => updateSection(section.id, { headingStyle: { ...section.headingStyle, italic: event.target.checked } })} /> Italic</label>
                  <label><input type="checkbox" checked={Boolean(section.headingStyle?.underline)} onChange={(event) => updateSection(section.id, { headingStyle: { ...section.headingStyle, underline: event.target.checked } })} /> Underline</label>
                  <input className="template-group-subheading" placeholder="Optional subheading under this group" value={section.subheading || ''} onChange={(event) => updateSection(section.id, { subheading: event.target.value })} />
                  <input type="number" min="8" max="36" placeholder="Subheading size" value={section.subheadingStyle?.fontSize || 12} onChange={(event) => updateSection(section.id, { subheadingStyle: { ...section.subheadingStyle, fontSize: Number(event.target.value) || 12 } })} />
                  <select value={section.subheadingStyle?.fontFamily || ''} onChange={(event) => updateSection(section.id, { subheadingStyle: { ...section.subheadingStyle, fontFamily: event.target.value } })}>
                    <option value="">Subheading font</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option>
                  </select>
                  <select value={section.subheadingStyle?.alignment || 'left'} onChange={(event) => updateSection(section.id, { subheadingStyle: { ...section.subheadingStyle, alignment: event.target.value } })}>
                    <option value="left">Subheading left</option><option value="center">Subheading center</option><option value="right">Subheading right</option>
                  </select>
                  <label><input type="checkbox" checked={Boolean(section.subheadingStyle?.bold)} onChange={(event) => updateSection(section.id, { subheadingStyle: { ...section.subheadingStyle, bold: event.target.checked } })} /> Subheading bold</label>
                  <label><input type="checkbox" checked={Boolean(section.subheadingStyle?.italic)} onChange={(event) => updateSection(section.id, { subheadingStyle: { ...section.subheadingStyle, italic: event.target.checked } })} /> Subheading italic</label>
                  <label><input type="checkbox" checked={Boolean(section.subheadingStyle?.underline)} onChange={(event) => updateSection(section.id, { subheadingStyle: { ...section.subheadingStyle, underline: event.target.checked } })} /> Subheading underline</label>
                </div>}

                <div className="table-responsive">
                  <table className="test-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Parameter</th><th>Unit</th><th>Reference Interval</th><th>Critical Limits / Formula</th>{editing && <th aria-label="Actions" />}</tr></thead>
                    <tbody>
                      {section.tests?.map((test) => (
                        <tr key={test.id}>
                          <td>{editing ? <input value={test.name || ''} onChange={(event) => updateTest(section.id, test.id, { name: event.target.value })} /> : <strong>{test.name}</strong>}</td>
                          <td>{editing ? <input value={test.unit || ''} onChange={(event) => updateTest(section.id, test.id, { unit: event.target.value })} /> : (test.unit || '—')}</td>
                          <td>{editing ? <textarea rows="2" value={test.referenceRange || ''} onChange={(event) => updateTest(section.id, test.id, { referenceRange: event.target.value })} /> : (test.referenceRange || '—')}</td>
                          <td>
                            {editing ? (
                              <div className="formula-editor-box">
                                <input
                                  placeholder="Formula (e.g. {Triglycerides} / 5 or Triglycerides / 5)"
                                  value={test.formula || ''}
                                  onChange={(event) => updateTest(section.id, test.id, { formula: event.target.value })}
                                  title="Enter calculation formula using test names or click parameter buttons below"
                                />
                                <div className="formula-chips-container">
                                  <span className="formula-chip-label">Insert:</span>
                                  {section.tests
                                    .filter((sibling) => sibling.id !== test.id && sibling.name)
                                    .map((sibling) => (
                                      <button
                                        key={sibling.id}
                                        type="button"
                                        className="formula-param-chip"
                                        onClick={() => insertIntoFormula(section.id, test.id, `{${sibling.name}}`)}
                                        title={`Insert {${sibling.name}} into formula`}
                                      >
                                        + {sibling.name}
                                      </button>
                                    ))}
                                  {['+', '-', '*', '/', '(', ')'].map((op) => (
                                    <button
                                      key={op}
                                      type="button"
                                      className="formula-operator-chip"
                                      onClick={() => insertIntoFormula(section.id, test.id, op)}
                                      title={`Insert ${op}`}
                                    >
                                      {op}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
                                  <input placeholder="Critical low" value={test.criticalLow || ''} onChange={(event) => updateTest(section.id, test.id, { criticalLow: event.target.value })} />
                                  <input placeholder="Critical high" value={test.criticalHigh || ''} onChange={(event) => updateTest(section.id, test.id, { criticalHigh: event.target.value })} />
                                </div>
                                <input placeholder="Options, comma separated" value={(test.options || []).join(', ')} onChange={(event) => updateTest(section.id, test.id, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} style={{ marginTop: '4px' }} />
                              </div>
                            ) : (
                              <>
                                {test.formula && <span className="badge" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>Formula: {test.formula}</span>}
                                {test.criticalLow && <span className="badge" style={{ color: 'var(--danger)', marginLeft: '4px' }}>Min: {test.criticalLow}</span>}
                                {test.criticalHigh && <span className="badge" style={{ color: 'var(--danger)', marginLeft: '4px' }}>Max: {test.criticalHigh}</span>}
                                {!test.formula && !test.criticalLow && !test.criticalHigh && '—'}
                              </>
                            )}
                          </td>
                          {editing && <td><button className="doctor-template-remove" type="button" onClick={() => removeTest(section.id, test.id)} aria-label={`Remove ${test.name || 'parameter'}`} title="Remove parameter">×</button></td>}
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
