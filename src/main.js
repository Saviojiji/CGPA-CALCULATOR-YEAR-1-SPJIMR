// ═══════════════════════════════════════════════════════════════
//  SPJIMR Academic Tracker — Main Application
// ═══════════════════════════════════════════════════════════════

import { TERMS, NCL, GRADE_SCALE, getTermCredits } from './data.js';
import { calcTermGPA, calcCGPA, countGrades } from './calculator.js';
import { evaluatePromotionRules, getOverallStatus } from './rules.js';

// ─── State ────────────────────────────────────────────────────
const state = {
  activeTab: 'summary',
  // Per-term state
  terms: {},
  ncl: {
    directMode: false,
    directGPA: '',
    courses: NCL.courses.map(c => ({ ...c, grade: '—' })),
  },
};

// Initialize term state
TERMS.forEach(t => {
  state.terms[t.id] = {
    directMode: false,
    directGPA: '',
    courses: t.courses.map(c => ({ ...c, grade: '—' })),
  };
});

// ─── Helpers ──────────────────────────────────────────────────
function getTermGPA(termId) {
  const ts = state.terms[termId];
  if (!ts) return { gpa: 0, totalCredits: 0, gradedCredits: 0, hasGrades: false };
  if (ts.directMode && ts.directGPA !== '') {
    const gpa = parseFloat(ts.directGPA);
    return {
      gpa: isNaN(gpa) ? 0 : Math.min(4, Math.max(0, gpa)),
      totalCredits: getTermCredits(termId),
      gradedCredits: getTermCredits(termId),
      hasGrades: true,
    };
  }
  const result = calcTermGPA(ts.courses);
  return { ...result, hasGrades: result.gradedCredits > 0 };
}

function getNclGPA() {
  const ns = state.ncl;
  if (ns.directMode && ns.directGPA !== '') {
    const gpa = parseFloat(ns.directGPA);
    return {
      gpa: isNaN(gpa) ? 0 : Math.min(4, Math.max(0, gpa)),
      totalCredits: getTermCredits('ncl'),
      gradedCredits: getTermCredits('ncl'),
      hasGrades: true,
    };
  }
  const result = calcTermGPA(ns.courses);
  return { ...result, hasGrades: result.gradedCredits > 0 };
}

function getOverallCGPA() {
  const results = [];
  TERMS.forEach(t => {
    const r = getTermGPA(t.id);
    results.push({ gpa: r.gpa, credits: r.gradedCredits, hasGrades: r.hasGrades });
  });
  const nclR = getNclGPA();
  results.push({ gpa: nclR.gpa, credits: nclR.gradedCredits, hasGrades: nclR.hasGrades });
  return calcCGPA(results);
}

function getAllGradedCourses() {
  const all = [];
  TERMS.forEach(t => {
    const ts = state.terms[t.id];
    if (!ts.directMode) {
      all.push(...ts.courses);
    }
  });
  if (!state.ncl.directMode) {
    all.push(...state.ncl.courses);
  }
  return all;
}

function getCompExamGrade() {
  const comp = state.ncl.courses.find(c => c.name.includes('Comprehensive'));
  if (!comp || comp.grade === '—') return null;
  // Map Pass/Fail to grade labels the rules engine expects
  if (comp.grade === 'Fail') return 'F';
  if (comp.grade === 'Pass') return 'Pass';
  return comp.grade;
}

// ─── Rendering ────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  const overall = getOverallCGPA();

  app.innerHTML = `
    ${renderHeader(overall.cgpa)}
    <main class="main-content">
      ${renderTabs()}
      <div class="tab-content">
        ${state.activeTab === 'summary' ? renderSummary(overall) : ''}
        ${state.activeTab !== 'summary' && state.activeTab !== 'ncl' ? renderTermDetail(state.activeTab) : ''}
        ${state.activeTab === 'ncl' ? renderNCLDetail() : ''}
      </div>
    </main>
    <footer class="footer">
      <span>SPJIMR PGDM 2025-27 • Academic Tracker</span>
      <a href="https://github.com/Saviojiji/CGPA-CALCULATOR-YEAR-1-SPJIMR" target="_blank" class="footer-star-link">⭐ Found this useful? Give it a Star on GitHub!</a>
    </footer>
  `;

  attachEvents();
}

