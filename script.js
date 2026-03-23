const modules = [
  'Module 1',
  'Module 2',
  'Module 3',
  'Module 4',
  'Module 5',
];

const students = [
  { name: 'Ava Patel', completed: [true, true, true, true, false], lastActivity: '2 hours ago' },
  { name: 'Marcus Chen', completed: [true, true, false, false, false], lastActivity: '1 day ago' },
  { name: 'Sofia Ramirez', completed: [true, true, true, true, true], lastActivity: '45 minutes ago' },
  { name: 'Jordan Lee', completed: [true, false, false, false, false], lastActivity: '3 days ago' },
  { name: 'Noah Johnson', completed: [true, true, true, false, false], lastActivity: '5 hours ago' },
  { name: 'Mia Thompson', completed: [true, true, true, false, false], lastActivity: '8 hours ago' },
  { name: 'Ethan Walker', completed: [true, true, false, false, false], lastActivity: '2 days ago' },
  { name: 'Isabella Nguyen', completed: [true, true, true, true, false], lastActivity: '6 hours ago' },
];

const studentRows = document.getElementById('studentTable');
const statsGrid = document.getElementById('statsGrid');
const moduleGrid = document.getElementById('moduleGrid');
const snapshotList = document.getElementById('snapshotList');
const cohortFilter = document.getElementById('cohortFilter');
const moduleSelector = document.getElementById('moduleSelector');
const clearModuleSelectionButton = document.getElementById('clearModuleSelection');
const incompleteSummaryTitle = document.getElementById('incompleteSummaryTitle');
const incompleteCount = document.getElementById('incompleteCount');
const incompleteSummaryText = document.getElementById('incompleteSummaryText');
const selectedModuleTags = document.getElementById('selectedModuleTags');
const incompleteStudentList = document.getElementById('incompleteStudentList');

const selectedModules = new Set();

function percentForStudent(student) {
  return Math.round((student.completed.filter(Boolean).length / modules.length) * 100);
}

function getStatus(student) {
  const percent = percentForStudent(student);
  if (percent >= 80) return { label: 'On track', tone: 'success' };
  if (percent >= 40) return { label: 'Watch list', tone: 'warning' };
  return { label: 'Needs attention', tone: 'danger' };
}

function currentModule(student) {
  const nextIndex = student.completed.findIndex((done) => !done);
  return nextIndex === -1 ? 'Completed course' : modules[nextIndex];
}

function filteredStudents() {
  const filter = cohortFilter.value;
  if (filter === 'all') return students;
  return students.filter((student) => {
    const status = getStatus(student).label;
    return filter === 'on-track' ? status === 'On track' : status === 'Needs attention';
  });
}

function moduleSummary(data, index) {
  const completed = data.filter((student) => student.completed[index]).length;
  const remaining = data.length - completed;
  const percent = data.length ? Math.round((completed / data.length) * 100) : 0;

  return {
    completed,
    remaining,
    percent,
  };
}

function studentsMissingSelectedModules(data) {
  const selectedIndexes = [...selectedModules];

  if (!selectedIndexes.length) return [];

  return data
    .filter((student) => selectedIndexes.some((index) => !student.completed[index]))
    .map((student) => ({
      ...student,
      missingModules: selectedIndexes.filter((index) => !student.completed[index]),
    }));
}

function renderSnapshot(data) {
  const average = data.length
    ? Math.round(data.reduce((sum, student) => sum + percentForStudent(student), 0) / data.length)
    : 0;
  const attentionCount = data.filter((student) => getStatus(student).label === 'Needs attention').length;

  snapshotList.innerHTML = `
    <dt>Enrolled</dt><dd>${data.length} students</dd>
    <dt>Average completion</dt><dd>${average}%</dd>
    <dt>Need outreach</dt><dd>${attentionCount}</dd>
    <dt>Canvas sync</dt><dd>Today, 9:15 AM</dd>
  `;
}

