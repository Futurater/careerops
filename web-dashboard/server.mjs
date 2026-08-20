import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = parseInt(process.env.PORT || '3000', 10);

// Helper to parse YAML-like profile minimally or safely
function parseSimpleYaml(content) {
  const lines = content.split('\n');
  const obj = {};
  let currentKey = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (trimmed.includes(':') && !line.startsWith('  ') && !line.startsWith('    ')) {
      const idx = trimmed.indexOf(':');
      currentKey = trimmed.substring(0, idx).trim();
      obj[currentKey] = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return obj;
}

// Parse pipeline.md (Scanned Direct ATS Applications)
function parsePipeline(user = 'sagar') {
  const folder = user === 'nehalika' ? 'career-ops-nehalika' : 'career-ops-sagar';
  const filePath = path.join(ROOT_DIR, folder, 'data', 'pipeline.md');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const jobs = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      const isDone = trimmed.startsWith('- [x]');
      const clean = trimmed.replace(/^-\s*\[[ x]\]\s*/, '');
      const parts = clean.split('|').map(s => s.trim());
      
      if (parts.length >= 3) {
        const url = parts[0];
        const company = parts[1];
        const role = parts[2];
        const location = parts[3] || 'Remote / Unspecified';
        const posted = parts[4] || '';
        
        let provider = 'Direct ATS';
        if (url.includes('greenhouse.io')) provider = 'Greenhouse';
        else if (url.includes('ashbyhq.com')) provider = 'Ashby';
        else if (url.includes('lever.co')) provider = 'Lever';
        else if (url.includes('workday')) provider = 'Workday';
        else if (url.includes('smartrecruiters')) provider = 'SmartRecruiters';
        else if (url.includes('rippling')) provider = 'Rippling';

        const lowerRole = role.toLowerCase();
        
        // Exclude senior, architect, partner, legal, 5+ yrs roles
        const avoidList = [
          'senior', 'sr.', 'sr ', 'staff', 'principal', 'lead', 'head', 
          'architect', 'director', 'vp', 'manager', 'partner', 'consultant', 
          'legal', 'support', 'sales', '5+ years', '5+ yrs', '6+ years', 
          '7+ years', '10+ years', 'phd'
        ];
        if (avoidList.some(kw => lowerRole.includes(kw))) {
          continue; // skip senior / 5+ yrs roles
        }

        const tags = [];
        if (lowerRole.includes('intern') || lowerRole.includes('fellow')) tags.push('Internship');
        if (lowerRole.includes('mern') || lowerRole.includes('full stack') || lowerRole.includes('fullstack')) tags.push('Full Stack');
        if (lowerRole.includes('frontend') || lowerRole.includes('react')) tags.push('Frontend');
        if (lowerRole.includes('backend') || lowerRole.includes('node') || lowerRole.includes('java')) tags.push('Backend');
        if (lowerRole.includes('ai') || lowerRole.includes('ml') || lowerRole.includes('agent')) tags.push('AI / ML');
        if (location.toLowerCase().includes('bangalore') || location.toLowerCase().includes('bengaluru')) tags.push('Bengaluru');
        if (location.toLowerCase().includes('remote')) tags.push('Remote');
        if (location.toLowerCase().includes('india')) tags.push('India');
        
        jobs.push({
          id: Buffer.from(url).toString('base64').substring(0, 16),
          url,
          company,
          role,
          location,
          posted: posted.replace('posted:', '').trim(),
          provider,
          tags,
          status: isDone ? 'Applied' : 'New',
        });
      }
    }
  }
  
  return jobs;
}

// Parse applications.md
function parseApplications(user = 'sagar') {
  const folder = user === 'nehalika' ? 'career-ops-nehalika' : 'career-ops-sagar';
  const filePath = path.join(ROOT_DIR, folder, 'data', 'applications.md');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const apps = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.startsWith('| #') || trimmed.startsWith('|---')) continue;
    
    const cols = trimmed.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cols.length >= 8) {
      apps.push({
        num: cols[0],
        date: cols[1],
        company: cols[2],
        role: cols[3],
        score: cols[4],
        status: cols[5],
        pdf: cols[6],
        report: cols[7],
        notes: cols[8] || ''
      });
    }
  }
  
  return apps;
}

