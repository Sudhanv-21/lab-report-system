const STORAGE_KEY = 'lab-report-system-state-v4';

const defaultTemplates = [
  {
    id: 'core-lab',
    name: 'Core Lab',
    doctors: ['Dr. Sharma', 'Dr. Mehta'],
    mainTests: ['CBC', 'Lipid', 'Renal', 'Serology'],
    sections: [
      {
        id: 'cbc',
        name: 'CBC',
        tests: [
          { id: 'wbc', name: 'WBC', unit: '10^3/uL', referenceRange: '4.0 - 11.0' },
          { id: 'rbc', name: 'RBC', unit: '10^6/uL', referenceRange: '3.8 - 5.1' },
          { id: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', referenceRange: '12.0 - 16.0' }
        ]
      },
      {
        id: 'sugar',
        name: 'Sugar',
        tests: [
          { id: 'fasting-glucose', name: 'Fasting Glucose', unit: 'mg/dL', referenceRange: '70 - 110' },
          { id: 'hba1c', name: 'HbA1c', unit: '%', referenceRange: '4.0 - 5.6' }
        ]
      },
      {
        id: 'lipid',
        name: 'Lipid',
        tests: [
          { id: 'cholesterol', name: 'Cholesterol', unit: 'mg/dL', referenceRange: '< 200' },
          { id: 'triglycerides', name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150' }
        ]
      },
      {
        id: 'renal',
        name: 'Renal',
        tests: [
          { id: 'creatinine', name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.6 - 1.2' },
          { id: 'urea', name: 'Urea', unit: 'mg/dL', referenceRange: '15 - 45' }
        ]
      }
    ]
  }
];

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function cloneTemplates() {
  return JSON.parse(JSON.stringify(defaultTemplates));
}

function normalizeDoctorName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Dr.';
  return trimmed.startsWith('Dr.') ? trimmed : `Dr. ${trimmed}`;
}

function makeComponent(name = 'Main Test', tests = []) {
  return {
    id: createId(),
    name,
    tests
  };
}

function getDefaultTestsForComponentName(name, template) {
  if (!name || !template) return [];
  const normalizedName = name.toString().trim().toLowerCase();
  const section = template.sections.find((item) => item.id.toLowerCase() === normalizedName || item.name.toLowerCase() === normalizedName);
  if (!section) return [];
  return section.tests.map((test) => ({
    id: test.id,
    name: test.name,
    unit: test.unit || '',
    referenceRange: test.referenceRange || '',
    value: ''
  }));
}

function makeSheet() {
  const template = getTemplateById('core-lab');
  const componentName = template.mainTests[0] || 'CBC';
  const component = makeComponent(componentName, getDefaultTestsForComponentName(componentName, template));
  return {
    id: createId(),
    patient: {
      name: '',
      age: '',
      gender: 'M',
      specimen: '',
      doctor: normalizeDoctorName(template.doctors[0]),
      date: new Date().toISOString().split('T')[0]
    },
    templateId: template.id,
    activeComponentId: component.id,
    tests: [component]
  };
}

const state = {
  sheets: [],
  activeSheetId: null,
  activeSectionId: 'cbc',
  templates: cloneTemplates()
};

function normalizeSheet(sheet) {
  if (!sheet || typeof sheet !== 'object') return makeSheet();
  if (!Array.isArray(sheet.tests)) {
    sheet.tests = [];
  }
  if (!sheet.tests.length) {
    const template = getTemplateById(sheet.templateId);
    const componentName = template.mainTests[0] || 'CBC';
    const component = makeComponent(componentName, getDefaultTestsForComponentName(componentName, template));
    sheet.tests = [component];
  }

  if (sheet.tests.length && !Array.isArray(sheet.tests[0].tests)) {
    const legacyTests = sheet.tests.map((test) => ({
      id: test.id || createId(),
      name: test.name,
      unit: test.unit || '',
      referenceRange: test.referenceRange || '',
      value: test.value || ''
    }));
    sheet.tests = [makeComponent('CBC')];
    sheet.tests[0].tests = legacyTests;
  }

  const template = getTemplateById(sheet.templateId || 'core-lab');
  sheet.tests = sheet.tests.map((component) => {
    if (!Array.isArray(component.tests)) {
      component.tests = [];
    }
    if (component.tests.length === 0) {
      const defaultTests = getDefaultTestsForComponentName(component.name, template);
      if (defaultTests.length > 0) {
        component.tests = defaultTests;
      }
    }
    return component;
  });

  if (!sheet.activeComponentId || !sheet.tests.some((component) => component.id === sheet.activeComponentId)) {
    sheet.activeComponentId = sheet.tests[0].id;
  }

  return sheet;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.sheets) && parsed.sheets.length) {
      state.sheets = parsed.sheets.map(normalizeSheet);
      state.activeSheetId = parsed.activeSheetId || parsed.sheets[0].id;
      state.activeSectionId = parsed.activeSectionId || 'cbc';
      state.templates = Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : cloneTemplates();
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
    activeSheetId: state.activeSheetId,
    activeSectionId: state.activeSectionId,
    templates: state.templates
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

  return normalizeSheet(activeSheet);
}

function getTemplateById(id) {
  return state.templates.find((template) => template.id === id) || state.templates[0];
}

function getActiveTemplate() {
  return getTemplateById(getActiveSheet().templateId);
}

function getCurrentSection(template) {
  return template.sections.find((section) => section.id === state.activeSectionId) || template.sections[0];
}

function getActiveComponent(sheet) {
  const normalizedSheet = normalizeSheet(sheet);
  return normalizedSheet.tests.find((component) => component.id === normalizedSheet.activeComponentId) || normalizedSheet.tests[0];
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
  const sheet = makeSheet();
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

function updateTestValue(sheetId, componentId, testId, value) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const component = sheet.tests.find((item) => item.id === componentId);
  const test = component?.tests.find((item) => item.id === testId);
  if (!test) return;
  test.value = value;
  persistState();
}

function addMainTestComponent(sheetId, name) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const trimmed = (name || '').trim();
  const componentName = trimmed || 'Main Test';
  const template = getTemplateById(sheet.templateId);
  if (!template.mainTests.includes(componentName)) {
    template.mainTests.push(componentName);
  }
  const component = makeComponent(componentName, getDefaultTestsForComponentName(componentName, template));
  sheet.tests.push(component);
  sheet.activeComponentId = component.id;
  state.activeSectionId = getCurrentSection(template)?.id || state.activeSectionId;
  persistState();
  render();
  showToast(`Main test created: ${componentName}`);
}