function renderHeader(cgpa) {
  return `
    <header class="header">
      <div class="header-inner">
        <div class="header-brand">
          <div class="header-logo">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="8" fill="rgba(255,255,255,0.15)"/>
              <path d="M10 18c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M18 14v4l3 3" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <span class="header-title">Academic </span><span class="header-title-bold">Tracker</span>
          </div>
        </div>
        <a href="https://github.com/Saviojiji/CGPA-CALCULATOR-YEAR-1-SPJIMR" target="_blank" class="header-star-link" title="Star on GitHub">⭐ Star</a>
        <div class="header-cgpa">
          <div class="header-cgpa-label">PREDICTED CGPA</div>
          <div class="header-cgpa-value">${cgpa.toFixed(2)}</div>
        </div>
      </div>
    </header>
  `;
}

function renderTabs() {
  const tabs = [
    { id: 'summary', label: 'Summary' },
    ...TERMS.map(t => ({ id: t.id, label: t.name })),
    { id: 'ncl', label: 'NCL' },
  ];

  return `
    <nav class="tabs" role="tablist">
      ${tabs.map(tab => `
        <button
          class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
          data-tab="${tab.id}"
          role="tab"
          aria-selected="${state.activeTab === tab.id}"
        >${tab.label}</button>
      `).join('')}
    </nav>
  `;
}

