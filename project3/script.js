/* ============================================================
   PULSE — Interactive Dashboard  |  script.js
   All DOM interactions, no libraries, no frameworks
   ============================================================ */

'use strict';

/* ── UTILS ──────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(msg, duration = 2800) {
  const toast = $('#js-toast');
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => toast.classList.remove('is-visible'), duration);
}

/* ── 1. RIPPLE EFFECT ───────────────────────────────────────── */
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.js-ripple');
  if (!btn) return;
  const r = document.createElement('span');
  r.className = 'ripple-effect';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  r.style.cssText = `
    width: ${size}px; height: ${size}px;
    left: ${e.clientX - rect.left - size / 2}px;
    top:  ${e.clientY - rect.top  - size / 2}px;
  `;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove(), { once: true });
});

/* ── 2. NAVBAR — scroll shadow + active link highlight ──────── */
const navbar = $('#js-navbar');
const navLinks = $$('.nav__links a');
const sections = $$('main section[id]');

const scrollHandler = () => {
  navbar.classList.toggle('is-scrolled', window.scrollY > 20);

  // Highlight nav link for current section
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`);
  });
};

window.addEventListener('scroll', scrollHandler, { passive: true });
scrollHandler();

/* ── 3. MOBILE MENU ─────────────────────────────────────────── */
const hamburger  = $('#js-hamburger');
const mobileMenu = $('#js-mobile-menu');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('is-open');
  hamburger.setAttribute('aria-expanded', open);
  mobileMenu.classList.toggle('is-open', open);
  mobileMenu.setAttribute('aria-hidden', !open);
});

// Close on link click
$$('.js-menu-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', false);
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', true);
  });
});

// Close on outside click
document.addEventListener('click', e => {
  if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', false);
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', true);
  }
});

/* ── 4. DARK / LIGHT THEME TOGGLE ───────────────────────────── */
const themeBtn  = $('#js-theme-btn');
const root      = document.documentElement;

// Persist preference
const savedTheme = localStorage.getItem('pulse-theme') || 'light';
root.setAttribute('data-theme', savedTheme);
themeBtn.setAttribute('aria-pressed', savedTheme === 'light');

themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  themeBtn.setAttribute('aria-pressed', next === 'light');
  localStorage.setItem('pulse-theme', next);
  showToast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
});

/* ── 5. TYPEWRITER EFFECT ───────────────────────────────────── */
(function typewriter() {
  const el    = $('#js-typewriter');
  const words = ['in one place.', 'you need.', 'at a glance.', 'that matters.'];
  let wi = 0, ci = 0, deleting = false;
  const SPEED_TYPE = 65, SPEED_DEL = 35, PAUSE = 1800;

  function tick() {
    const word = words[wi];
    el.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);

    if (!deleting && ci > word.length) {
      deleting = true;
      setTimeout(tick, PAUSE);
      return;
    }
    if (deleting && ci < 0) {
      deleting = false;
      wi = (wi + 1) % words.length;
      ci = 0;
      setTimeout(tick, 400);
      return;
    }
    setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE);
  }
  tick();
})();

/* ── 6. ANIMATED COUNTERS ───────────────────────────────────── */
const statCards = $$('.stat-card');

function animateCounter(el, target, suffix, duration = 1400) {
  const start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function runCounters() {
  statCards.forEach((card, i) => {
    const target  = +card.dataset.target;
    const suffix  = card.dataset.suffix || '';
    const el      = card.querySelector('.js-counter');
    const fill    = card.querySelector('.stat__fill');

    // Stagger
    setTimeout(() => {
      animateCounter(el, target, suffix);
      fill.style.width = fill.style.getPropertyValue('--fill') || '0';
    }, i * 120);
  });
}

// Trigger on first scroll into view
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { runCounters(); statsObserver.unobserve(e.target); } });
}, { threshold: 0.25 });

const statsSection = $('#stats');
if (statsSection) statsObserver.observe(statsSection);

// Recount button
$('#js-recount-btn').addEventListener('click', () => {
  $$('.js-counter').forEach(el => el.textContent = '0');
  $$('.stat__fill').forEach(fill => { fill.style.width = '0'; });
  setTimeout(runCounters, 80);
});

/* ── 7. TABS ────────────────────────────────────────────────── */
const tabs      = $$('.js-tab');
const indicator = $('#js-tab-indicator');

function moveIndicator(tab) {
  indicator.style.left  = `${tab.offsetLeft}px`;
  indicator.style.width = `${tab.offsetWidth}px`;
}

function activateTab(tab) {
  tabs.forEach(t => {
    t.classList.remove('is-active');
    t.setAttribute('aria-selected', 'false');
  });
  tab.classList.add('is-active');
  tab.setAttribute('aria-selected', 'true');
  moveIndicator(tab);

  // Show correct panel
  const target = tab.dataset.tab;
  $$('.tab-panel').forEach(p => {
    const show = p.id === `tab-panel-${target}`;
    p.classList.toggle('is-active', show);
    p.hidden = !show;
  });

  renderAllPanels();
}

tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));

// Set initial indicator position after layout
requestAnimationFrame(() => {
  const activeTab = $('.tab.is-active');
  if (activeTab) moveIndicator(activeTab);
});

// Keyboard arrow navigation
$$('.tabs').forEach(tablist => {
  tablist.addEventListener('keydown', e => {
    const all = $$('.js-tab', tablist);
    const idx = all.indexOf(document.activeElement);
    if (e.key === 'ArrowRight') { all[(idx + 1) % all.length].focus(); }
    if (e.key === 'ArrowLeft')  { all[(idx - 1 + all.length) % all.length].focus(); }
  });
});

/* ── 8. TASK MANAGER ────────────────────────────────────────── */
let tasks = JSON.parse(localStorage.getItem('pulse-tasks') || '[]');

const taskInput   = $('#js-task-input');
const addTaskBtn  = $('#js-add-task-btn');
const clearDone   = $('#js-clear-done');
const taskCount   = $('#js-task-count');

function saveTasks() {
  localStorage.setItem('pulse-tasks', JSON.stringify(tasks));
}

function buildTaskItem(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.done ? ' is-done' : ''}`;
  li.dataset.id = task.id;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'task-checkbox';
  cb.checked = task.done;
  cb.setAttribute('aria-label', `Mark "${task.text}" as done`);

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;

  const del = document.createElement('button');
  del.className = 'task-delete';
  del.innerHTML = '&times;';
  del.setAttribute('aria-label', `Delete task: ${task.text}`);

  li.append(cb, span, del);
  return li;
}