function selectComponent(sheetId, componentId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  sheet.activeComponentId = componentId;
  const component = sheet.tests.find((item) => item.id === componentId);
  const template = getTemplateById(sheet.templateId);
  if (component) {
    const section = template.sections.find((item) => item.id.toLowerCase() === component.name.toLowerCase() || item.name.toLowerCase() === component.name.toLowerCase());
    if (section) {
      state.activeSectionId = section.id;
      if (!Array.isArray(component.tests) || component.tests.length === 0) {
        component.tests = getDefaultTestsForComponentName(component.name, template);
      }
    }
  }
  persistState();
  render();
}

function toggleTestSelection(sheetId, sectionId, testId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const template = getTemplateById(sheet.templateId);
  const section = template.sections.find((item) => item.id === sectionId);
  const testDefinition = section?.tests.find((item) => item.id === testId);
  if (!testDefinition) return;

  const component = sheet.tests.find((item) => item.id === sheet.activeComponentId) || sheet.tests[0];
  if (!component) {
    const newComponent = makeComponent(template.mainTests[0] || 'CBC');
    sheet.tests.push(newComponent);
    sheet.activeComponentId = newComponent.id;
  }

  const activeComponent = sheet.tests.find((item) => item.id === sheet.activeComponentId) || sheet.tests[0];
  const existing = activeComponent.tests.find((item) => item.id === testId);
  if (existing) {
    activeComponent.tests = activeComponent.tests.filter((item) => item.id !== testId);
  } else {
    activeComponent.tests.push({
      id: testId,
      name: testDefinition.name,
      unit: testDefinition.unit,
      referenceRange: testDefinition.referenceRange,
      value: ''
    });
  }

  persistState();
  render();
}

function moveComponent(sheetId, index, direction) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet || index < 0 || index >= sheet.tests.length) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= sheet.tests.length) return;
  const [moved] = sheet.tests.splice(index, 1);
  sheet.tests.splice(targetIndex, 0, moved);
  persistState();
  render();
}

function removeComponent(sheetId, componentId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  sheet.tests = sheet.tests.filter((component) => component.id !== componentId);
  if (!sheet.tests.length) {
    sheet.tests = [makeComponent('CBC')];
  }
  if (sheet.activeComponentId === componentId) {
    sheet.activeComponentId = sheet.tests[0].id;
  }
  persistState();
  render();
}

function removeTestFromComponent(sheetId, componentId, testId) {
  const sheet = state.sheets.find((item) => item.id === sheetId);
  if (!sheet) return;
  const component = sheet.tests.find((item) => item.id === componentId);
  if (!component) return;
  component.tests = component.tests.filter((test) => test.id !== testId);
  persistState();
  render();
}

