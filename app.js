const STORAGE_KEY = 'lab-report-system-state-v1';

const templates = [
  {
    id: 'chemistry',
    name: 'Chemistry Panel',
    tests: [
      { name: 'Glucose', unit: 'mg/dL', referenceRange: '70 - 110' },
      { name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.6 - 1.2' },
      { name: 'Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2' }
    ]
  },
  {
    id: 'hematology',
    name: 'Hematology Panel',
    tests: [
      { name: 'WBC', unit: '10^3/uL', referenceRange: '4.0 - 11.0' },
      { name: 'RBC', unit: '10^6/uL', referenceRange: '3.8 - 5.1' },
      { name: 'Hemoglobin', unit: 'g/dL', referenceRange: '12.0 - 16.0' }
    ]
  }
];

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeSheet(title = '') {
  const template = templates[0];
  return {
    id: createId(),
    title,
    patient: {
      name: '',
      age: '',
      gender: '',
      specimen: '',
      doctor: '',
      date: new Date().toISOString().split('T')[0]
    },
    templateId: template.id,
    note: '',
    tests: template.tests.map((test, index) => ({
      id: `test-${index + 1}`,
      name: test.name,
      unit: test.unit,
      referenceRange: test.referenceRange,
      value: ''
    }))
  };
}

const state = {
  sheets: [],
  activeSheetId: null
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.sheets) && parsed.sheets.length) {
      state.sheets = parsed.sheets;
      state.activeSheetId = parsed.activeSheetId || parsed.sheets[0].id;
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to read local storage', error);
  }

  state.sheets = [makeSheet()];
  state.activeSheetId = state.sheets[0].id;
  persistState();
  return null;
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    sheets: state.sheets,
    activeSheetId: state.activeSheetId
  }));
}

function getActiveSheet() {
  if (!Array.isArray(state.sheets) || state.sheets.length === 0) {
    state.sheets = [makeSheet()];
    state.activeSheetId = state.sheets[0].id;
    persistState();
  }

  const activeSheet = state.sheets.find((sheet) => sheet.id === state.activeSheetId) || state.sheets[0];
  if (!activeSheet) {
    state.sheets = [makeSheet()];
    state.activeSheetId = state.sheets[0].id;
    persistState();
    return state.sheets[0];
  }

  return activeSheet;
}

function getTemplateById(id) {
  return templates.find((template) => template.id === id) || templates[0];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function setActiveSheet(sheetId) {
  state.activeSheetId = sheetId;
  persistState();
  render();
}

function addSheet() {
  const sheet = makeSheet('');
  state.sheets.push(sheet);
  state.activeSheetId = sheet.id;
  persistState();
  render();
  showToast('New report sheet created');
}

function closeSheet(sheetId) {
  if (state.sheets.length === 1) return;
  state.sheets = state.sheets.filter((sheet) => sheet.id !== sheetId);
  if (state.activeSheetId === sheetId) {
    state.activeSheetId = state.sheets[0].id;
  }
  persistState();
  render();
}

function updateSheetField(sheetId, path, value) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const parts = path.split('.');
  let current = sheet;
  parts.slice(0, -1).forEach((part) => {
    current = current[part];
  });
  current[parts[parts.length - 1]] = value;

  persistState();
}

function updateTestField(sheetId, testId, field, value) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const test = sheet.tests.find((item) => item.id === testId);
  if (!test) return;
  test[field] = value;
  persistState();
}

function selectTemplate(sheetId, templateId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const template = getTemplateById(templateId);
  sheet.templateId = template.id;
  sheet.tests = template.tests.map((test, index) => ({
    id: `test-${index + 1}`,
    name: test.name,
    unit: test.unit,
    referenceRange: test.referenceRange,
    value: ''
  }));
  persistState();
  render();
  showToast(`Template switched to ${template.name}`);
}

function addTestRow(sheetId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  sheet.tests.push({
    id: createId(),
    name: 'New Test',
    unit: '',
    referenceRange: '',
    value: ''
  });
  persistState();
  render();
}

function removeTestRow(sheetId, testId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  sheet.tests = sheet.tests.filter((test) => test.id !== testId);
  persistState();
  render();
}