// Profiles Data
function getProfiles() {
  const profiles = {
    sagar: {
      name: 'C A Sagar Varma',
      title: 'Full Stack & MERN Developer | B.E. CSE @ Sir MVIT',
      location: 'Bengaluru, Karnataka, India',
      email: 'santoshpallavi107@gmail.com',
      github: 'https://github.com/Futurater',
      linkedin: 'https://www.linkedin.com/in/sagar-varma-760553297/',
      education: 'B.E. Computer Science and Engineering, Sir MVIT (2023-2027)',
      targetRoles: ['SDE Intern', 'Full Stack Developer Intern', 'MERN Stack Developer Intern', 'Associate Software Engineer'],
      skills: ['Java (DSA)', 'JavaScript (ES6+)', 'Python', 'React 18', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'Docker', 'REST APIs', 'Microservices', 'Tailwind CSS', 'Bootstrap', 'Git/GitHub'],
      projects: [
        { name: 'Vantage', type: 'Full-Stack + AI', tech: 'React, Node.js, Python, Gemini API, Docker', desc: 'Trading platform with microservices & Gemini AI Stock Advisor.' },
        { name: 'StayNest', type: 'Property Rental', tech: 'Node.js, Express, MongoDB, Cloudinary, Gemini API', desc: 'Property management with AI assistant & Passport auth.' },
        { name: 'Unshell', type: 'FinTech AML', tech: 'Node.js, Express, MongoDB Atlas, React Flow', desc: '2nd Runner-Up at NMAMIT National Hackfest.' }
      ]
    },
    nehalika: {
      name: 'Nadikatla Nehalika',
      title: 'AI & ML Undergraduate | Full Stack & MERN Developer @ Sir MVIT',
      location: 'Bengaluru, Karnataka, India',
      email: '',
      github: 'https://github.com/nehalikareddy',
      linkedin: '',
      education: 'B.E. Artificial Intelligence and Machine Learning, Sir MVIT (2023-2027, CGPA 8.94/10)',
      targetRoles: ['SDE Intern', 'Software Engineer Intern', 'Full Stack Developer Intern', 'MERN Stack Developer Intern', 'Associate Software Engineer'],
      skills: ['Java (DSA)', 'JavaScript (ES6+)', 'Python', 'React 18 + Vite', 'Node.js', 'Express.js', 'MongoDB Atlas', 'MySQL', 'AWS S3', 'Socket.IO', 'WebRTC', 'Docker', 'Kubernetes basics', 'CI/CD (Jenkins/Ansible basics)'],
      projects: [
        { name: 'Clarix', type: 'Legal AI Platform (Solo)', tech: 'React 18, Vite, Express, MongoDB, Gemini 1.5 Flash', desc: 'Document summarization, risk detection & legal chat assistant.' },
        { name: 'Trace', type: 'Distributed VCS (Solo)', tech: 'Node.js, Yargs, AWS S3, MongoDB, Socket.IO, React', desc: 'Git-inspired CLI with S3 object storage & real-time web dashboard.' },
        { name: 'Unshell', type: 'AML/KYB Platform (Team)', tech: 'React, Express.js REST API, MongoDB Atlas', desc: '2nd Runner-Up at 36-hr National Hackathon (Built React UI & Express backend).' }
      ]
    }
  };
  return profiles;
}