function renderSummary(overall) {
  const t1 = getTermGPA('term1');
  const t2 = getTermGPA('term2');
  const t3 = getTermGPA('term3');
  const nclR = getNclGPA();

  // Promotion rules
  const gradeCounts = countGrades(getAllGradedCourses());
  const rulesData = {
    term1GPA: t1.hasGrades ? t1.gpa : null,
    cgpa: overall.totalCredits > 0 ? overall.cgpa : null,
    totalCredits: overall.totalCredits,
    compExamGrade: getCompExamGrade(),
    gradeCounts,
  };
  const rules = evaluatePromotionRules(rulesData);
  const overallStatus = getOverallStatus(rules);

  // Combination GPAs
  const combos = getCombinations(t1, t2, t3, nclR);

  return `
    <div class="summary-grid">
      ${renderGPACard('OVERALL CGPA', overall.cgpa, overall.totalCredits, '#1a3a5c', true)}
      ${renderGPACard('TERM 1 GPA', t1.gpa, t1.totalCredits, '#2196F3', t1.hasGrades)}
      ${renderGPACard('TERM 2 GPA', t2.gpa, t2.totalCredits, '#4CAF50', t2.hasGrades)}
      ${renderGPACard('TERM 3 GPA', t3.gpa, t3.totalCredits, '#FF5722', t3.hasGrades)}
    </div>

    <div class="summary-bottom">
      <div class="promotion-card status-${overallStatus}">
        <div class="promotion-header">
          <div class="promotion-icon">${overallStatus === 'on-track' ? '✅' : overallStatus === 'at-risk' ? '⚠️' : '⏳'}</div>
          <div>
            <h3 class="promotion-title">Promotion Status Report</h3>
            <p class="promotion-subtitle">Analysis based on Academic Manual Rule 2.10</p>
          </div>
        </div>
        <div class="promotion-status-banner ${overallStatus}">
          <span class="promotion-status-icon">${overallStatus === 'on-track' ? '✅' : overallStatus === 'at-risk' ? '❌' : '⏳'}</span>
          <div>
            <strong>${overallStatus === 'on-track' ? 'On Track' : overallStatus === 'at-risk' ? 'At Risk' : 'Pending'}</strong>
            <p>${overallStatus === 'on-track'
      ? 'You are currently meeting all promotion criteria. Keep up the great work!'
      : overallStatus === 'at-risk'
        ? 'One or more promotion criteria are not met. Review the details below.'
        : 'Enter your grades to check promotion eligibility.'}</p>
          </div>
        </div>
        <div class="rules-list">
          ${rules.map(r => `
            <div class="rule-item rule-${r.status}">
              <span class="rule-icon">${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏳'}</span>
              <div>
                <div class="rule-label">${r.label}</div>
                <div class="rule-detail">${r.detail}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="side-cards">
        <div class="ncl-summary-card">
          <div class="ncl-summary-header">
            <div>
              <h3>Non-Classroom Learning (NCL)</h3>
              <span class="credit-badge">${nclR.gradedCredits} Credits</span>
            </div>
            <div class="ncl-gpa-box">GPA: ${nclR.hasGrades ? nclR.gpa.toFixed(2) : '0.00'}</div>
          </div>
          <table class="ncl-table">
            <thead><tr><th>Course Name</th><th>Category</th><th>Credits</th><th>Grade</th></tr></thead>
            <tbody>
              ${state.ncl.courses.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.category}</td>
                  <td>${c.credits}</td>
                  <td><span class="grade-chip grade-${c.grade === '—' ? 'none' : c.grade.replace('+', 'p')}">${c.grade}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="combo-card">
          <h3>📊 Combined GPA Calculator</h3>
          <p class="combo-subtitle">All possible term combinations</p>
          <div class="combo-grid">
            ${combos.map(c => `
              <div class="combo-item ${c.hasData ? '' : 'combo-pending'}">
                <div class="combo-label">${c.label}</div>
                <div class="combo-value">${c.hasData ? c.gpa.toFixed(2) : '—'}</div>
                <div class="combo-credits">${c.credits} credits</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function getCombinations(t1, t2, t3, nclR) {
  const terms = [
    { key: 'T1', r: t1 },
    { key: 'T2', r: t2 },
    { key: 'T3', r: t3 },
    { key: 'NCL', r: nclR },
  ];

  const combos = [];

  // All subsets of 2+ terms
  for (let mask = 3; mask < (1 << terms.length); mask++) {
    const selected = [];
    const labels = [];
    for (let i = 0; i < terms.length; i++) {
      if (mask & (1 << i)) {
        selected.push(terms[i].r);
        labels.push(terms[i].key);
      }
    }
    if (selected.length < 2) continue;

    const hasData = selected.every(s => s.hasGrades);
    const result = calcCGPA(selected.map(s => ({
      gpa: s.gpa,
      credits: s.gradedCredits,
      hasGrades: s.hasGrades,
    })));

    combos.push({
      label: labels.join(' + '),
      gpa: result.cgpa,
      credits: result.totalCredits,
      hasData,
    });
  }

  return combos;
}

function renderGPACard(title, gpa, credits, color, hasData) {
  return `
    <div class="gpa-card" style="--card-color: ${color}">
      <div class="gpa-card-top-bar"></div>
      <div class="gpa-card-content">
        <div class="gpa-card-title">${title}</div>
        <div class="gpa-card-value ${hasData ? '' : 'gpa-pending'}">${hasData ? gpa.toFixed(2) : '0.00'}</div>
        <div class="gpa-card-credits">${credits} Credits</div>
      </div>
    </div>
  `;
}

function renderTermDetail(termId) {
  const term = TERMS.find(t => t.id === termId);
  const ts = state.terms[termId];
  const result = getTermGPA(termId);

  return `
    <div class="term-detail">
      <div class="term-detail-header">
        <div>
          <h2 class="term-detail-title">${term.name}</h2>
          <span class="credit-badge">${term.courses.reduce((s, c) => s + c.credits, 0)} Credits</span>
          <span class="term-detail-subtitle">• ${term.weeks}-Week Academic Program</span>
        </div>
        <div class="gpa-display-box" style="--card-color: ${term.color}">
          GPA: ${result.hasGrades ? result.gpa.toFixed(2) : '0.00'}
        </div>
      </div>

      <div class="input-mode-toggle">
        <label class="toggle-switch">
          <input type="checkbox" ${ts.directMode ? 'checked' : ''} data-toggle-term="${termId}" />
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Direct GPA Input Mode <span class="toggle-hint">(type your final GPA if you already calculated it)</span></span>
        ${ts.directMode ? `
          <div class="direct-gpa-input-wrapper">
            <label>Enter Term GPA:</label>
            <input type="number" class="direct-gpa-input" min="0" max="4" step="0.01"
              value="${ts.directGPA}" data-direct-gpa="${termId}" placeholder="0.00" />
          </div>
        ` : ''}
      </div>

      ${ts.directMode ? renderDirectModeMessage() : renderCourseTable(ts.courses, termId)}
    </div>
  `;
}

function renderNCLDetail() {
  const ns = state.ncl;
  const result = getNclGPA();

  return `
    <div class="term-detail">
      <div class="term-detail-header">
        <div>
          <h2 class="term-detail-title">Non-Classroom Learning (NCL)</h2>
          <span class="credit-badge">${NCL.courses.reduce((s, c) => s + c.credits, 0)} Credits</span>
          <span class="term-detail-subtitle">• Year I</span>
        </div>
        <div class="gpa-display-box" style="--card-color: ${NCL.color}">
          GPA: ${result.hasGrades ? result.gpa.toFixed(2) : '0.00'}
        </div>
      </div>

      <div class="input-mode-toggle">
        <label class="toggle-switch">
          <input type="checkbox" ${ns.directMode ? 'checked' : ''} data-toggle-term="ncl" />
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Direct GPA Input Mode <span class="toggle-hint">(type your final GPA if you already calculated it)</span></span>
        ${ns.directMode ? `
          <div class="direct-gpa-input-wrapper">
            <label>Enter NCL GPA:</label>
            <input type="number" class="direct-gpa-input" min="0" max="4" step="0.01"
              value="${ns.directGPA}" data-direct-gpa="ncl" placeholder="0.00" />
          </div>
        ` : ''}
      </div>

      ${ns.directMode ? renderDirectModeMessage() : renderNCLCourseTable()}
    </div>
  `;
}

function renderDirectModeMessage() {
  return `
    <div class="direct-mode-message">
      <div class="direct-mode-icon">📋</div>
      <h3>Detailed Calculation Disabled</h3>
      <p>You are currently using direct input mode. The grades for individual courses will be ignored for calculations.</p>
    </div>
  `;
}

function renderCourseTable(courses, termId) {
  return `
    <div class="course-table-wrapper">
      <table class="course-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-name">Course Name</th>
            <th class="col-credits">Credits</th>
            <th class="col-grade">Grade</th>
            <th class="col-points">Points</th>
          </tr>
        </thead>
        <tbody>
          ${courses.map((c, i) => {
    const pts = GRADE_SCALE.find(g => g.label === c.grade);
    const ptsVal = pts && pts.value !== null ? (pts.value * c.credits).toFixed(1) : '—';
    return `
              <tr>
                <td class="col-num">${i + 1}</td>
                <td class="col-name">${c.name}</td>
                <td class="col-credits">${c.credits}</td>
                <td class="col-grade">
                  <select class="grade-select" data-term="${termId}" data-course="${i}">
                    ${GRADE_SCALE.map(g => `<option value="${g.label}" ${c.grade === g.label ? 'selected' : ''}>${g.label}</option>`).join('')}
                  </select>
                </td>
                <td class="col-points">${ptsVal}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderNCLCourseTable() {
  const PASSFAIL_SCALE = [
    { label: '—', value: null },
    { label: 'Pass', value: 4.0 },
    { label: 'Fail', value: 0.0 },
  ];

  return `
    <div class="course-table-wrapper">
      <table class="course-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-name">Course Name</th>
            <th class="col-category">Category</th>
            <th class="col-credits">Credits</th>
            <th class="col-grading">Grading</th>
            <th class="col-grade">Grade</th>
            <th class="col-points">Points</th>
          </tr>
        </thead>
        <tbody>
          ${state.ncl.courses.map((c, i) => {
    const isPassFail = c.grading === 'passfail';
    const scale = isPassFail ? PASSFAIL_SCALE : GRADE_SCALE;
    const pts = scale.find(g => g.label === c.grade);
    const ptsVal = pts && pts.value !== null ? (pts.value * c.credits).toFixed(1) : '—';
    const gradingLabel = isPassFail ? 'Pass/Fail' : c.grading === 'absolute' ? 'Absolute' : 'Standard';
    const gradingClass = isPassFail ? 'passfail' : c.grading;
    return `
              <tr>
                <td class="col-num">${i + 1}</td>
                <td class="col-name">${c.name}</td>
                <td class="col-category">${c.category}</td>
                <td class="col-credits">${c.credits}</td>
                <td class="col-grading"><span class="grading-badge ${gradingClass}">${gradingLabel}</span></td>
                <td class="col-grade">
                  <select class="grade-select" data-term="ncl" data-course="${i}">
                    ${scale.map(g => `<option value="${g.label}" ${c.grade === g.label ? 'selected' : ''}>${g.label}</option>`).join('')}
                  </select>
                </td>
                <td class="col-points">${ptsVal}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ─── Targeted GPA Display Updates (no full re-render) ─────────
function updateGPADisplays(termId) {
  // Update the GPA display box on the term detail page
  const gpaBox = document.querySelector('.gpa-display-box');
  if (gpaBox) {
    const result = termId === 'ncl' ? getNclGPA() : getTermGPA(termId);
    gpaBox.textContent = `GPA: ${result.hasGrades ? result.gpa.toFixed(2) : '0.00'}`;
  }
  // Update the header CGPA
  const overall = getOverallCGPA();
  const cgpaValue = document.querySelector('.header-cgpa-value');
  if (cgpaValue) {
    cgpaValue.textContent = overall.cgpa.toFixed(2);
  }
}

// ─── Event Handling ───────────────────────────────────────────
function attachEvents() {
  // Tab clicks
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      render();
    });
  });

  // Grade selects
  document.querySelectorAll('.grade-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const termId = e.target.dataset.term;
      const idx = parseInt(e.target.dataset.course);
      if (termId === 'ncl') {
        state.ncl.courses[idx].grade = e.target.value;
      } else {
        state.terms[termId].courses[idx].grade = e.target.value;
      }
      render();
    });
  });

  // Toggle switches
  document.querySelectorAll('[data-toggle-term]').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const termId = e.target.dataset.toggleTerm;
      if (termId === 'ncl') {
        state.ncl.directMode = e.target.checked;
      } else {
        state.terms[termId].directMode = e.target.checked;
      }
      render();
    });
  });

  // Direct GPA inputs — update only GPA displays, NOT the full DOM
  document.querySelectorAll('[data-direct-gpa]').forEach(input => {
    input.addEventListener('input', (e) => {
      const termId = e.target.dataset.directGpa;
      if (termId === 'ncl') {
        state.ncl.directGPA = e.target.value;
      } else {
        state.terms[termId].directGPA = e.target.value;
      }
      // Targeted update — only refresh GPA display values, not the whole page
      updateGPADisplays(termId);
    });
    // Full re-render when user finishes typing (on blur)
    input.addEventListener('blur', () => {
      render();
    });
  });
}

// ─── Boot ─────────────────────────────────────────────────────
render();
