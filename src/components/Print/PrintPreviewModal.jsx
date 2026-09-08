import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  isAbnormalResult,
  isCriticalResult,
  extractGenderRangeSegment
} from '../../utils/clinicalCalculations.js';
import { formatSavedAt } from '../../utils/formatters.js';
import { paginateTestGroups } from '../../utils/reportPagination.js';

const PAGE_FORMAT_OPTIONS = [
  { id: 'a4', label: 'A4', sizeDetail: '210 × 297 mm', cssSize: 'A4 portrait', margin: '10mm' },
  { id: 'letter', label: 'Letter', sizeDetail: '8.5 × 11 in', cssSize: 'letter portrait', margin: '10mm' },
  { id: 'legal', label: 'Legal', sizeDetail: '8.5 × 14 in', cssSize: 'legal portrait', margin: '10mm' },
  { id: 'a5', label: 'A5', sizeDetail: '148 × 210 mm', cssSize: 'A5 portrait', margin: '8mm' }
];

export function PrintPreviewModal() {
  const { previewReport, setPreviewReport, settings } = useApp();
  const [pageFormat, setPageFormat] = useState(() => settings.pageFormat || 'a4');
  const [density, setDensity] = useState('auto');
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [includeUnitsAsSeparateField, setIncludeUnitsAsSeparateField] = useState(false);
  const [showGenderSpecificRange, setShowGenderSpecificRange] = useState(false);

  if (!previewReport) return null;

  const currentFormat = PAGE_FORMAT_OPTIONS.find((f) => f.id === pageFormat) || PAGE_FORMAT_OPTIONS[0];
  const { patient, tests, savedAt } = previewReport;
  const gender = patient?.gender || 'M';

  const paginatedPages = paginateTestGroups(tests, {
    pageFormat,
    letterheadSpacing: settings.letterheadSpacing || 0,
    footerSpacing: settings.footerSpacing || 0,
    density
  });

  const handlePrint = () => {
    window.print();
  };

  const formatReferenceRange = (range) => {
    if (!range) return '—';
    const text = String(range).replace(/\s*\|\s*/g, '\n');
    if (!showGenderSpecificRange) return text;
    return extractGenderRangeSegment(text, gender).replace(/\s*\|\s*/g, '\n');
  };

  return (
    <div className="preview-overlay">
      <style>
        {`
          @page {
            size: ${currentFormat.cssSize};
            margin: 0 !important;
          }
        `}
      </style>
      <div className="preview-panel">
        <header className="preview-header no-print">
          <div>
            <h2 style={{ margin: 0 }}>Print Preview</h2>
            <p className="muted-text" style={{ margin: '4px 0 0' }}>
              Review report layout before printing or saving to PDF ({paginatedPages.length} {paginatedPages.length === 1 ? 'page' : 'pages'}).
            </p>
          </div>
          <div className="preview-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="preview-format-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="pageFormatSelect" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)' }}>
                Page:
              </label>
              <select
                id="pageFormatSelect"
                value={pageFormat}
                onChange={(event) => setPageFormat(event.target.value)}
                style={{
                  fontSize: '0.82rem',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                {PAGE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} ({opt.sizeDetail})
                  </option>
                ))}
              </select>
            </div>

            <div className="preview-format-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="densitySelect" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)' }}>
                Spacing:
              </label>
              <select
                id="densitySelect"
                value={density}
                onChange={(event) => setDensity(event.target.value)}
                style={{
                  fontSize: '0.82rem',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                <option value="auto">Auto ({paginatedPages.length} {paginatedPages.length === 1 ? 'Page' : 'Pages'})</option>
                <option value="compact">Compact (More per page)</option>
                <option value="spacious">Spacious (Fewer per page)</option>
              </select>
            </div>

            <label className="print-unit-toggle">
              <input
                type="checkbox"
                checked={includeUnitsAsSeparateField}
                onChange={(event) => setIncludeUnitsAsSeparateField(event.target.checked)}
              />
              Units column
            </label>
            <label className="print-unit-toggle">
              <input
                type="checkbox"
                checked={showGenderSpecificRange}
                onChange={(event) => setShowGenderSpecificRange(event.target.checked)}
              />
              Gender range only
            </label>
            <label className="print-unit-toggle">
              <input
                type="checkbox"
                checked={showPageNumbers}
                onChange={(event) => setShowPageNumbers(event.target.checked)}
              />
              Page numbers
            </label>
            <button className="ghost-btn" onClick={() => setPreviewReport(null)}>
              Close
            </button>
            <button className="primary-btn" onClick={handlePrint}>
              Print / Save PDF
            </button>
          </div>
        </header>

        <div className="preview-body">
          <div className="preview-pages-container" id="printableReport">
            {paginatedPages.map((pageData) => {
              const isLastPage = pageData.pageNumber === pageData.totalPages;

              return (
                <div key={`page-${pageData.pageNumber}`} className="preview-page-wrapper">
                  {pageData.totalPages > 1 && (
                    <div className="preview-page-badge no-print">
                      Page {pageData.pageNumber} of {pageData.totalPages}
                    </div>
                  )}

                  <div className={`preview-page-sheet sheet-${pageFormat}`}>
                    {/* Letterhead Spacing (repeats on every page) */}
                    <div
                      className="print-empty-header"
                      style={{ height: `${Math.max(settings.letterheadSpacing || 0, 42)}px` }}
                      aria-hidden="true"
                    />

                    {/* Patient Metadata Grid (repeats identically on every page) */}
                    <div className={`print-patient-meta ${settings.metaBoxed ? 'boxed-meta' : ''}`} style={{ marginBottom: '14px', fontSize: '0.9rem' }}>
                      <div className="print-patient-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(220px, 0.75fr)', gap: '8px 24px', border: '1px solid #d7e3ee', padding: '10px 12px', borderRadius: '6px' }}>
                        <div className="print-meta-left"><strong>Patient Name:</strong> {patient?.name || '—'}</div>
                        <div className="print-meta-right"><strong>Sample Date:</strong> {patient?.sampleCollectedAt ? patient.sampleCollectedAt.replace('T', ' ') : '—'}</div>
                        <div className="print-meta-left"><strong>Age / Gender:</strong> {patient?.age || '—'} / {gender === 'F' ? 'Female' : gender === 'O' ? 'Other' : 'Male'}</div>
                        <div className="print-meta-right"><strong>Report Date:</strong> {patient?.reportDate || (savedAt ? formatSavedAt(savedAt) : '—')}</div>
                        <div className="print-meta-left"><strong>Ref. By Doctor:</strong> {patient?.doctor || 'Self'}</div>
                        <div className="print-meta-right"><strong>Report ID:</strong> {previewReport.historyId || previewReport.id || 'LR-TEMP'}</div>
                      </div>
                    </div>

                    {/* Test Parameters Table with repeated column headers */}
                    <div className="print-tests-container" style={{ flex: '1 0 auto' }}>
                      <table className="print-results-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.88rem' }}>
                        <thead>
                          <tr className="print-table-header-row" style={{ textAlign: 'left', color: '#5d7287', borderBottom: '1px solid #d7e3ee' }}>
                            <th style={{ padding: '5px 6px', width: includeUnitsAsSeparateField ? '38%' : '42%', fontWeight: '700' }}>Test / Parameter</th>
                            <th style={{ padding: '5px 6px', width: includeUnitsAsSeparateField ? '22%' : '28%', fontWeight: '700' }}>Result Value</th>
                            {includeUnitsAsSeparateField && <th style={{ padding: '5px 6px', width: '15%', fontWeight: '700' }}>Unit</th>}
                            <th style={{ padding: '5px 6px', width: includeUnitsAsSeparateField ? '25%' : '30%', fontWeight: '700' }}>Biological Ref. Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageData.groups?.map((group, gIdx) => (
                            <React.Fragment key={`${group.id}-${gIdx}`}>
                              <tr className="print-main-heading-row">
                                <td colSpan={includeUnitsAsSeparateField ? 4 : 3} style={{ padding: '8px 6px 3px', fontFamily: group.headingStyle?.fontFamily || 'inherit', fontWeight: group.headingStyle?.bold ? '700' : '600', fontSize: `${group.headingStyle?.fontSize || 15}px`, textAlign: group.headingStyle?.alignment || 'left', fontStyle: group.headingStyle?.italic ? 'italic' : 'normal', textDecoration: group.headingStyle?.underline ? 'underline' : 'none' }}>
                                  {group.name}
                                </td>
                              </tr>
                              {group.subheading && (
                                <tr className="print-subheading-row">
                                  <td colSpan={includeUnitsAsSeparateField ? 4 : 3} style={{ padding: '0 6px 5px', color: '#5d7287', fontFamily: group.subheadingStyle?.fontFamily || 'inherit', fontSize: `${group.subheadingStyle?.fontSize || 12}px`, textAlign: group.subheadingStyle?.alignment || 'left', fontWeight: group.subheadingStyle?.bold ? '700' : 'normal', fontStyle: group.subheadingStyle?.italic ? 'italic' : 'normal', textDecoration: group.subheadingStyle?.underline ? 'underline' : 'none' }}>
                                    {group.subheading}
                                  </td>
                                </tr>
                              )}
                              {group.tests?.map((t) => {
                                const abnormal = isAbnormalResult(t, gender);
                                const critical = isCriticalResult(t, gender);

                                const style = t.style || {};
                                const baseStyle = {
                                  fontSize: `${style.fontSize || 14}px`,
                                  textAlign: style.alignment || 'left',
                                  fontStyle: style.italic ? 'italic' : 'normal',
                                  textDecoration: style.underline ? 'underline' : 'none'
                                };

                                const nameStyle = {
                                  ...baseStyle,
                                  fontWeight: style.bold ? '700' : 'normal'
                                };

                                const valueStyle = {
                                  ...baseStyle,
                                  fontWeight: style.bold ? '700' : abnormal || critical ? '700' : 'normal'
                                };

                                return (
                                  <tr key={t.id}>
                                    <td style={{ padding: '5px 6px', verticalAlign: 'top', ...nameStyle }}>{t.name}</td>
                                    <td style={{ padding: '5px 6px', verticalAlign: 'top', ...valueStyle, color: critical ? '#d74a4a' : abnormal ? '#163256' : 'inherit' }}>
                                      {t.value || '—'}{!includeUnitsAsSeparateField && t.unit ? ` ${t.unit}` : ''} {critical ? ' (Critical)' : abnormal ? ' *' : ''}
                                    </td>
                                    {includeUnitsAsSeparateField && <td style={{ padding: '5px 6px', verticalAlign: 'top', color: '#5d7287' }}>{t.unit || '—'}</td>}
                                    <td style={{ padding: '5px 6px', verticalAlign: 'top', color: '#5d7287', whiteSpace: 'pre-line' }}>{formatReferenceRange(t.referenceRange)}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Page Footer */}
                    {!isLastPage ? (
                      <div className="print-intermediate-footer" style={{ marginTop: '20px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#8c9ba5', borderTop: '1px dashed #e2e8f0' }}>
                        <div>Arun Clinical Lab • (Continued on next page...)</div>
                        {showPageNumbers && <div>Page {pageData.pageNumber} of {pageData.totalPages}</div>}
                      </div>
                    ) : (
                      <div className="print-final-footer-container" style={{ marginTop: '20px', paddingTop: '10px' }}>
                        <div className="print-end-report" style={{ textAlign: 'center', margin: '8px 0 6px', fontSize: '0.78rem', color: '#8c9ba5' }}>
                          *** END OF REPORT ***
                        </div>

                        <footer className="print-footer-container print-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px', paddingTop: '4px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#5d7287' }}>
                            <div>Printed: {new Date().toLocaleString()}</div>
                            <div>Report generated by Arun Clinical Lab</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #000', width: '180px', minHeight: '30px', paddingTop: '4px', fontWeight: '600', fontSize: '0.85rem' }}>
                              Signature
                            </div>
                          </div>
                        </footer>

                        {showPageNumbers && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', fontSize: '0.75rem', color: '#8c9ba5' }}>
                            Page {pageData.pageNumber} of {pageData.totalPages}
                          </div>
                        )}

                        {settings.footerSpacing > 0 && (
                          <div style={{ height: `${settings.footerSpacing}px` }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

