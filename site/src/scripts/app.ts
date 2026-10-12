// All client-side behaviour. Every feature is progressive: the pages are
// complete without this script. The Run panel lives in ./run.ts and is only
// fetched when someone asks for it.

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = document.documentElement.dataset.base ?? '/';
const DIALECTS = ['sqlite', 'postgres', 'mysql', 'duckdb'];

function store(key: string, value?: string): string | null {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the feature still works per page.
  }
  return null;
}

/* ---------- toast ---------- */
let toastTimer: number | undefined;
function toast(message: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('on'), 2600);
}

/* ---------- theme: System → Light → Dark ---------- */
const THEMES = ['system', 'light', 'dark'] as const;
type Theme = (typeof THEMES)[number];
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  const label = $('#theme-label');
  if (label) label.textContent = theme[0].toUpperCase() + theme.slice(1);
  $('#theme')?.setAttribute('aria-label', `Theme: ${theme}. Change theme`);
}
function cycleTheme() {
  const current = (store('sr-theme') as Theme | null) ?? 'system';
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  store('sr-theme', next);
  applyTheme(next);
}

/* ---------- dialect tabs ---------- */
export function selectDialect(block: HTMLElement, dialect: string, { focus = false, remember = true } = {}) {
  const tabs = $$<HTMLButtonElement>('[role="tab"]', block);
  const tab = tabs.find((t) => t.dataset.dialect === dialect);
  if (!tab) return;
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    t.tabIndex = on ? 0 : -1;
  }
  for (const p of $$<HTMLElement>('[role="tabpanel"]', block)) {
    const on = p.dataset.panel === dialect;
    if (on && p.hidden && !reduced) {
      p.classList.remove('fade');
      void p.offsetWidth;
      p.classList.add('fade');
    }
    p.hidden = !on;
    if (on) {
      const scope = $('[data-scope]', block);
      if (scope) scope.textContent = p.dataset.scope ?? '';
    }
  }
  if (focus) tab.focus();
  if (remember) store('sr-dialect', dialect);
  block.dispatchEvent(new CustomEvent('dialect', { detail: dialect, bubbles: true }));
}

export function activeDialect(block: HTMLElement): string {
  return $('[role="tab"][aria-selected="true"]', block)?.dataset.dialect ?? block.dataset.first ?? 'sqlite';
}

function initTabs() {
  const remembered = store('sr-dialect');
  for (const block of $$('[data-dialect-block]')) {
    const list = $('[role="tablist"]', block);
    if (!list) continue;
    if (remembered && DIALECTS.includes(remembered) && remembered !== block.dataset.first) {
      selectDialect(block, remembered, { remember: false });
    }
    list.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
      if (tab?.dataset.dialect) selectDialect(block, tab.dataset.dialect);
    });
    list.addEventListener('keydown', (e) => {
      const tabs = $$<HTMLButtonElement>('[role="tab"]', list);
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i === -1) return;
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i + tabs.length - 1) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === -1) return;
      e.preventDefault();
      selectDialect(block, tabs[next].dataset.dialect!, { focus: true });
    });
  }
}

/* ---------- copy ---------- */
function blockSql(block: HTMLElement): string {
  const panel = $$<HTMLElement>('[role="tabpanel"]', block).find((p) => !p.hidden);
  const pre = panel ? $('pre', panel) : $('pre', block);
  return (pre?.textContent ?? '').replace(/\n$/, '');
}

async function copyText(value: string, button: HTMLElement, select?: Element | null) {
  const label = $('span', button) ?? button;
  const original = label.textContent;
  try {
    await navigator.clipboard.writeText(value);
    label.textContent = 'Copied';
  } catch {
    if (select) {
      const range = document.createRange();
      range.selectNodeContents(select);
      const sel = getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    label.textContent = 'Selected';
  }
  setTimeout(() => (label.textContent = original), 1400);
}

/* ---------- home: the four ticks land one by one (≈700ms, once) ---------- */
function heroTicks() {
  const box = $('.hero-console[data-anim]');
  if (!box) return;
  const engines = $$('.eng', box);
  if (reduced || !engines.length) {
    box.removeAttribute('data-anim');
    return;
  }
  engines.forEach((eng, i) => setTimeout(() => eng.classList.add('landed'), 160 + i * 150));
  setTimeout(() => box.removeAttribute('data-anim'), 160 + engines.length * 150 + 220);
}

/* ---------- random recipe ---------- */
function randomRecipe() {
  const slugs: string[] = JSON.parse($('#recipe-slugs')?.textContent ?? '[]');
  if (!slugs.length) return;
  const current = document.documentElement.dataset.slug;
  const pool = slugs.filter((s) => s !== current);
  location.href = `${base}r/${pool[Math.floor(Math.random() * pool.length)]}/`;
}

/* ---------- matrix filter ---------- */
function initMatrix() {
  const input = $<HTMLInputElement>('#mx-q');
  const table = $('#mx');
  if (!input || !table) return;
  const rows = $$<HTMLTableRowElement>('tbody tr[data-text]', table);
  const groups = $$<HTMLElement>('tbody[data-group]', table);
  const count = $('#mx-count');
  const empty = $('#mx-empty');
  const apply = () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const row of rows) {
      const on = words.every((w) => row.dataset.text!.includes(w));
      row.hidden = !on;
      if (on) shown++;
    }
    for (const g of groups) g.hidden = !$$('tr[data-text]', g).some((r) => !r.hidden);
    if (count) count.textContent = words.length ? `${shown} of ${rows.length} recipes` : `${rows.length} recipes`;
    if (empty) empty.hidden = shown > 0;
  };
  input.addEventListener('input', apply);
}

