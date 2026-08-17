// CareerOps Web Dashboard — Warm Brown & Beige Light Theme Client App

let currentUser = 'sagar';
let currentFilter = 'all';
let currentSourceFilter = 'all';
let currentPortalFilter = 'all';
let pipelineJobs = [];
let applications = [];
let profiles = {};
let portalQueries = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
  await loadPortalRadar();
  await refreshData();
});

// Switch User (Sagar / Nehalika)
function switchUser(user) {
  currentUser = user;
  
  document.getElementById('tab-sagar').classList.toggle('active', user === 'sagar');
  document.getElementById('tab-nehalika').classList.toggle('active', user === 'nehalika');
  
  const userName = user === 'nehalika' ? 'Nehalika' : 'Sagar';
  const portalNameEl = document.getElementById('portal-user-name');
  if (portalNameEl) portalNameEl.innerText = userName;

  refreshData();
}

// Refresh all data for active user
async function refreshData() {
  await Promise.all([loadPipeline(), loadApplications()]);
  renderPipeline();
  renderTracker();
  renderProfile();
}

// Load Profiles from API
async function loadProfiles() {
  try {
    const res = await fetch('/api/profiles');
    profiles = await res.json();
  } catch (err) {
    console.error('Failed to load profiles:', err);
  }
}

// Load Pipeline Jobs (Includes ATS + Direct Platform Openings)
async function loadPipeline() {
  try {
    const res = await fetch(`/api/pipeline?user=${currentUser}`);
    const data = await res.json();
    pipelineJobs = data.jobs || [];
    
    document.getElementById('stat-active-matches').innerText = `${pipelineJobs.length} Jobs`;
    document.getElementById('tab-count-pipeline').innerText = pipelineJobs.length;
  } catch (err) {
    console.error('Failed to load pipeline:', err);
  }
}

// Load Applications Tracker
async function loadApplications() {
  try {
    const res = await fetch(`/api/applications?user=${currentUser}`);
    const data = await res.json();
    applications = data.applications || [];
    document.getElementById('tab-count-tracker').innerText = applications.length;
  } catch (err) {
    console.error('Failed to load applications:', err);
  }
}

// Load Multi-Portal Radar queries
async function loadPortalRadar() {
  try {
    const res = await fetch('/api/radar-portals');
    portalQueries = await res.json();
    renderPortalRadar();
  } catch (err) {
    console.error('Failed to load portal queries:', err);
  }
}

