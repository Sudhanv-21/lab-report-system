import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export function PatientForm() {
  const { activeSheet, updateActiveSheetPatient, activeTemplate } = useApp();

  if (!activeSheet) return null;
  const { patient } = activeSheet;

  const doctorOptions = activeTemplate?.doctors || ['Dr. Self', 'Dr. Sharma', 'Dr. Mehta'];

  return (
    <div className="card patient-card">
      <div className="card-header">
        <h3>Patient & Sample Details</h3>
      </div>
      <div className="form-grid">
        <div className="field-group">
          <label>Patient Name *</label>
          <input
            type="text"
            value={patient.name || ''}
            onChange={(e) => updateActiveSheetPatient('name', e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            required
          />
        </div>

        <div className="field-row">
          <div className="field-group" style={{ flex: '1' }}>
            <label>Age *</label>
            <input
              type="text"
              value={patient.age || ''}
              onChange={(e) => updateActiveSheetPatient('age', e.target.value)}
              placeholder="e.g. 42 Y"
            />
          </div>

          <div className="field-group" style={{ flex: '1' }}>
            <label>Gender *</label>
            <select
              value={patient.gender || 'M'}
              onChange={(e) => updateActiveSheetPatient('gender', e.target.value)}
            >
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
              <option value="O">Other</option>
            </select>
          </div>
        </div>

        <div className="field-group">
          <label>Ref. Doctor</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={patient.doctor || ''}
              onChange={(e) => updateActiveSheetPatient('doctor', e.target.value)}
              placeholder="Dr. Name"
              list="doctorSuggestions"
            />
            <datalist id="doctorSuggestions">
              {doctorOptions.map((doc) => (
                <option key={doc} value={doc} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group" style={{ flex: '1' }}>
            <label>Sample Date & Time</label>
            <input
              type="datetime-local"
              value={patient.sampleCollectedAt || ''}
              onChange={(e) => updateActiveSheetPatient('sampleCollectedAt', e.target.value)}
            />
          </div>

          <div className="field-group" style={{ flex: '1' }}>
            <label>Report Date</label>
            <input
              type="date"
              value={patient.reportDate || ''}
              onChange={(e) => updateActiveSheetPatient('reportDate', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