// Curated Multi-Portal Search Queries (LinkedIn, Unstop, Internshala, Indeed, Wellfound)
function getRadarPortals() {
  return [
    // LinkedIn
    {
      portal: 'LinkedIn',
      logo: 'linkedin',
      title: 'SDE Intern — Bengaluru',
      role: 'Software Development Engineer Intern',
      location: 'Bengaluru, Karnataka, India',
      badge: 'LinkedIn • Hot',
      color: '#0a66c2',
      freshness: 'Past 24 Hours',
      url: 'https://www.linkedin.com/jobs/search/?keywords=SDE%20Intern&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r86400&f_E=1%2C2&sortBy=DD'
    },
    {
      portal: 'LinkedIn',
      logo: 'linkedin',
      title: 'Full Stack / MERN Intern — Bengaluru / Remote',
      role: 'Full Stack Developer Intern',
      location: 'Bengaluru / Remote',
      badge: 'LinkedIn • Direct',
      color: '#0a66c2',
      freshness: 'Past Week',
      url: 'https://www.linkedin.com/jobs/search/?keywords=MERN%20Stack%20Intern%20OR%20Full%20Stack%20Intern&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&f_E=1%2C2&sortBy=DD'
    },
    // Unstop
    {
      portal: 'Unstop',
      logo: 'unstop',
      title: 'Tech & SDE Internships — Bengaluru',
      role: 'Software Engineer Intern (0-1 Yrs)',
      location: 'Bengaluru / Hybrid / Remote',
      badge: 'Unstop • Competitions',
      color: '#2563eb',
      freshness: 'Active Challenges',
      url: 'https://unstop.com/internships?workExperience=0-1&quickApply=0&locations=Bengaluru&search=Software%20Engineer'
    },
    {
      portal: 'Unstop',
      logo: 'unstop',
      title: 'Full Stack Web Dev Hiring Challenges',
      role: 'Full Stack & MERN Developer',
      location: 'India / Remote',
      badge: 'Unstop • Fast-Track',
      color: '#2563eb',
      freshness: 'New Listings',
      url: 'https://unstop.com/internships?search=Full%20Stack%20Developer'
    },
    {
      portal: 'Unstop',
      logo: 'unstop',
      title: 'Top Hackathons & Tech Hiring Drives',
      role: 'Developer Hackathons with Pre-Placement Offers',
      location: 'Pan India',
      badge: 'Unstop • Hackathons',
      color: '#2563eb',
      freshness: 'PPO & Cash Prizes',
      url: 'https://unstop.com/hackathons'
    },
    // Internshala
    {
      portal: 'Internshala',
      logo: 'internshala',
      title: 'CS & Software Dev Internships (Bengaluru)',
      role: 'Software Development Intern (Paid)',
      location: 'Bengaluru, India',
      badge: 'Internshala • Paid',
      color: '#008BDC',
      freshness: 'Daily Updated',
      url: 'https://internshala.com/internships/computer-science-internship-in-bangalore/'
    },
    {
      portal: 'Internshala',
      logo: 'internshala',
      title: 'MERN Stack & Full Stack Internships',
      role: 'MERN / React / Node.js Developer Intern',
      location: 'Bengaluru / Work From Home',
      badge: 'Internshala • Paid',
      color: '#008BDC',
      freshness: 'Daily Updated',
      url: 'https://internshala.com/internships/mern-stack-development-internship/'
    },
    // Wellfound (AngelList)
    {
      portal: 'Wellfound',
      logo: 'wellfound',
      title: 'High-Growth Startup SDE Interns',
      role: 'Software Engineer / Full Stack Intern',
      location: 'Bengaluru / Remote India',
      badge: 'Wellfound • YC Startups',
      color: '#ef4444',
      freshness: 'High Growth',
      url: 'https://wellfound.com/jobs?role=software-engineer&location=Bengaluru&types=internship'
    },
    {
      portal: 'Wellfound',
      logo: 'wellfound',
      title: 'React & Frontend Startup Opportunities',
      role: 'Frontend Engineer / React Developer',
      location: 'India / Remote',
      badge: 'Wellfound • Direct Founders',
      color: '#ef4444',
      freshness: 'Actively Hiring',
      url: 'https://wellfound.com/jobs?role=frontend-engineer&keywords=React&location=India'
    },
    // Indeed India
    {
      portal: 'Indeed',
      logo: 'indeed',
      title: 'SDE Interns & Freshers — Bengaluru',
      role: 'Software Engineer Intern / Fresher',
      location: 'Bengaluru, Karnataka',
      badge: 'Indeed • Fresh',
      color: '#2164f3',
      freshness: 'Past 7 Days',
      url: 'https://in.indeed.com/jobs?q=SDE+Intern&l=Bengaluru%2C+Karnataka&fromage=7'
    },
    {
      portal: 'Indeed',
      logo: 'indeed',
      title: 'MERN & Full Stack Internships — Remote/Blr',
      role: 'Full Stack Developer Intern',
      location: 'Bengaluru / Remote',
      badge: 'Indeed • Active',
      color: '#2164f3',
      freshness: 'Past 7 Days',
      url: 'https://in.indeed.com/jobs?q=Full+Stack+Developer+Intern&l=Bengaluru%2C+Karnataka&fromage=7'
    }
  ];
}