function renderAllPanels() {
  const panels = {
    all:    { list: $('#js-task-list-all'),    empty: $('#js-empty-all'),    filter: () => true },
    active: { list: $('#js-task-list-active'), empty: $('#js-empty-active'), filter: t => !t.done },
    done:   { list: $('#js-task-list-done'),   empty: $('#js-empty-done'),   filter: t => t.done },
  };

  Object.values(panels).forEach(({ list, empty, filter }) => {
    list.innerHTML = '';
    const filtered = tasks.filter(filter);
    empty.hidden = filtered.length > 0;
    filtered.forEach(task => list.appendChild(buildTaskItem(task)));
  });

  const total = tasks.length;
  taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}`;
  saveTasks();
}

// Delegate events on all three task lists
['js-task-list-all', 'js-task-list-active', 'js-task-list-done'].forEach(id => {
  const list = $(`#${id}`);

  list.addEventListener('change', e => {
    const cb = e.target.closest('.task-checkbox');
    if (!cb) return;
    const id = cb.closest('.task-item').dataset.id;
    const task = tasks.find(t => t.id === id);
    if (task) { task.done = cb.checked; renderAllPanels(); }
  });

  list.addEventListener('click', e => {
    const del = e.target.closest('.task-delete');
    if (!del) return;
    const item = del.closest('.task-item');
    const id   = item.dataset.id;
    // Animate out
    item.style.opacity = '0';
    item.style.transform = 'scale(0.95)';
    item.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      renderAllPanels();
    }, 200);
  });
});

