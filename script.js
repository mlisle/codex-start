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
  renderTable(data);
}

cohortFilter.addEventListener('change', render);
render();