function renderTabs() {
  const tabBar = document.getElementById('tabBar');
  tabBar.innerHTML = '';

  state.sheets.forEach((sheet) => {
    const tabLabel = sheet.patient.name || `Report ${state.sheets.indexOf(sheet) + 1}`;
    const button = document.createElement('button');
    button.className = `tab-btn ${sheet.id === state.activeSheetId ? 'active' : ''}`;
    button.innerHTML = `<span>${escapeHtml(tabLabel)}</span><button class="close" data-close-sheet="${sheet.id}" aria-label="Close">×</button>`;
    button.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-sheet]')) return;
      setActiveSheet(sheet.id);
    });
    tabBar.appendChild(button);
  });

  const addButton = document.createElement('button');
  addButton.className = 'add-tab-btn';
  addButton.textContent = '+ New sheet';
  addButton.addEventListener('click', addSheet);
  tabBar.appendChild(addButton);
}

function renderEditor() {
  const activeSheet = getActiveSheet();
  if (!activeSheet) {
    document.getElementById('editorContent').innerHTML = '<p class="muted-text">No report sheet available.</p>';
    return;
  }

  const editor = document.getElementById('editorContent');
  const template = getTemplateById(activeSheet.templateId);

  editor.innerHTML = `
    <div class="form-grid">
      <div class="field-group">
        <label>Patient Name</label>
        <input data-field="patient.name" value="${escapeHtml(activeSheet.patient.name)}" />
      </div>
      <div class="field-group">
        <label>Doctor</label>
        <input data-field="patient.doctor" value="${escapeHtml(activeSheet.patient.doctor)}" />
      </div>
      <div class="field-group">
        <label>Age</label>
        <input data-field="patient.age" value="${escapeHtml(activeSheet.patient.age)}" />
      </div>
      <div class="field-group">
        <label>Gender</label>
        <input data-field="patient.gender" value="${escapeHtml(activeSheet.patient.gender)}" />
      </div>
      <div class="field-group">
        <label>Specimen</label>
        <input data-field="patient.specimen" value="${escapeHtml(activeSheet.patient.specimen)}" />
      </div>
      <div class="field-group">
        <label>Report Date</label>
        <input type="date" data-field="patient.date" value="${escapeHtml(activeSheet.patient.date)}" />
      </div>
      <div class="field-group">
        <label>Template</label>
        <select data-template-select>
          ${templates.map((item) => `<option value="${item.id}" ${item.id === activeSheet.templateId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field-group">
      <label>Remarks</label>
      <textarea data-field="note">${escapeHtml(activeSheet.note)}</textarea>
    </div>

    <div class="table-actions">
      <div class="muted-text">Using ${escapeHtml(template.name)} template</div>
      <span class="badge">${activeSheet.tests.length} tests</span>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th>Test</th>
          <th>Unit</th>
          <th>Reference</th>
          <th>Value</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${activeSheet.tests.map((test) => `
          <tr>
            <td><input data-test-name="${test.id}" value="${escapeHtml(test.name)}" /></td>
            <td><input data-test-unit="${test.id}" value="${escapeHtml(test.unit)}" /></td>
            <td><input data-test-ref="${test.id}" value="${escapeHtml(test.referenceRange)}" /></td>
            <td><input data-test-value="${test.id}" value="${escapeHtml(test.value)}" /></td>
            <td><button class="ghost-btn" data-remove-test="${test.id}" aria-label="Remove">×</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderSummary() {
  const activeSheet = getActiveSheet();
  const summary = document.getElementById('summaryContent');
  const completed = activeSheet.tests.filter((test) => test.value.trim() !== '').length;
  const total = activeSheet.tests.length;

  summary.innerHTML = `
    <div class="summary-list">
      <div class="summary-row"><span>Sheet</span><strong>${escapeHtml(activeSheet.patient.name || `Report ${state.sheets.indexOf(activeSheet) + 1}`)}</strong></div>
      <div class="summary-row"><span>Patient</span><strong>${escapeHtml(activeSheet.patient.name || 'Pending')}</strong></div>
      <div class="summary-row"><span>Template</span><strong>${escapeHtml(getTemplateById(activeSheet.templateId).name)}</strong></div>
      <div class="summary-row"><span>Completed</span><strong>${completed}/${total}</strong></div>
      <div class="summary-row"><span>Status</span><strong>${completed === total ? 'Ready' : 'In progress'}</strong></div>
    </div>
  `;
}

function renderPrintPreview() {
  const activeSheet = getActiveSheet();
  const previewBody = document.getElementById('previewBody');
  const template = getTemplateById(activeSheet.templateId);

  previewBody.innerHTML = `
    <div class="print-sheet">
      <h3>${escapeHtml(activeSheet.patient.name || `Report ${state.sheets.indexOf(activeSheet) + 1}`)}</h3>
      <div class="print-grid">
        <div class="print-row"><span>Patient:</span><strong>${escapeHtml(activeSheet.patient.name || '—')}</strong></div>
        <div class="print-row"><span>Doctor:</span><strong>${escapeHtml(activeSheet.patient.doctor || '—')}</strong></div>
        <div class="print-row"><span>Age / Gender:</span><strong>${escapeHtml(activeSheet.patient.age || '—')} / ${escapeHtml(activeSheet.patient.gender || '—')}</strong></div>
        <div class="print-row"><span>Specimen:</span><strong>${escapeHtml(activeSheet.patient.specimen || '—')}</strong></div>
        <div class="print-row"><span>Template:</span><strong>${escapeHtml(template.name)}</strong></div>
        <div class="print-row"><span>Report Date:</span><strong>${escapeHtml(activeSheet.patient.date)}</strong></div>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Unit</th>
            <th>Reference</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${activeSheet.tests.map((test) => `
            <tr>
              <td>${escapeHtml(test.name)}</td>
              <td>${escapeHtml(test.unit)}</td>
              <td>${escapeHtml(test.referenceRange)}</td>
              <td>${escapeHtml(test.value || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:18px; display:flex; justify-content:flex-end; gap:24px; color: var(--muted); font-size: 0.9rem;">
        <div>Generated on ${new Date().toLocaleDateString()}</div>
      </div>
    </div>
  `;
}

function showPreviewOverlay() {
  renderPrintPreview();
  document.getElementById('previewOverlay').classList.remove('hidden');
}

function hidePreviewOverlay() {
  document.getElementById('previewOverlay').classList.add('hidden');
}

function exportPdf() {
  showToast('Open the print dialog and select "Save as PDF" to export.');
  window.print();
}

function printNow() {
  window.print();
}

function render() {
  renderTabs();
  renderEditor();
  renderSummary();
}

function handleInput(event) {
  if (event.target.matches('[data-field]')) {
    updateSheetField(state.activeSheetId, event.target.dataset.field, event.target.value);
    renderSummary();
    return;
  }

  if (event.target.matches('[data-test-name], [data-test-unit], [data-test-ref], [data-test-value]')) {
    const testId = event.target.dataset.testName || event.target.dataset.testUnit || event.target.dataset.testRef || event.target.dataset.testValue;
    const field = event.target.dataset.testName ? 'name' : event.target.dataset.testUnit ? 'unit' : event.target.dataset.testRef ? 'referenceRange' : 'value';
    updateTestField(state.activeSheetId, testId, field, event.target.value);
    renderSummary();
  }
}

function handleChange(event) {
  if (event.target.matches('[data-template-select]')) {
    selectTemplate(state.activeSheetId, event.target.value);
  }
}

function handleClick(event) {
  const target = event.target;

  if (target.id === 'saveBtn') {
    persistState();
    showToast('Report sheet saved');
    return;
  }

  if (target.id === 'addRowBtn' || target.closest('#addRowBtn')) {
    addTestRow(state.activeSheetId);
    return;
  }

  if (target.id === 'printBtn' || target.closest('#printBtn')) {
    showPreviewOverlay();
    return;
  }

  if (target.id === 'exportPdfBtn' || target.closest('#exportPdfBtn')) {
    exportPdf();
    return;
  }

  if (target.id === 'closePreviewBtn' || target.closest('#closePreviewBtn')) {
    hidePreviewOverlay();
    return;
  }

  if (target.id === 'printNowBtn' || target.closest('#printNowBtn')) {
    printNow();
    return;
  }

  if (target.matches('[data-remove-test]')) {
    removeTestRow(state.activeSheetId, target.dataset.removeTest);
    return;
  }

  if (target.matches('[data-close-sheet]')) {
    closeSheet(target.dataset.closeSheet);
  }
}

document.addEventListener('input', handleInput);
document.addEventListener('change', handleChange);
document.addEventListener('click', handleClick);

loadState();
render();
showToast('Welcome to the lab report editor');