function addTask(text) {
  text = text.trim();
  if (!text) { showToast('⚠️ Type something first'); taskInput.focus(); return; }
  tasks.unshift({ id: Date.now().toString(36), text, done: false });
  renderAllPanels();
  taskInput.value = '';
  taskInput.focus();
  showToast('✓ Task added');
}

addTaskBtn.addEventListener('click', () => addTask(taskInput.value));
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(taskInput.value); });

clearDone.addEventListener('click', () => {
  const count = tasks.filter(t => t.done).length;
  if (!count) { showToast('No completed tasks'); return; }
  tasks = tasks.filter(t => !t.done);
  renderAllPanels();
  showToast(`🗑 Cleared ${count} task${count !== 1 ? 's' : ''}`);
});

// Initial render
renderAllPanels();

/* ── 9. NOTES — live char / word / reading time ─────────────── */
const notesArea   = $('#js-notes-area');
const charCount   = $('#js-char-count');
const wordCount   = $('#js-word-count');
const readTime    = $('#js-read-time');
const charRing    = $('#js-char-ring');
const charRemain  = $('#js-char-remain');
const clearNotes  = $('#js-clear-notes');
const MAX_CHARS   = 500;
const CIRCUMF     = 2 * Math.PI * 15.9; // r=15.9 → ~99.9

function updateNotes() {
  const val   = notesArea.value;
  const chars = val.length;
  const words = val.trim() ? val.trim().split(/\s+/).length : 0;
  const secs  = Math.ceil((words / 238) * 60); // 238 wpm average

  charCount.textContent  = chars;
  wordCount.textContent  = words;
  readTime.textContent   = secs < 60 ? `${secs}s` : `${Math.ceil(secs / 60)}m`;
  charRemain.textContent = MAX_CHARS - chars;

  const pct  = chars / MAX_CHARS;
  const dash = (pct * CIRCUMF).toFixed(2);
  charRing.setAttribute('stroke-dasharray', `${dash} ${CIRCUMF}`);

  charRing.classList.toggle('is-warning',  pct >= 0.75 && pct < 0.9);
  charRing.classList.toggle('is-critical', pct >= 0.9);
}

notesArea.addEventListener('input', updateNotes);

clearNotes.addEventListener('click', () => {
  notesArea.value = '';
  updateNotes();
  notesArea.focus();
  showToast('Notes cleared');
});

// Restore from localStorage
const savedNotes = localStorage.getItem('pulse-notes');
if (savedNotes) { notesArea.value = savedNotes; updateNotes(); }
notesArea.addEventListener('input', () => localStorage.setItem('pulse-notes', notesArea.value));

updateNotes();

/* ── 10. COLOR MIXER ────────────────────────────────────────── */
const sliders     = $$('.js-color-slider');
const hexOutput   = $('#js-hex-output');
const colorPreview = $('#js-color-preview');
const previewLabel = $('#js-preview-label');
const copyHexBtn  = $('#js-copy-hex');

const colorState  = { r: 128, g: 90, b: 240 };

const colorLabels = [
  { name: 'Feeling electric',  test: (r,g,b) => b > 180 && b > r && b > g },
  { name: 'On fire',           test: (r,g,b) => r > 200 && g < 80 },
  { name: 'Pure envy',         test: (r,g,b) => g > 180 && g > r * 1.3 && g > b * 1.3 },
  { name: 'Ocean deep',        test: (r,g,b) => b > 120 && g > 80 && r < 80 },
  { name: 'Cotton candy',      test: (r,g,b) => r > 200 && b > 150 && g < 140 },
  { name: 'Midnight coal',     test: (r,g,b) => r < 50 && g < 50 && b < 50 },
  { name: 'Blinding light',    test: (r,g,b) => r > 220 && g > 220 && b > 220 },
  { name: 'Golden hour',       test: (r,g,b) => r > 200 && g > 140 && b < 80 },
  { name: 'Mint fresh',        test: (r,g,b) => g > 180 && b > 150 && r < 130 },
  { name: 'Just vibing',       test: ()      => true },
];