// Render Pipeline Grid
function renderPipeline() {
  const container = document.getElementById('job-cards-container');
  const search = (document.getElementById('pipeline-search').value || '').toLowerCase();

  const filtered = pipelineJobs.filter(job => {
    // Search filter
    const matchSearch = !search || 
      job.role.toLowerCase().includes(search) || 
      job.company.toLowerCase().includes(search) || 
      job.location.toLowerCase().includes(search) ||
      (job.provider && job.provider.toLowerCase().includes(search));

    if (!matchSearch) return false;

    // Strict avoid filter (Senior, Staff, Lead, Architect, 5+ yrs)
    const lowerRole = job.role.toLowerCase();
    const avoidList = [
      'senior', 'sr.', 'sr ', 'staff', 'principal', 'lead', 'head', 
      'architect', 'director', 'vp', 'manager', 'partner', 'consultant', 
      'legal', 'support', 'sales', '5+ years', '5+ yrs', '6+ years', 
      '7+ years', '10+ years', 'phd'
    ];
    if (avoidList.some(kw => lowerRole.includes(kw))) return false;

    // Role / Tech / Location filter
    if (currentFilter === 'all') return true;
    if (currentFilter === 'bengaluru') return job.location.toLowerCase().includes('bangalore') || job.location.toLowerCase().includes('bengaluru') || job.location.toLowerCase().includes('india');
    if (currentFilter === 'remote') return job.location.toLowerCase().includes('remote');
    if (currentFilter === 'intern') return job.role.toLowerCase().includes('intern') || (job.tags && job.tags.includes('Internship'));
    if (currentFilter === 'fullstack') return (job.tags && job.tags.includes('Full Stack')) || job.role.toLowerCase().includes('mern') || job.role.toLowerCase().includes('full stack') || job.role.toLowerCase().includes('react');
    if (currentFilter === 'backend') return (job.tags && job.tags.includes('Backend')) || job.role.toLowerCase().includes('node') || job.role.toLowerCase().includes('java') || job.role.toLowerCase().includes('backend');
    if (currentFilter === 'ai') return (job.tags && job.tags.includes('AI / ML')) || job.role.toLowerCase().includes('ai') || job.role.toLowerCase().includes('ml');

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <p style="color: var(--text-muted); font-size: 1rem; font-weight: 500;">No jobs found matching this filter.</p>
        <button class="action-btn secondary sm" style="margin-top: 0.85rem;" onclick="setFilter('all', document.querySelector('.filter-pill'))">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(job => {
    const initial = job.company.charAt(0).toUpperCase();
    const sourceClass = getSourceBadgeClass(job.provider || job.source);

    return `
      <div class="job-card-clean">
        <div>
          <div class="card-top">
            <div class="company-title-wrap">
              <div class="company-logo-pill">${initial}</div>
              <span class="company-name">${escapeHtml(job.company)}</span>
            </div>
            <span class="source-badge ${sourceClass}">${escapeHtml(job.provider || 'Direct ATS')}</span>
          </div>

          <div class="job-title-clean">${escapeHtml(job.role)}</div>

          <div class="job-meta-row">
            <span>📍 ${escapeHtml(job.location)}</span>
          </div>

          <div class="tag-list">
            ${(job.tags || []).map(t => `<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>

        <div class="card-footer">
          <span class="posted-date">${job.posted ? '📅 ' + escapeHtml(job.posted) : 'Active'}</span>
          <div class="card-actions">
            <button class="action-btn secondary sm" onclick="openEvaluateModal('${escapeHtml(job.role)}', '${escapeHtml(job.company)}')">
              ⚡ Match Fit
            </button>
            <a href="${escapeHtml(job.url)}" target="_blank" class="action-btn primary sm">
              Apply ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Get Source Badge CSS Class
function getSourceBadgeClass(source = '') {
  const s = source.toLowerCase();
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('wellfound')) return 'wellfound';
  if (s.includes('unstop')) return 'unstop';
  if (s.includes('internshala')) return 'internshala';
  if (s.includes('indeed')) return 'indeed';
  return 'ats';
}

// Render Multi-Portal Radar Queries
function renderPortalRadar() {
  const container = document.getElementById('portal-queries-container');
  const filtered = portalQueries.filter(q => {
    if (currentPortalFilter === 'all') return true;
    return q.portal.toLowerCase() === currentPortalFilter.toLowerCase();
  });

  container.innerHTML = filtered.map(q => {
    const color = q.color || '#85522e';
    return `
      <div class="portal-card-clean" style="border-top: 3px solid ${color};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="portal-badge" style="background: ${color}14; color: ${color}; border: 1px solid ${color}33;">${escapeHtml(q.badge)}</span>
            <span style="font-size: 0.72rem; color: var(--text-dim); font-weight: 500;">${escapeHtml(q.freshness)}</span>
          </div>
          <div class="portal-title">${escapeHtml(q.title)}</div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">📍 ${escapeHtml(q.location)}</p>
        </div>
        <div>
          <a href="${q.url}" target="_blank" class="action-btn secondary full sm" style="border-color: ${color}44;">
            Open ${escapeHtml(q.portal)} Feed ↗
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Set Role / Tech / Location Filter
function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.control-bar .filter-group:first-of-type .filter-pill').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPipeline();
}

// Set Platform Source Filter
function setSourceFilter(source, el) {
  currentSourceFilter = source;
  document.querySelectorAll('.control-bar .filter-group:last-of-type .filter-pill').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPipeline();
}

// Reset All Filters
function resetAllFilters() {
  currentFilter = 'all';
  currentSourceFilter = 'all';
  document.getElementById('pipeline-search').value = '';
  document.querySelectorAll('.control-bar .filter-pill').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.control-bar .filter-group').forEach(group => {
    const firstPill = group.querySelector('.filter-pill');
    if (firstPill) firstPill.classList.add('active');
  });
  renderPipeline();
}

// Set Multi-Portal Radar Filter
function setRadarPortalFilter(portal, el) {
  currentPortalFilter = portal;
  document.querySelectorAll('#view-portals .filter-group .filter-pill').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPortalRadar();
}

// Launch Custom Portal Search
function launchCustomPortalSearch() {
  const portal = document.getElementById('custom-search-portal').value;
  const q = document.getElementById('custom-portal-query').value.trim() || 'Software Engineer Intern';
  let url = '';

  if (portal === 'linkedin') {
    url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&sortBy=DD`;
  } else if (portal === 'unstop') {
    url = `https://unstop.com/internships?search=${encodeURIComponent(q)}`;
  } else if (portal === 'internshala') {
    url = `https://internshala.com/internships/matching-preferences/?search=${encodeURIComponent(q)}`;
  } else if (portal === 'wellfound') {
    url = `https://wellfound.com/jobs?keywords=${encodeURIComponent(q)}&location=Bengaluru`;
  } else if (portal === 'indeed') {
    url = `https://in.indeed.com/jobs?q=${encodeURIComponent(q)}&l=Bengaluru%2C+Karnataka&fromage=7`;
  }

  window.open(url, '_blank');
}

// Switch Navigation Tab Panes
function switchView(viewName) {
  document.querySelectorAll('.tab-pane').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  
  const targetPane = document.getElementById(`view-${viewName}`);
  if (targetPane) targetPane.classList.add('active');

  const tabs = document.querySelectorAll('.nav-tab');
  const viewMap = { pipeline: 0, portals: 1, evaluator: 2, tracker: 3, profile: 4 };
  if (tabs[viewMap[viewName]]) {
    tabs[viewMap[viewName]].classList.add('active');
  }
}

// Render Profile View
function renderProfile() {
  const profile = profiles[currentUser];
  if (!profile) return;
  
  const container = document.getElementById('profile-details-container');
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--text-main);">${escapeHtml(profile.name)}</h2>
        <p style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-top: 0.2rem;">${escapeHtml(profile.title)}</p>
        <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.2rem;">📍 ${escapeHtml(profile.location)} | 🎓 ${escapeHtml(profile.education)}</p>
      </div>
      <div>
        ${profile.github ? `<a href="${profile.github}" target="_blank" class="action-btn secondary sm">GitHub ↗</a>` : ''}
        ${profile.linkedin ? `<a href="${profile.linkedin}" target="_blank" class="action-btn secondary sm" style="margin-left: 0.4rem;">LinkedIn ↗</a>` : ''}
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      <div>
        <h4 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">Core Tech Stack &amp; Skills</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
          ${profile.skills.map(s => `<span class="mini-tag" style="padding: 0.25rem 0.6rem; font-size: 0.78rem; font-weight: 600;">${escapeHtml(s)}</span>`).join('')}
        </div>

        <h4 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--primary);">Target Roles</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
          ${profile.targetRoles.map(r => `<span class="mini-tag" style="background: var(--primary-subtle); color: var(--primary); border-color: var(--primary-border);">${escapeHtml(r)}</span>`).join('')}
        </div>
      </div>

      <div>
        <h4 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">Showcase Projects</h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${profile.projects.map(p => `
            <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${escapeHtml(p.name)}</span>
                <span style="font-size: 0.72rem; color: var(--accent-caramel); font-weight: 600;">${escapeHtml(p.type)}</span>
              </div>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(p.desc)}</p>
              <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-dim); margin-top: 0.4rem;">Tech: ${escapeHtml(p.tech)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render Tracker Table
function renderTracker() {
  const tbody = document.getElementById('tracker-table-body');
  if (applications.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-cell">
          No applications tracked yet. Use the AI Fit Evaluator or Apply directly on pipeline jobs.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = applications.map(app => `
    <tr>
      <td>${escapeHtml(app.num)}</td>
      <td>${escapeHtml(app.date)}</td>
      <td><strong>${escapeHtml(app.company)}</strong></td>
      <td>${escapeHtml(app.role)}</td>
      <td><span class="mini-tag">${escapeHtml(app.score)}</span></td>
      <td><span class="mini-tag" style="background: var(--emerald-subtle); color: var(--emerald);">${escapeHtml(app.status)}</span></td>
      <td>${escapeHtml(app.pdf)}</td>
      <td><span style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(app.notes)}</span></td>
    </tr>
  `).join('');
}

// Trigger Live ATS Portal Scan
async function triggerScan() {
  const btn = document.getElementById('btn-scan');
  const icon = document.getElementById('scan-icon');
  const text = document.getElementById('scan-text');

  btn.disabled = true;
  icon.classList.add('spinning');
  text.innerText = 'Scanning...';

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser })
    });
    const data = await res.json();
    
    if (data.success) {
      await refreshData();
      alert(`✅ Scan complete! Active matching roles refreshed.`);
    } else {
      alert(`⚠️ Scan finished with output: ${data.output || data.error}`);
      await refreshData();
    }
  } catch (err) {
    alert('Error running scan: ' + err.message);
  } finally {
    btn.disabled = false;
    icon.classList.remove('spinning');
    text.innerText = 'Run ATS Scan';
  }
}