function addDoctorToTemplate() {
  const template = getActiveTemplate();
  const doctorName = document.getElementById('doctorNameInput')?.value?.trim();
  if (!doctorName) {
    showToast('Enter a doctor name first');
    return;
  }
  const normalized = normalizeDoctorName(doctorName);
  if (!template.doctors.includes(normalized)) {
    template.doctors.push(normalized);
  }
  const activeSheet = getActiveSheet();
  updateSheetField(activeSheet.id, 'patient.doctor', normalized);
  persistState();
  render();
  showToast(`Doctor added: ${normalized}`);
}

function addDoctorTemplate() {
  const template = getActiveTemplate();
  const doctorName = document.getElementById('doctorTemplateInput')?.value?.trim();
  if (!doctorName) {
    showToast('Enter a doctor template first');
    return;
  }
  const normalized = normalizeDoctorName(doctorName);
  if (!template.doctors.includes(normalized)) {
    template.doctors.push(normalized);
  }
  persistState();
  render();
  showToast(`Doctor template saved: ${normalized}`);
}

function addMainTestTemplate() {
  const template = getActiveTemplate();
  const mainTestName = document.getElementById('mainTestTemplateInput')?.value?.trim();
  if (!mainTestName) {
    showToast('Enter a main test template first');
    return;
  }
  if (!template.mainTests.includes(mainTestName)) {
    template.mainTests.push(mainTestName);
  }
  persistState();
  render();
  showToast(`Main test template saved: ${mainTestName}`);
}

function addCustomTestToSection(sectionId) {
  const template = getActiveTemplate();
  const section = template.sections.find((item) => item.id === sectionId);
  const testName = document.getElementById('newTestName')?.value?.trim();
  const unit = document.getElementById('newTestUnit')?.value?.trim();
  const range = document.getElementById('newTestRange')?.value?.trim();

  if (!section || !testName) {
    showToast('Enter a test name first');
    return;
  }

  section.tests.push({
    id: createId(),
    name: testName,
    unit: unit || '',
    referenceRange: range || ''
  });
  persistState();
  render();
  showToast(`${testName} added to ${section.name}`);
}