function renderStats(data) {
  const totalCompleted = data.filter((student) => percentForStudent(student) === 100).length;
  const onTrack = data.filter((student) => getStatus(student).label === 'On track').length;
  const watch = data.filter((student) => getStatus(student).label === 'Watch list').length;
  const average = data.length
    ? Math.round(data.reduce((sum, student) => sum + percentForStudent(student), 0) / data.length)
    : 0;

  const cards = [
    { title: 'Average completion', value: `${average}%`, note: 'Across the visible cohort' },
    { title: 'Students on track', value: onTrack, note: '80%+ module completion' },
    { title: 'Watch list', value: watch, note: 'Between 40% and 79%' },
    { title: 'Fully complete', value: totalCompleted, note: 'Finished all 5 modules' },
  ];

  statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <p class="eyebrow">${card.title}</p>
          <div class="value">${card.value}</div>
          <p class="muted">${card.note}</p>
        </article>
      `
    )
    .join('');
}

function renderModules(data) {
  moduleGrid.innerHTML = modules
    .map((module, index) => {
      const summary = moduleSummary(data, index);
      return `
        <article class="module-card">
          <p class="eyebrow">${module}</p>
          <strong>${summary.percent}% complete</strong>
          <div class="progress-bar"><div class="progress-fill" style="width:${summary.percent}%"></div></div>
          <dl class="module-summary-list muted">
            <div><dt>Completed</dt><dd>${summary.completed}</dd></div>
            <div><dt>Remaining</dt><dd>${summary.remaining}</dd></div>
            <div><dt>Cohort</dt><dd>${data.length}</dd></div>
          </dl>
        </article>
      `;
    })
    .join('');
}

function renderModuleSelector(data) {
  moduleSelector.innerHTML = modules
    .map((module, index) => {
      const summary = moduleSummary(data, index);
      const isSelected = selectedModules.has(index);
      return `
        <button
          type="button"
          class="module-option ${isSelected ? 'selected' : ''}"
          data-module-index="${index}"
          aria-pressed="${isSelected}"
        >
          <span>
            <strong>${module}</strong>
            <small>${summary.remaining} students remaining</small>
          </span>
          <span class="module-option-percent">${summary.percent}%</span>
        </button>
      `;
    })
    .join('');
}

function renderIncompleteReport(data) {
  const selectedIndexes = [...selectedModules];

  if (!selectedIndexes.length) {
    incompleteSummaryTitle.textContent = 'No modules selected';
    incompleteCount.textContent = 'Select modules';
    incompleteSummaryText.textContent = 'Select at least one module to view the students who still need to complete it.';
    selectedModuleTags.innerHTML = '';
    incompleteStudentList.innerHTML = '<li class="empty-report">No module filter applied.</li>';
    return;
  }

  const missingStudents = studentsMissingSelectedModules(data);
  const selectedModuleNames = selectedIndexes.map((index) => modules[index]);

  incompleteSummaryTitle.textContent = `${missingStudents.length} student${missingStudents.length === 1 ? '' : 's'} need follow-up`;
  incompleteCount.textContent = `${selectedModuleNames.length} module${selectedModuleNames.length === 1 ? '' : 's'} selected`;
  incompleteSummaryText.textContent = `Showing students in the current cohort who have not completed at least one of the selected modules.`;

  selectedModuleTags.innerHTML = selectedModuleNames
    .map((module) => `<span class="report-tag">${module}</span>`)
    .join('');

  if (!missingStudents.length) {
    incompleteStudentList.innerHTML = '<li class="empty-report success">Every student in this cohort has completed the selected modules.</li>';
    return;
  }

  incompleteStudentList.innerHTML = missingStudents
    .map((student) => {
      const status = getStatus(student);
      const missingModules = student.missingModules.map((index) => modules[index]).join(', ');
      return `
        <li class="report-row">
          <div>
            <strong>${student.name}</strong>
            <p>${missingModules}</p>
          </div>
          <div class="report-row-meta">
            <span class="badge ${status.tone}">${status.label}</span>
            <span class="muted">Last activity: ${student.lastActivity}</span>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderTable(data) {
  const moduleSummaries = modules.map((_, index) => moduleSummary(data, index));

  const studentMarkup = data
    .map((student) => {
      const percent = percentForStudent(student);
      const status = getStatus(student);
      return `
        <tr>
          <td><strong>${student.name}</strong></td>
          <td><span class="badge ${status.tone}">${status.label}</span></td>
          <td>${percent}%</td>
          <td>${currentModule(student)}</td>
          <td>${student.lastActivity}</td>
          ${student.completed
            .map(
              (done) => `
                <td>
                  <span class="matrix-chip ${done ? 'complete' : 'incomplete'}">${done ? 'Complete' : 'Not started'}</span>
                </td>
              `
            )
            .join('')}
        </tr>
      `;
    })
    .join('');

  const summaryMarkup = `
    <tr class="summary-row">
      <td><strong>Module summary</strong></td>
      <td colspan="4">Completion rate and counts for the visible cohort</td>
      ${moduleSummaries
        .map(
          (summary) => `
            <td>
              <div class="summary-stat">${summary.percent}%</div>
              <div class="summary-meta">${summary.completed}/${data.length} complete</div>
            </td>
          `
        )
        .join('')}
    </tr>
  `;

  studentRows.innerHTML = `${studentMarkup}${summaryMarkup}`;
}

function render() {
  const data = filteredStudents();
  renderSnapshot(data);
  renderStats(data);
  renderModules(data);
  renderModuleSelector(data);
  renderIncompleteReport(data);
  renderTable(data);
}

cohortFilter.addEventListener('change', render);

moduleSelector.addEventListener('click', (event) => {
  const button = event.target.closest('[data-module-index]');
  if (!button) return;

  const index = Number(button.dataset.moduleIndex);
  if (selectedModules.has(index)) {
    selectedModules.delete(index);
  } else {
    selectedModules.add(index);
  }

  render();
});

clearModuleSelectionButton.addEventListener('click', () => {
  selectedModules.clear();
  render();
});

render();