// Open Evaluate Modal directly from pipeline
function openEvaluateModal(role, company) {
  switchView('evaluator');
  document.getElementById('eval-title').value = `${role} at ${company}`;
  document.getElementById('eval-text').value = `Looking for ${role} with experience in React, Node.js, Express, MongoDB, REST APIs, and modern web development.`;
  runEvaluation();
}

// Run AI Fit Evaluation
async function runEvaluation() {
  const title = document.getElementById('eval-title').value.trim();
  const text = document.getElementById('eval-text').value.trim();
  const resultBox = document.getElementById('eval-result-box');

  if (!title && !text) {
    alert('Please enter a Job Title or paste Description text to evaluate.');
    return;
  }

  resultBox.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon spinning">⚡</div>
      <h4>Analyzing Compatibility...</h4>
      <p>Comparing requirements against ${currentUser === 'nehalika' ? 'Nehalika' : 'Sagar'}'s CV &amp; portfolio projects.</p>
    </div>
  `;

  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text, user: currentUser })
    });
    const result = await res.json();

    const scoreNum = parseFloat(result.score);
    const scoreColor = scoreNum >= 4.0 ? 'var(--emerald)' : scoreNum >= 3.0 ? 'var(--primary)' : 'var(--rose)';

    resultBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--primary-subtle); border: 1px solid var(--primary-border); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Fit Compatibility Score</div>
          <div style="font-weight: 700; color: ${scoreColor}; font-size: 0.95rem; margin-top: 0.2rem;">${escapeHtml(result.verdict)}</div>
        </div>
        <div style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: ${scoreColor};">${escapeHtml(result.score)} <span style="font-size: 0.9rem; color: var(--text-dim);">/ 5.0</span></div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">Matched Skills</div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
          ${result.matchedSkills.map(s => `<span class="mini-tag" style="background: var(--emerald-subtle); color: var(--emerald); border-color: #bbf7d0; font-weight: 600;">✓ ${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      ${result.missingSkills.length > 0 ? `
        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">Keywords to Prepare</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
            ${result.missingSkills.map(s => `<span class="mini-tag" style="background: #fef3c7; color: var(--amber); border-color: #fde68a; font-weight: 600;">⚠️ ${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div style="background: var(--bg-surface-raised); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-subtle); margin-top: 1rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary); margin-bottom: 0.4rem;">Suggested Resume Bullets for ${escapeHtml(result.candidate)}</div>
        <ul style="padding-left: 1.15rem; font-size: 0.82rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.4rem;">
          ${result.tailoredBullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      </div>
    `;
  } catch (err) {
    resultBox.innerHTML = `<p style="color: var(--rose);">Evaluation failed: ${err.message}</p>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== Deadline Checker — Real Pipeline Job Expiry Scanner =====

async function runDeadlineCheck() {
  const container = document.getElementById('deadline-results');
  const btn = document.getElementById('deadline-check-btn');

  btn.disabled = true;
  container.innerHTML = `
    <div class="search-loading">
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
      <span>Scanning your pipeline for closing postings...</span>
    </div>
  `;

  try {
    const res = await fetch(`/api/deadlines?user=${currentUser}`);
    const data = await res.json();
    renderDeadlineResults(data);
  } catch (err) {
    container.innerHTML = `
      <div class="search-loading" style="color: var(--rose);">
        ⚠️ Check failed: ${err.message}
      </div>
    `;
  } finally {
    btn.disabled = false;
  }
}

function renderDeadlineResults(data) {
  const container = document.getElementById('deadline-results');
  const { summary, jobs, platformLinks } = data;

  // Urgency banner
  let banner = '';
  if (summary.critical > 0) {
    banner = `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.2rem;">🚨</span>
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--rose);">${summary.critical} posting(s) likely expiring or already closed — apply NOW if interested!</span>
      </div>
    `;
  } else if (summary.warning > 0) {
    banner = `
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.2rem;">⚡</span>
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--amber);">${summary.warning} posting(s) may close within days — don't miss out!</span>
      </div>
    `;
  } else {
    banner = `
      <div style="background: var(--emerald-subtle); border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.2rem;">✅</span>
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--emerald);">All ${summary.total} postings look fresh — no urgent deadlines today!</span>
      </div>
    `;
  }

  // Summary stats row
  const statsRow = `
    <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
      <span class="result-deadline-badge urgent" style="cursor: default;">🔴 ${summary.critical} Critical (45+ days old)</span>
      <span class="result-deadline-badge upcoming" style="cursor: default;">🟡 ${summary.warning} Warning (30+ days)</span>
      <span class="result-deadline-badge safe" style="cursor: default;">🟢 ${summary.fresh} Fresh (< 14 days)</span>
      <span style="font-size: 0.72rem; color: var(--text-dim); font-weight: 500; align-self: center; margin-left: auto;">Checked: ${summary.todayStr}</span>
    </div>
  `;

  // Only show non-fresh jobs (the ones that need attention)
  const urgentJobs = jobs.filter(j => j.urgency !== 'fresh' && j.urgency !== 'unknown');

  // Job cards
  const jobCards = urgentJobs.length > 0 ? `
    <div class="search-header-row" style="margin-top: 0.5rem;">
      <h3>⏰ Postings That Need Attention (${urgentJobs.length})</h3>
      <button class="search-clear-btn" onclick="document.getElementById('deadline-results').innerHTML=''">✕ Close</button>
    </div>
    <div class="search-results-grid">
      ${urgentJobs.map(job => {
        const badgeClass = job.urgency === 'critical' ? 'urgent' : job.urgency === 'warning' ? 'upcoming' : 'safe';
        const icon = job.urgency === 'critical' ? '🔴' : job.urgency === 'warning' ? '🟡' : '🔵';
        const initial = job.company.charAt(0).toUpperCase();
        
        return `
          <div class="search-result-card">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <div class="company-logo-pill" style="width: 28px; height: 28px; font-size: 0.7rem;">${initial}</div>
              <div class="result-source">${escapeHtml(job.provider)} • ${escapeHtml(job.company)}</div>
            </div>
            <div class="result-title"><a href="${escapeHtml(job.url)}" target="_blank">${escapeHtml(job.role)}</a></div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin: 0.2rem 0;">📍 ${escapeHtml(job.location)}</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem;">
              <span class="result-deadline-badge ${badgeClass}">${icon} ${job.daysOld !== null ? job.daysOld + ' days old' : 'Unknown age'}</span>
              <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: 500;">${escapeHtml(job.urgencyLabel)}</span>
            </div>
            <div style="display: flex; gap: 0.4rem; margin-top: 0.6rem;">
              <a href="${escapeHtml(job.url)}" target="_blank" class="action-btn primary sm" style="font-size: 0.72rem;">Apply Now ↗</a>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // Platform "ending soon" links
  const platformSection = `
    <div class="search-header-row" style="margin-top: 1rem;">
      <h3>🔗 Check "Ending Soon" on Each Platform</h3>
    </div>
    <div class="search-results-grid">
      ${platformLinks.map(p => `
        <div class="search-result-card" style="border-left: 3px solid var(--primary);">
          <div class="result-source">${p.icon} ${escapeHtml(p.platform)}</div>
          <div class="result-title"><a href="${escapeHtml(p.url)}" target="_blank">${escapeHtml(p.label)}</a></div>
          <div class="result-snippet">${escapeHtml(p.tip)}</div>
          <div style="margin-top: 0.6rem;">
            <a href="${escapeHtml(p.url)}" target="_blank" class="action-btn secondary sm" style="font-size: 0.72rem;">Open ${escapeHtml(p.platform)} ↗</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = banner + statsRow + jobCards + platformSection;
}