/* ---------- search (Pagefind) ---------- */
interface PagefindResult {
  data: () => Promise<{ url: string; excerpt: string; meta: Record<string, string> }>;
}
interface Pagefind {
  search: (q: string) => Promise<{ results: PagefindResult[] }>;
}
let pagefind: Pagefind | null | undefined;
async function loadPagefind(): Promise<Pagefind | null> {
  if (pagefind !== undefined) return pagefind;
  try {
    const path = `${base}pagefind/pagefind.js`;
    pagefind = (await import(/* @vite-ignore */ path)) as Pagefind;
  } catch {
    pagefind = null;
  }
  return pagefind;
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

let selected = 0;
let searchSeq = 0;
async function runSearch() {
  const input = $<HTMLInputElement>('#q')!;
  const list = $('#results')!;
  const term = input.value.trim();
  const seq = ++searchSeq;
  if (!term) {
    list.innerHTML = '<li class="empty">Type a problem, a keyword or a function, like <code>upsert</code> or <code>ROW_NUMBER</code>.</li>';
    return;
  }
  const pf = await loadPagefind();
  if (!pf) {
    list.innerHTML = '<li class="empty">Search runs on the built site. Run <code>npm run build</code> and preview it.</li>';
    return;
  }
  const { results } = await pf.search(term);
  const data = await Promise.all(results.slice(0, 8).map((r) => r.data()));
  if (seq !== searchSeq) return;
  selected = 0;
  if (!data.length) {
    list.innerHTML = `<li class="empty">Nothing for “${escapeHtml(term)}”. Try a word from a title, like <code>duplicates</code>.</li>`;
    return;
  }
  list.innerHTML = data
    .map(
      (d, i) =>
        `<li><a href="${d.url}" class="${i === 0 ? 'sel' : ''}"><span class="n">${escapeHtml(d.meta.category ?? '')}</span>` +
        `<span class="t">${escapeHtml(d.meta.title ?? '')}</span><span class="c">${d.excerpt}</span></a></li>`,
    )
    .join('');
}

let lastFocus: HTMLElement | null = null;
function openSearch() {
  const bg = $('#pal')!;
  lastFocus = document.activeElement as HTMLElement | null;
  bg.hidden = false;
  const input = $<HTMLInputElement>('#q')!;
  input.value = '';
  void runSearch();
  input.focus();
  void loadPagefind();
}
function closeDialog(id: string) {
  const el = $(id);
  if (!el || el.hidden) return false;
  el.hidden = true;
  lastFocus?.focus();
  return true;
}
function openHelp() {
  lastFocus = document.activeElement as HTMLElement | null;
  $('#help')!.hidden = false;
  $<HTMLButtonElement>('#help button')?.focus();
}

/* ---------- Run (lazy) ---------- */
function openRun() {
  if (!$('#run-btn')) return;
  void import('./run').then((m) => m.openRunner());
}

/* ---------- boot ---------- */
function boot() {
  applyTheme((store('sr-theme') as Theme | null) ?? 'system');
  $('#theme')?.addEventListener('click', cycleTheme);
  $('#open-search')?.addEventListener('click', openSearch);
  $$('[data-random]').forEach((b) => b.addEventListener('click', randomRecipe));
  $('#run-btn')?.addEventListener('click', openRun);

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const copy = target.closest<HTMLElement>('[data-copy]');
    if (copy) {
      const block = copy.closest<HTMLElement>('.console')!;
      void copyText(blockSql(block), copy, $('pre', block));
    }
    if (target.id === 'pal' || target.closest('#results a')) closeDialog('#pal');
    if (target.id === 'help' || target.closest('[data-close-help]')) closeDialog('#help');
  });

  let debounce: number | undefined;
  $('#q')?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = window.setTimeout(runSearch, 120);
  });
  $('#q')?.addEventListener('keydown', (e) => {
    const items = $$<HTMLAnchorElement>('#results a');
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
      e.preventDefault();
      items[selected]?.classList.remove('sel');
      selected = (selected + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
      items[selected].classList.add('sel');
      items[selected].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && items[selected]) {
      location.href = items[selected].href;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (closeDialog('#pal') || closeDialog('#help'))) return;
    // Keep Tab inside an open dialog.
    if (e.key === 'Tab') {
      const dialog = $$('.pal-bg').find((d) => !d.hidden);
      if (dialog) {
        const items = $$<HTMLElement>('input, button, a[href]', dialog);
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
      return;
    }
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if ($$('.pal-bg').some((d) => !d.hidden)) return;
    const link = (rel: string) => $<HTMLAnchorElement>(`a[data-rel="${rel}"]`);
    const block = $('main [data-dialect-block]');
    switch (e.key) {
      case '/':
        e.preventDefault();
        openSearch();
        break;
      case 'r':
        randomRecipe();
        break;
      case 't':
        cycleTheme();
        break;
      case 'e':
        if ($('#run-btn')) {
          e.preventDefault();
          openRun();
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        if (block) selectDialect(block, DIALECTS[Number(e.key) - 1]);
        break;
      case '?':
        openHelp();
        break;
      case 'ArrowLeft':
        if (t.closest('[role="tablist"]')) return;
        if (link('prev')) location.href = link('prev')!.href;
        break;
      case 'ArrowRight':
        if (t.closest('[role="tablist"]')) return;
        if (link('next')) location.href = link('next')!.href;
        break;
    }
  });

  initTabs();
  initMatrix();
  heroTicks();
  if (location.hash === '#run') openRun();
  if ($('#run-btn')) toastHint();
}

/** The first time someone lands on a recipe, mention the shortcuts once. */
function toastHint() {
  if (store('sr-hinted')) return;
  store('sr-hinted', '1');
  setTimeout(() => toast('Keys: 1–4 switch dialect, e runs it here, ? lists the rest.'), 1800);
}

boot();
