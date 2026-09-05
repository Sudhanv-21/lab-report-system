import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  isAbnormalResult,
  isCriticalResult,
  extractGenderRangeSegment
} from '../../utils/clinicalCalculations.js';
import { formatSavedAt } from '../../utils/formatters.js';

export function PrintPreviewModal() {
  const { previewReport, setPreviewReport, settings } = useApp();

  if (!previewReport) return null;

  const { patient, tests, savedAt } = previewReport;
  const gender = patient?.gender || 'M';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="preview-overlay">
      <div className="preview-panel">
        <header className="preview-header no-print">
          <div>
            <h2 style={{ margin: 0 }}>Print Preview</h2>
            <p className="muted-text" style={{ margin: '4px 0 0' }}>
              Review report layout before printing or saving to PDF.
            </p>
          </div>
          <div className="preview-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="ghost-btn" onClick={() => setPreviewReport(null)}>
              Close
            </button>
            <button className="primary-btn" onClick={handlePrint}>
              Print / Save PDF
            </button>
          </div>
        </header>

        <div className="preview-body" id="printableReport">
          {/* Keep the configurable blank letterhead space without printing lab branding. */}
          {settings.letterheadSpacing > 0 && <div style={{ height: `${settings.letterheadSpacing}px` }} />}

          {/* Patient Metadata Grid */}
          <div className={`print-patient-meta ${settings.metaBoxed ? 'boxed-meta' : ''}`} style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', border: '1px solid #d7e3ee', padding: '12px', borderRadius: '6px' }}>
              <div><strong>Patient Name:</strong> {patient?.name || '—'}</div>
              <div><strong>Sample Date:</strong> {patient?.sampleCollectedAt ? patient.sampleCollectedAt.replace('T', ' ') : '—'}</div>
              <div><strong>Age / Gender:</strong> {patient?.age || '—'} / {gender === 'F' ? 'Female' : gender === 'O' ? 'Other' : 'Male'}</div>
              <div><strong>Report Date:</strong> {patient?.reportDate || (savedAt ? formatSavedAt(savedAt) : '—')}</div>
              <div><strong>Ref. By Doctor:</strong> {patient?.doctor || 'Self'}</div>
              <div><strong>Report ID:</strong> {previewReport.historyId || previewReport.id || 'LR-TEMP'}</div>
            </div>
          </div>

          {/* Tests Table */}
          <div className="print-tests-container">
            <table className="print-results-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #d7e3ee', textAlign: 'left', color: '#5d7287' }}>
                  <th style={{ padding: '6px', width: '38%' }}>Test / Parameter</th>
                  <th style={{ padding: '6px', width: '22%' }}>Observed Value</th>
                  <th style={{ padding: '6px', width: '15%' }}>Unit</th>
                  <th style={{ padding: '6px', width: '25%' }}>Biological Ref. Interval</th>
                </tr>
              </thead>
              <tbody>
                {tests?.map((group) => (
                  <React.Fragment key={group.id}>
                    <tr className="print-main-heading-row">
                      <td colSpan="4" style={{ padding: '10px 6px 4px', fontWeight: group.headingStyle?.bold ? '700' : '600', fontSize: `${group.headingStyle?.fontSize || 15}px`, textAlign: group.headingStyle?.alignment || 'left', fontStyle: group.headingStyle?.italic ? 'italic' : 'normal', textDecoration: group.headingStyle?.underline ? 'underline' : 'none' }}>
                        {group.name}
                      </td>
                    </tr>
                    {group.subheading && <tr className="print-subheading-row">
                      <td colSpan="4" style={{ padding: '0 6px 7px', color: '#5d7287', fontSize: `${group.subheadingStyle?.fontSize || 12}px`, textAlign: group.subheadingStyle?.alignment || 'left', fontWeight: group.subheadingStyle?.bold ? '700' : 'normal', fontStyle: group.subheadingStyle?.italic ? 'italic' : 'normal', textDecoration: group.subheadingStyle?.underline ? 'underline' : 'none' }}>
                        {group.subheading}
                      </td>
                    </tr>}
                    {group.tests?.map((t) => {
                      const abnormal = isAbnormalResult(t, gender);
                      const critical = isCriticalResult(t, gender);
                      const genderRange = extractGenderRangeSegment(t.referenceRange, gender);

                      const style = t.style || {};
                      const textStyle = {
                        fontSize: `${style.fontSize || 14}px`,
                        textAlign: style.alignment || 'left',
                        fontWeight: style.bold ? '700' : abnormal || critical ? '700' : 'normal',
                        fontStyle: style.italic ? 'italic' : 'normal',
                        textDecoration: style.underline ? 'underline' : 'none'
                      };

                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #edf3f6' }}>
                          <td style={{ padding: '6px', verticalAlign: 'top', ...textStyle }}>{t.name}</td>
                          <td style={{ padding: '6px', verticalAlign: 'top', ...textStyle, color: critical ? '#d74a4a' : abnormal ? '#163256' : 'inherit' }}>{t.value || '—'} {critical ? ' (Critical)' : abnormal ? ' *' : ''}</td>
                          <td style={{ padding: '6px', verticalAlign: 'top', color: '#5d7287' }}>{t.unit || '—'}</td>
                          <td style={{ padding: '6px', verticalAlign: 'top', color: '#5d7287', whiteSpace: 'pre-line' }}>{genderRange || t.referenceRange || '—'}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* End of Report & Signatures */}
          <div style={{ textAlign: 'center', margin: '24px 0 12px', fontSize: '0.8rem', color: '#8c9ba5' }}>
            *** END OF REPORT ***
          </div>

          <div className="print-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: '#5d7287' }}>
              <div>Printed: {new Date().toLocaleString()}</div>
              <div>Report generated by Arun Clinical Lab</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              {settings.signatureImage && (
                <img
                  src={settings.signatureImage}
                  alt="Pathologist Signature"
                  style={{ maxHeight: '60px', marginBottom: '4px' }}
                />
              )}
              <div style={{ borderTop: '1px solid #000', width: '180px', paddingTop: '4px', fontWeight: '600', fontSize: '0.85rem' }}>
                Medical Lab Technologist / Pathologist
              </div>
            </div>
          </div>

          {settings.footerSpacing > 0 && (
            <div style={{ height: `${settings.footerSpacing}px` }} />
          )}
        </div>
      </div>
    </div>
  );
}