// AI Match Evaluator Simulation
function evaluateJob(jobText, user = 'sagar') {
  const profiles = getProfiles();
  const profile = profiles[user] || profiles.sagar;
  
  const text = jobText.toLowerCase();
  const matchedSkills = [];
  const missingSkills = [];
  
  for (const skill of profile.skills) {
    const cleanSkill = skill.toLowerCase().replace(/\(.*?\)/g, '').trim();
    if (cleanSkill.length > 2 && text.includes(cleanSkill)) {
      matchedSkills.push(skill);
    }
  }
  
  // Look for common tech keywords in job text that might be missing
  const commonKeywords = ['typescript', 'graphql', 'next.js', 'redis', 'kafka', 'postgresql', 'c++', 'go', 'spring boot', 'flutter', 'tailwind'];
  for (const kw of commonKeywords) {
    if (text.includes(kw) && !matchedSkills.some(s => s.toLowerCase().includes(kw))) {
      missingSkills.push(kw);
    }
  }
  
  // Calculate score (out of 5.0)
  let score = 3.5;
  if (text.includes('react') || text.includes('node') || text.includes('javascript') || text.includes('full stack')) score += 0.6;
  if (text.includes('mongodb') || text.includes('express') || text.includes('api')) score += 0.4;
  if (text.includes('intern') || text.includes('graduate') || text.includes('associate') || text.includes('entry')) score += 0.5;
  if (text.includes('senior') || text.includes('lead') || text.includes('5+ years') || text.includes('principal')) score -= 1.5;
  
  score = Math.max(1.0, Math.min(5.0, score));
  
  return {
    score: score.toFixed(1),
    verdict: score >= 4.0 ? 'HIGH MATCH (Apply Recommended)' : score >= 3.0 ? 'MODERATE FIT' : 'LOW FIT (Not Recommended)',
    matchedSkills: matchedSkills.length > 0 ? matchedSkills : ['JavaScript (ES6+)', 'React 18', 'REST APIs', 'Node.js'],
    missingSkills: missingSkills.slice(0, 4),
    tailoredBullets: [
      `Engineered responsive web applications leveraging ${matchedSkills.slice(0, 2).join(' and ') || 'React 18 and Node.js'} with robust REST API persistence.`,
      `Built high-performance full-stack architectures with clean state management, modular components, and cloud deployment.`
    ],
    candidate: profile.name
  };
}