function renderTabs() {
  const tabBar = document.getElementById('tabBar');
  tabBar.innerHTML = '';

  state.sheets.forEach((sheet, index) => {
    const tabLabel = sheet.patient.name || `Report ${index + 1}`;
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
  const template = getActiveTemplate();
  const currentSection = getCurrentSection(template);
  const activeComponent = getActiveComponent(activeSheet);
  const selectedTestIds = new Set(activeComponent?.tests.map((test) => test.id) || []);
  const doctorValue = activeSheet.patient.doctor || normalizeDoctorName(template.doctors[0]);

  editor.innerHTML = `
    <div class="editor-stack">
      <div class="panel-card">
        <div class="panel-title-row">
          <div>
            <h2>Report setup</h2>
            <p class="muted-text">Create reusable main tests, assign subtests, and manage recurring templates.</p>
          </div>
          <span class="badge">${escapeHtml(template.name)}</span>
        </div>

        <div class="form-grid">
          <div class="field-group">
            <label>Patient Name</label>
            <input data-field="patient.name" value="${escapeHtml(activeSheet.patient.name)}" />
          </div>
          <div class="field-group">
            <label>Doctor</label>
            <div class="doctor-stack">
              <input data-field="patient.doctor" value="${escapeHtml(doctorValue)}" />
              <select data-doctor-select>
                ${template.doctors.map((doctor) => `<option value="${escapeHtml(doctor)}" ${doctor === activeSheet.patient.doctor ? 'selected' : ''}>${escapeHtml(doctor)}</option>`).join('')}
              </select>
            </div>
            <div class="inline-actions">
              <input id="doctorNameInput" placeholder="Add doctor" />
              <button class="ghost-btn" data-add-doctor>Add</button>
            </div>
          </div>
          <div class="field-group">
            <label>Age</label>
            <input data-field="patient.age" value="${escapeHtml(activeSheet.patient.age)}" />
          </div>
          <div class="field-group">
            <label>Gender</label>
            <div class="gender-toggle">
              <button class="gender-pill ${activeSheet.patient.gender === 'M' ? 'active' : ''}" data-gender="M">M</button>
              <button class="gender-pill ${activeSheet.patient.gender === 'F' ? 'active' : ''}" data-gender="F">F</button>
            </div>
          </div>
          <div class="field-group">
            <label>Specimen</label>
            <input data-field="patient.specimen" value="${escapeHtml(activeSheet.patient.specimen)}" />
          </div>
          <div class="field-group">
            <label>Report Date</label>
            <input type="date" data-field="patient.date" value="${escapeHtml(activeSheet.patient.date)}" />
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title-row">
          <div>
            <h3>Test sections</h3>
            <p class="muted-text">Select the main test component first, then add subtests to it.</p>
          </div>
          <span class="badge">${activeSheet.tests.length} components</span>
        </div>

        <div class="component-toolbar">
          <select data-select-component>
            ${activeSheet.tests.map((component) => `<option value="${component.id}" ${component.id === activeSheet.activeComponentId ? 'selected' : ''}>${escapeHtml(component.name)}</option>`).join('')}
          </select>
          <input id="mainTestNameInput" placeholder="Create main test" />
          <button class="primary-btn" data-add-component>Create main test</button>
        </div>

        <div class="section-tabs">
          ${template.sections.map((section) => `
            <button class="section-tab ${section.id === currentSection.id ? 'active' : ''}" data-select-section="${section.id}">
              ${escapeHtml(section.name)}
            </button>
          `).join('')}
        </div>

        <div class="test-grid">
          ${currentSection.tests.map((test) => `
            <button class="test-chip ${selectedTestIds.has(test.id) ? 'active' : ''}" data-toggle-test="${test.id}" data-section="${currentSection.id}">
              <strong>${escapeHtml(test.name)}</strong>
              <span>${escapeHtml(test.unit || '—')}</span>
            </button>
          `).join('')}
        </div>

        <div class="template-manager">
          <div class="field-group">
            <label>Add custom test to ${escapeHtml(currentSection.name)}</label>
            <div class="inline-actions">
              <input id="newTestName" placeholder="Test name" />
              <input id="newTestUnit" placeholder="Unit" />
              <input id="newTestRange" placeholder="Reference" />
              <button class="primary-btn" data-add-test="${currentSection.id}">Add</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title-row">
          <div>
            <h3>Component preview</h3>
            <p class="muted-text">Each main test can be moved as a whole and holds its own subtests.</p>
          </div>
        </div>

        <div class="component-list">
          ${activeSheet.tests.map((component, index) => `
            <div class="component-card ${component.id === activeSheet.activeComponentId ? 'active' : ''}">
              <div class="component-card-header">
                <div>
                  <strong>${escapeHtml(component.name)}</strong>
                  <div class="muted-text">${component.tests.length} subtests</div>
                </div>
                <div class="inline-actions">
                  <button class="ghost-btn" data-move-component="${index}" data-direction="-1">↑</button>
                  <button class="ghost-btn" data-move-component="${index}" data-direction="1">↓</button>
                  <button class="ghost-btn" data-remove-component="${component.id}">×</button>
                </div>
              </div>
              <div class="component-subtest-list">
                ${component.tests.length ? component.tests.map((test) => `
                  <div class="component-subtest">
                    <div>
                      <strong>${escapeHtml(test.name)}</strong>
                      <div class="muted-text">${escapeHtml(test.referenceRange || test.unit || '—')}</div>
                    </div>
                    <div class="inline-actions">
                      <input data-test-value="${component.id}" data-test-id="${test.id}" value="${escapeHtml(test.value)}" />
                      <button class="ghost-btn" data-remove-test="${component.id}" data-test-id="${test.id}">×</button>
                    </div>
                  </div>
                `).join('') : '<div class="muted-text">No subtests selected yet.</div>'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title-row">
          <div>
            <h3>Templates</h3>
            <p class="muted-text">Reuse doctor names and main test blocks across reports.</p>
          </div>
        </div>

        <div class="template-grid">
          <div class="template-column">
            <div class="field-group">
              <label>Doctor templates</label>
              <div class="inline-actions">
                <input id="doctorTemplateInput" placeholder="Add doctor template" />
                <button class="ghost-btn" data-add-doctor-template>Add</button>
              </div>
              <div class="pill-list">
                ${template.doctors.map((doctor) => `<span class="pill">${escapeHtml(doctor)}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="template-column">
            <div class="field-group">
              <label>Main test templates</label>
              <div class="inline-actions">
                <input id="mainTestTemplateInput" placeholder="Add main test template" />
                <button class="ghost-btn" data-add-main-template>Add</button>
              </div>
              <div class="pill-list">
                ${template.mainTests.map((name) => `<button class="pill-button" data-use-main-template="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSummary() {
  const activeSheet = getActiveSheet();
  const summary = document.getElementById('summaryContent');
  const totalTests = activeSheet.tests.reduce((sum, component) => sum + component.tests.length, 0);
  const completed = activeSheet.tests.reduce((sum, component) => sum + component.tests.filter((test) => test.value.trim() !== '').length, 0);

  summary.innerHTML = `
    <div class="summary-list">
      <div class="summary-row"><span>Sheet</span><strong>${escapeHtml(activeSheet.patient.name || `Report ${state.sheets.indexOf(activeSheet) + 1}`)}</strong></div>
      <div class="summary-row"><span>Patient</span><strong>${escapeHtml(activeSheet.patient.name || 'Pending')}</strong></div>
      <div class="summary-row"><span>Doctor</span><strong>${escapeHtml(activeSheet.patient.doctor || 'Pending')}</strong></div>
      <div class="summary-row"><span>Components</span><strong>${activeSheet.tests.length}</strong></div>
      <div class="summary-row"><span>Subtests</span><strong>${completed}/${totalTests}</strong></div>
      <div class="summary-row"><span>Status</span><strong>${totalTests === 0 ? 'No tests selected' : completed === totalTests ? 'Ready' : 'In progress'}</strong></div>
    </div>
  `;
}

function renderPrintPreview() {
  const activeSheet = getActiveSheet();
  const previewBody = document.getElementById('previewBody');
  const template = getActiveTemplate();

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
      ${activeSheet.tests.map((component) => `
        <div class="print-component">
          <h4>${escapeHtml(component.name)}</h4>
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
              ${component.tests.map((test) => `
                <tr>
                  <td>${escapeHtml(test.name)}</td>
                  <td>${escapeHtml(test.unit)}</td>
                  <td>${escapeHtml(test.referenceRange)}</td>
                  <td>${escapeHtml(test.value || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
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

  if (event.target.matches('[data-test-value]')) {
    updateTestValue(state.activeSheetId, event.target.dataset.testValue, event.target.dataset.testId, event.target.value);
    renderSummary();
  }
}

function handleChange(event) {
  if (event.target.matches('[data-doctor-select]')) {
    const activeSheet = getActiveSheet();
    updateSheetField(activeSheet.id, 'patient.doctor', normalizeDoctorName(event.target.value));
    renderSummary();
  }

  if (event.target.matches('[data-select-component]')) {
    selectComponent(state.activeSheetId, event.target.value);
  }
}

function handleClick(event) {
  const target = event.target.closest('button') || event.target;
  if (!target) return;

  if (target.id === 'saveBtn') {
    persistState();
    showToast('Report sheet saved');
    return;
  }

  if (target.id === 'addRowBtn' || target.closest('#addRowBtn')) {
    showToast('Use the section chips and main test blocks above to build the report');
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

  if (target.matches('[data-gender]')) {
    const activeSheet = getActiveSheet();
    updateSheetField(activeSheet.id, 'patient.gender', target.dataset.gender);
    renderSummary();
    render();
    return;
  }

  if (target.matches('[data-select-section]')) {
    state.activeSectionId = target.dataset.selectSection;
    persistState();
    render();
    return;
  }

  if (target.matches('[data-toggle-test]')) {
    toggleTestSelection(state.activeSheetId, target.dataset.section || state.activeSectionId, target.dataset.toggleTest);
    return;
  }

  if (target.matches('[data-add-component]')) {
    const name = document.getElementById('mainTestNameInput')?.value;
    addMainTestComponent(state.activeSheetId, name);
    return;
  }

  if (target.matches('[data-add-doctor]')) {
    addDoctorToTemplate();
    return;
  }

  if (target.matches('[data-add-doctor-template]')) {
    addDoctorTemplate();
    return;
  }

  if (target.matches('[data-add-main-template]')) {
    addMainTestTemplate();
    return;
  }

  if (target.matches('[data-use-main-template]')) {
    const input = document.getElementById('mainTestNameInput');
    if (input) {
      input.value = target.dataset.useMainTemplate;
    }
    return;
  }

  if (target.matches('[data-add-test]')) {
    addCustomTestToSection(target.dataset.addTest);
    return;
  }

  if (target.matches('[data-move-component]')) {
    moveComponent(state.activeSheetId, Number(target.dataset.moveComponent), Number(target.dataset.direction));
    return;
  }

  if (target.matches('[data-remove-component]')) {
    removeComponent(state.activeSheetId, target.dataset.removeComponent);
    return;
  }

  if (target.matches('[data-remove-test]')) {
    removeTestFromComponent(state.activeSheetId, target.dataset.removeTest, target.dataset.testId);
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
showToast('Component-based report editor ready');