function toHex(v) { return v.toString(16).padStart(2, '0'); }

function getLabel(r, g, b) {
  return colorLabels.find(l => l.test(r, g, b))?.name ?? 'Just vibing';
}

function getLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function updateColor() {
  const { r, g, b } = colorState;
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  hexOutput.textContent          = hex;
  colorPreview.style.background  = `rgb(${r},${g},${b})`;
  previewLabel.textContent       = getLabel(r, g, b);

  // Auto contrast the label
  const lum = getLuminance(r, g, b);
  previewLabel.style.color = lum > 160 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.92)';

  // Update slider thumb colors via custom property
  sliders.forEach(s => {
    const ch = s.dataset.channel;
    const val = colorState[ch];
    const pct = (val / 255) * 100;
    s.style.background =
      `linear-gradient(to right, rgb(${
        ch === 'r' ? val : 0},${ch === 'g' ? val : 0},${ch === 'b' ? val : 0
      }) 0%, var(--clr-border) ${pct}%, var(--clr-border) 100%)`;
  });
}

sliders.forEach(slider => {
  const ch  = slider.dataset.channel;
  const val = $(`#val-${ch}`);
  slider.value = colorState[ch];

  slider.addEventListener('input', () => {
    colorState[ch] = +slider.value;
    val.textContent = slider.value;
    updateColor();
  });
});

copyHexBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(hexOutput.textContent);
    showToast(`📋 Copied ${hexOutput.textContent}`);
  } catch {
    // Fallback for non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = hexOutput.textContent;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(`📋 Copied ${hexOutput.textContent}`);
  }
});

updateColor();

/* ── 11. FAQ ACCORDION ──────────────────────────────────────── */
const accordion    = $('#js-accordion');
const expandAllBtn = $('#js-expand-all');
let allExpanded    = false;

accordion.addEventListener('click', e => {
  const trigger = e.target.closest('.js-accordion-trigger');
  if (!trigger) return;

  const item   = trigger.closest('.js-accordion-item');
  const body   = $('#' + trigger.getAttribute('aria-controls'));
  const isOpen = item.classList.contains('is-open');

  // Close all others (single-open mode) — comment this block for multi-open
  $$('.js-accordion-item.is-open').forEach(openItem => {
    if (openItem === item) return;
    openItem.classList.remove('is-open');
    const t = openItem.querySelector('.js-accordion-trigger');
    const b = $('#' + t.getAttribute('aria-controls'));
    t.setAttribute('aria-expanded', 'false');
    b.hidden = true;
  });

  item.classList.toggle('is-open', !isOpen);
  trigger.setAttribute('aria-expanded', !isOpen);
  body.hidden = isOpen;
});

expandAllBtn.addEventListener('click', () => {
  allExpanded = !allExpanded;
  expandAllBtn.textContent = allExpanded ? 'Collapse all' : 'Expand all';

  $$('.js-accordion-item').forEach(item => {
    const trigger = item.querySelector('.js-accordion-trigger');
    const body    = $('#' + trigger.getAttribute('aria-controls'));
    item.classList.toggle('is-open', allExpanded);
    trigger.setAttribute('aria-expanded', allExpanded);
    body.hidden = !allExpanded;
  });
});

/* ── 12. SCROLL REVEAL ──────────────────────────────────────── */
// Mark elements for reveal
const revealTargets = [
  ...$$('.stat-card'),
  ...$$('.accordion__item'),
  ...$$('.notes-layout > *'),
  ...$$('.mixer-layout > *'),
];

revealTargets.forEach(el => el.classList.add('js-reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-revealed');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach(el => revealObserver.observe(el));

/* ── 13. SCROLL TO TOP ──────────────────────────────────────── */
$('#js-scroll-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── 14. INIT DONE ──────────────────────────────────────────── */
console.log('%cPulse loaded ✓', 'color:#7c6cfa;font-weight:700;font-size:14px');