// Deadline Checker — Analyzes real pipeline jobs + portal listings for closing/expiring postings
function checkDeadlines(user = 'sagar') {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const jobs = parsePipeline(user);

  // Categorize each job by urgency based on posted date
  const analyzed = jobs.map(job => {
    let daysOld = null;
    let urgency = 'unknown';
    let urgencyLabel = 'Unknown posting age';

    if (job.posted) {
      const postedDate = new Date(job.posted);
      if (!isNaN(postedDate.getTime())) {
        const diffMs = today - postedDate;
        daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (daysOld >= 45) {
          urgency = 'critical';
          urgencyLabel = `Posted ${daysOld} days ago — likely closing very soon or already closed`;
        } else if (daysOld >= 30) {
          urgency = 'warning';
          urgencyLabel = `Posted ${daysOld} days ago — may close within days`;
        } else if (daysOld >= 14) {
          urgency = 'watch';
          urgencyLabel = `Posted ${daysOld} days ago — apply within 1-2 weeks`;
        } else {
          urgency = 'fresh';
          urgencyLabel = `Posted ${daysOld} days ago — recently listed`;
        }
      }
    }

    return { ...job, daysOld, urgency, urgencyLabel };
  });

  // Sort: most urgent first
  analyzed.sort((a, b) => {
    const order = { critical: 0, warning: 1, watch: 2, fresh: 3, unknown: 4 };
    return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
  });

  // Summary counts
  const summary = {
    total: analyzed.length,
    critical: analyzed.filter(j => j.urgency === 'critical').length,
    warning: analyzed.filter(j => j.urgency === 'warning').length,
    watch: analyzed.filter(j => j.urgency === 'watch').length,
    fresh: analyzed.filter(j => j.urgency === 'fresh').length,
    todayStr,
  };

  // Platform-specific "ending soon" links
  const platformLinks = [
    {
      platform: 'Internshala',
      label: 'Internships closing soon',
      icon: '🎓',
      url: 'https://internshala.com/internships/computer-science-internship-in-bangalore/',
      tip: 'Sort by "Closing Soon" on the page'
    },
    {
      platform: 'Unstop',
      label: 'Competitions & internships ending today',
      icon: '🏆',
      url: 'https://unstop.com/internships?sort=deadline&locations=Bengaluru',
      tip: 'Sorted by nearest deadline'
    },
    {
      platform: 'LinkedIn',
      label: 'Jobs posted in last 24 hours (apply before they fill)',
      icon: '💼',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer%20Intern&location=India&f_TPR=r86400&f_E=1%2C2&sortBy=DD',
      tip: 'Most recent first — earliest applicants get priority'
    },
    {
      platform: 'Indeed India',
      label: 'SDE Intern postings — last 3 days',
      icon: '🔍',
      url: 'https://in.indeed.com/jobs?q=SDE+Intern&l=Bengaluru%2C+Karnataka&fromage=3&sort=date',
      tip: 'Newest first — some expire within days'
    },
    {
      platform: 'Wellfound',
      label: 'Startup internships actively hiring now',
      icon: '🚀',
      url: 'https://wellfound.com/jobs?role=software-engineer&location=India&types=internship',
      tip: 'Startup roles fill fast — apply immediately'
    }
  ];

  return { summary, jobs: analyzed, platformLinks };
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname === '/api/profiles') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getProfiles()));
    return;
  }
  
  if (pathname === '/api/pipeline') {
    const user = urlObj.searchParams.get('user') || 'sagar';
    const jobs = parsePipeline(user);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user, count: jobs.length, jobs }));
    return;
  }
  
  if (pathname === '/api/applications') {
    const user = urlObj.searchParams.get('user') || 'sagar';
    const apps = parseApplications(user);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user, count: apps.length, applications: apps }));
    return;
  }
  
  if (pathname === '/api/linkedin-radar' || pathname === '/api/radar-portals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getRadarPortals()));
    return;
  }
  
  if (pathname === '/api/evaluate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const evaluation = evaluateJob(data.text || data.title || '', data.user || 'sagar');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(evaluation));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  if (pathname === '/api/scan' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const data = body ? JSON.parse(body) : {};
      const user = data.user || 'sagar';
      const targetDir = user === 'nehalika' ? 'career-ops-nehalika' : 'career-ops-sagar';
      const scanPath = path.join(ROOT_DIR, targetDir);
      
      exec('node scan.mjs', { cwd: scanPath }, (error, stdout, stderr) => {
        if (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: stderr || error.message, output: stdout }));
          return;
        }
        const updatedJobs = parsePipeline(user);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, newCount: updatedJobs.length, output: stdout, jobs: updatedJobs }));
      });
    });
    return;
  }
  
  if (pathname === '/api/deadlines') {
    const user = urlObj.searchParams.get('user') || 'sagar';
    const data = checkDeadlines(user);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }
  
  // Static Files
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 Career-Ops Web Dashboard running on http://${HOST}:${PORT}`);
});
