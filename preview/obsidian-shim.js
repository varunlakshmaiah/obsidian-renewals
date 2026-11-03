// Minimal stand-in for the Obsidian API, enough to run main.js in a browser.
// Development only: Obsidian never loads this folder, and releases ship only main.js, manifest.json and styles.css.
(function () {
  'use strict';

  // ── DOM helpers Obsidian adds to elements and fragments ──
  function applyOpts(el, o) {
    if (typeof o === 'string') o = { cls: o };
    if (!o) return el;
    if (o.cls) el.className = Array.isArray(o.cls) ? o.cls.join(' ') : o.cls;
    if (o.text != null) el.textContent = o.text;
    if (o.type) el.type = o.type;
    if (o.value != null) el.value = o.value;
    if (o.placeholder) el.placeholder = o.placeholder;
    if (o.attr) Object.entries(o.attr).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }
  const creators = {
    createEl(tag, o, cb) { const el = applyOpts(document.createElement(tag), o); this.appendChild(el); if (cb) cb(el); return el; },
    createDiv(o, cb) { return this.createEl('div', o, cb); },
    createSpan(o, cb) { return this.createEl('span', o, cb); },
  };
  Object.assign(HTMLElement.prototype, creators, {
    empty() { while (this.firstChild) this.removeChild(this.firstChild); },
    addClass(...c) { this.classList.add(...c); },
    removeClass(...c) { this.classList.remove(...c); },
    toggleClass(c, v) { this.classList.toggle(c, v); },
    setText(t) { this.textContent = t; },
    setAttr(k, v) { this.setAttribute(k, v); },
    setCssProps(props) { Object.entries(props).forEach(([k, v]) => this.style.setProperty(k, v)); },
    setCssStyles(styles) { Object.assign(this.style, styles); },
  });
  Object.assign(DocumentFragment.prototype, creators);
  window.createFragment = (cb) => { const f = document.createDocumentFragment(); if (cb) cb(f); return f; };

  // ── Icons: the Lucide glyphs main.js asks for, plus anything added with addIcon ──
  const ICONS = {
    plus: '<path d="M5 12h14M12 5v14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'file-json': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M12 3v18"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    play: '<path d="m6 3 14 9-14 9V3z"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    'trash-2': '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  };
  const CUSTOM = {};
  function addIcon(name, svg) { CUSTOM[name] = svg; }
  function setIcon(el, name) {
    el.innerHTML = CUSTOM[name]
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="16" height="16" class="svg-icon">${CUSTOM[name]}</svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">${ICONS[name] || ''}</svg>`;
  }

  function normalizePath(p) {
    return String(p).replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '').trim();
  }

  // ── Notices ──
  const noticeLog = [];
  class Notice {
    constructor(msg, ms = 4000) {
      let host = document.querySelector('.notice-container');
      if (!host) host = document.body.createDiv('notice-container');
      this.noticeEl = this.messageEl = host.createDiv('notice');
      if (typeof msg === 'string') this.noticeEl.textContent = msg;
      else this.noticeEl.appendChild(msg);
      noticeLog.push(this);
      if (ms) this._t = setTimeout(() => this.hide(), ms);
    }
    hide() { clearTimeout(this._t); this.noticeEl.remove(); }
  }

  // ── Menu ──
  class Menu {
    constructor() { this.items = []; }
    addItem(cb) {
      const it = { title: '', icon: '', click: null };
      const api = {
        setTitle: (t) => { it.title = t; return api; },
        setIcon: (i) => { it.icon = i; return api; },
        onClick: (f) => { it.click = f; return api; },
      };
      cb(api);
      this.items.push(it);
      return this;
    }
    addSeparator() { this.items.push(null); return this; }
    showAtMouseEvent(e) {
      document.querySelectorAll('.menu').forEach((m) => m.remove());
      const m = document.body.createDiv('menu');
      this.items.forEach((it) => {
        if (!it) return m.createDiv('menu-separator');
        const row = m.createDiv('menu-item');
        setIcon(row.createSpan('menu-item-icon'), it.icon);
        row.createSpan({ text: it.title });
        row.onclick = () => { m.remove(); it.click && it.click(); };
      });
      m.style.left = Math.min(e.clientX || 0, innerWidth - 220) + 'px';
      m.style.top = Math.min(e.clientY || 0, innerHeight - m.offsetHeight - 8) + 'px';
      window.__lastMenu = m;
      setTimeout(() => document.addEventListener('click', () => m.remove(), { once: true }), 0);
    }
  }

  // ── Modals ──
  class Modal {
    constructor(app) {
      this.app = app;
      this.containerEl = document.createElement('div');
      this.containerEl.className = 'modal-container';
      this.containerEl.createDiv('modal-bg').onclick = () => this.close();
      this.modalEl = this.containerEl.createDiv('modal');
      const x = this.modalEl.createDiv('modal-close-button');
      x.textContent = '×';
      x.onclick = () => this.close();
      this.titleEl = this.modalEl.createDiv('modal-title');
      this.contentEl = this.modalEl.createDiv('modal-content');
      this._esc = (e) => { if (e.key === 'Escape') this.close(); };
    }
    open() { document.body.appendChild(this.containerEl); document.addEventListener('keydown', this._esc); this.onOpen(); }
    close() { this.containerEl.remove(); document.removeEventListener('keydown', this._esc); this.onClose(); }
    onOpen() {}
    onClose() {}
  }

  class FuzzySuggestModal extends Modal {
    setPlaceholder(p) { this._ph = p; }
    onOpen() {
      const input = this.contentEl.createEl('input', { type: 'text', placeholder: this._ph || '', cls: 'prompt-input' });
      const list = this.contentEl.createDiv('suggestion-container');
      const draw = () => {
        list.empty();
        const q = input.value.toLowerCase();
        this.getItems().filter((i) => this.getItemText(i).toLowerCase().includes(q)).forEach((item) => {
          const row = list.createDiv({ cls: 'suggestion-item', text: this.getItemText(item) });
          row.onclick = () => { this.close(); this.onChooseItem(item); };
        });
        if (!list.childElementCount) list.createDiv({ cls: 'suggestion-empty', text: 'No matching files.' });
      };
      input.oninput = draw;
      draw();
    }
  }

  // ── Settings controls ──
  function component(el) {
    const api = {
      inputEl: el, selectEl: el, buttonEl: el, toggleEl: el,
      setValue: (v) => { if (el.type === 'checkbox') el.checked = !!v; else el.value = v; return api; },
      getValue: () => (el.type === 'checkbox' ? el.checked : el.value),
      setPlaceholder: (p) => { el.placeholder = p; return api; },
      onChange: (f) => { el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => f(el.type === 'checkbox' ? el.checked : el.value)); return api; },
      addOption: (v, t) => { el.createEl('option', { text: t, value: v }); return api; },
      setButtonText: (t) => { el.textContent = t; return api; },
      setCta: () => { el.addClass('mod-cta'); return api; },
      setWarning: () => { el.addClass('mod-warning'); return api; },
      setDisabled: (d) => { el.disabled = d; return api; },
      onClick: (f) => { el.addEventListener('click', f); return api; },
    };
    return api;
  }
  class Setting {
    constructor(parent) {
      this.settingEl = parent.createDiv('setting-item');
      this.infoEl = this.settingEl.createDiv('setting-item-info');
      this.nameEl = this.infoEl.createDiv('setting-item-name');
      this.descEl = this.infoEl.createDiv('setting-item-description');
      this.controlEl = this.settingEl.createDiv('setting-item-control');
    }
    setName(n) { this.nameEl.textContent = n; return this; }
    setDesc(d) { this.descEl.textContent = d; return this; }
    setHeading() { this.settingEl.addClass('setting-item-heading'); return this; }
    setClass(c) { this.settingEl.addClass(c); return this; }
    addText(cb) { cb(component(this.controlEl.createEl('input', { type: 'text' }))); return this; }
    addTextArea(cb) { cb(component(this.controlEl.createEl('textarea'))); return this; }
    addDropdown(cb) { cb(component(this.controlEl.createEl('select', 'dropdown'))); return this; }
    addButton(cb) { cb(component(this.controlEl.createEl('button'))); return this; }
    addToggle(cb) { this.settingEl.addClass('mod-toggle'); cb(component(this.controlEl.createEl('label', 'checkbox-container').createEl('input', { type: 'checkbox' }))); return this; }
  }

  // ── Vault (in memory) ──
  class TFile {
    constructor(path) {
      this.path = path;
      this.name = path.split('/').pop();
      this.extension = this.name.includes('.') ? this.name.split('.').pop() : '';
      this.basename = this.name.replace(/\.[^.]+$/, '');
    }
  }
  const files = new Map();
  const folders = new Set();
  const vault = {
    getFiles: () => [...files.keys()].map((p) => files.get(p).file),
    getAbstractFileByPath: (p) => (files.has(p) ? files.get(p).file : folders.has(p) ? { path: p, children: [] } : null),
    read: async (f) => files.get(f.path).data,
    cachedRead: async (f) => files.get(f.path).data,
    create: async (p, data) => {
      if (files.has(p)) throw new Error('File already exists.');
      const file = new TFile(p);
      files.set(p, { file, data });
      return file;
    },
    modify: async (f, data) => { files.get(f.path).data = data; },
    createFolder: async (p) => { folders.add(p); },
  };

  // ── Workspace, views, plugin ──
  const leaves = [];
  const app = {
    vault,
    workspace: {
      getLeavesOfType: () => leaves,
      getLeaf: () => leaves[0],
      revealLeaf: async () => {},
      onLayoutReady: (cb) => setTimeout(cb, 0),
    },
  };

  class Component {
    load() { this.onload && this.onload(); }
    unload() { this.onunload && this.onunload(); }
  }
  class MarkdownRenderChild extends Component {
    constructor(containerEl) { super(); this.containerEl = containerEl; }
  }

  class ItemView {
    constructor(leaf) {
      this.leaf = leaf;
      this.app = app;
      this.containerEl = leaf.containerEl;
      this.contentEl = leaf.containerEl.createDiv('view-content');
    }
  }

  class PluginSettingTab {
    constructor(appRef, plugin) { this.app = appRef; this.plugin = plugin; this.containerEl = document.createElement('div'); }
  }

  // Demo mode keeps its own store so it never mixes with your own data
  const store = () => (window.__ST_DEMO__ ? 'st-preview-demo' : 'st-preview-data');
  class Plugin {
    constructor() { this.app = app; this.codeBlocks = {}; this.commands = {}; }
    async loadData() {
      if (window.__ST_EMPTY__) return null;
      if (window.__ST_DEMO__) return window.__demoData();
      const cached = localStorage.getItem(store());
      if (cached) return JSON.parse(cached);
      // Your vault's data.json when present, otherwise the fictional demo
      const res = await fetch('../data.json').catch(() => null);
      if (res && res.ok) return res.json();
      window.__ST_DEMO__ = true;
      return window.__demoData();
    }
    async saveData(d) { localStorage.setItem(store(), JSON.stringify(d)); }
    registerView(type, factory) { this._viewFactory = factory; }
    addRibbonIcon() {}
    addSettingTab(tab) { this._settingTab = tab; }
    addCommand(c) { this.commands[c.id] = c; }
    registerMarkdownCodeBlockProcessor(lang, fn) { this.codeBlocks[lang] = fn; }
  }

  async function requestUrl() { throw new Error('offline preview'); }

  window.__obsidian = {
    Plugin, ItemView, Modal, Setting, Notice, PluginSettingTab, Menu, FuzzySuggestModal,
    MarkdownRenderChild, TFile, requestUrl, setIcon, addIcon, normalizePath,
  };
  window.__obsidianApp = app;
  window.__obsidianLeaves = leaves;
  window.__noticeLog = noticeLog;
  window.__vaultFiles = files;
})();
