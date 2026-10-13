/*
 * Printing Impact Card for Home Assistant
 * https://github.com/CameronSmith93/printing-environmental-impact-card-HA
 *
 * Shows a printer's environmental impact and running cost (trees, CO₂, paper energy, bulb hours,
 * sheets and cost), inspired by PaperCut's Printing Impact widget. Light and dark artwork follow the
 * Home Assistant theme, with a choice of 3D or flat icons.
 *
 * MIT licence. Not affiliated with Brother Industries or PaperCut Software.
 */
(() => {
  const VERSION = '1.0.0';
  const TAG = 'printing-impact-card';

  // Artwork. build.py swaps the null below for the 3D icons and illustrations as data URIs, so
  // dist/printing-impact-card.js is a single self-contained file with nothing else to host.
  const EMBEDDED = /*__EMBEDDED_ASSETS__*/null;

  // File names used when the assets are served from a folder (asset_base).
  const FILES = {
    illustration: 'illustration', trees: 'trees', co2: 'co2', paper_energy: 'paper-energy',
    bulb_hours: 'bulb-hours', sheets_month: 'sheets-this-month', sheets_total: 'sheets-total', cost: 'cost',
  };

  // Flat icons: vector redraws, coloured per theme from the palettes below.
  const FLAT = {
    trees: '<path d="M59 68h10v43H59z" fill="{trunk}"/><path d="M60 83C45 92 26 85 24 71c-2-11 4-22 15-26-2-15 9-27 24-27 13 0 23 9 24 21 12 1 21 11 20 24 9 14-2 30-17 30-10 0-19-4-25-11z" fill="{leaf}" stroke="{leafS}" stroke-width="3.5" stroke-linejoin="round"/><path d="M64 109V61m0 20L49 67m15 9 15-17" fill="none" stroke="{trunk}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    co2: '<path d="M31 94c-14 0-24-10-24-23 0-12 9-22 20-24 1-18 14-31 32-31 15 0 28 11 30 26 16-1 31 11 31 28 0 14-11 24-26 24z" fill="{cloud}" stroke="{cloudS}" stroke-width="4" stroke-linejoin="round"/>',
    paper_energy: '<path d="M77 12 28 72h30l-9 44 51-63H69z" fill="{gold}" stroke="{goldS}" stroke-width="4" stroke-linejoin="round"/>',
    bulb_hours: '<path d="M44 89c0-12-4-16-11-24-7-8-9-15-9-25C24 20 42 7 64 7s40 13 40 33c0 10-2 17-9 25-7 8-11 12-11 24z" fill="{gold}" stroke="{goldS}" stroke-width="4"/><path d="M55 89V67L45 56m28 33V67l10-11M51 65h26" fill="none" stroke="{goldS}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 87h40v19c0 6-6 10-12 10H56c-6 0-12-4-12-10z" fill="{base}"/><path d="M45 96h38m-38 9h38" stroke="{leafS}" stroke-width="4" stroke-linecap="round"/><path d="M54 116h20l-4 5H58z" fill="{leafS}"/>',
    sheets_month: '<path d="M30 10h45l25 25v81H30z" fill="{paper}" stroke="{paperS}" stroke-width="4" stroke-linejoin="round"/><path d="M75 10v25h25" fill="{fold}" stroke="{paperS}" stroke-width="4" stroke-linejoin="round"/><path d="M43 54h42M43 67h42M43 80h42M43 93h28" stroke="{lines}" stroke-width="5" stroke-linecap="round"/>',
    sheets_total: [78, 67, 56, 45].map((y) => `<path d="M17 ${y} 52 ${y - 24}l59 18v10L76 ${y + 30} 17 ${y + 11}z" fill="{paper}" stroke="{paperS}" stroke-width="3.5" stroke-linejoin="round"/><path d="M17 ${y} 76 ${y + 19}l35-25M76 ${y + 19}v11" fill="none" stroke="{paperS}" stroke-width="3" stroke-linejoin="round"/>`).join(''),
    cost: [78, 56, 34].map((y) => `<path d="M22 ${y}v17c0 9 19 16 42 16s42-7 42-16V${y}" fill="{goldSide}" stroke="{goldS}" stroke-width="3.5"/><ellipse cx="64" cy="${y}" rx="42" ry="16" fill="{gold}" stroke="{goldS}" stroke-width="3.5"/>`).join(''),
  };
  const FLAT_COLOURS = {
    dark: { trunk: '#C6A072', leaf: '#A0D666', leafS: '#6EA844', cloud: '#CDDEB8', cloudS: '#A3C086', gold: '#F4CD6F', goldS: '#C89535', goldSide: '#DCA944', base: '#A2B29C', paper: '#F7F5E9', paperS: '#B0C3AC', fold: '#DAE5D0', lines: '#7A947C' },
    light: { trunk: '#8C623C', leaf: '#5C993F', leafS: '#31563B', cloud: '#87AB72', cloudS: '#527849', gold: '#E3AA24', goldS: '#9A6A10', goldSide: '#C68B16', base: '#788278', paper: '#FAF9F1', paperS: '#667D6C', fold: '#DCE6D6', lines: '#748777' },
  };

  const TILES = [
    { key: 'trees', label: 'Trees' },
    { key: 'co2', label: 'CO<sub>2</sub>', plain: 'CO₂' },
    { key: 'paper_energy', label: 'Paper energy' },
    { key: 'bulb_hours', label: 'Bulb hours' },
    { key: 'sheets_month', label: 'Sheets this month', zero: true, unit: 'sheets' },
    { key: 'sheets_total', label: 'Sheets total' },
    { key: 'cost', label: 'Cost', money: true },
  ];

  const DEFAULTS = {
    title: 'Printing impact',
    subtitle: 'Environmental usage',
    flat_icons: false,
    trees: 'sensor.printer_trees_used',
    co2: 'sensor.printer_co2_emissions',
    paper_energy: 'sensor.printer_paper_energy',
    bulb_hours: 'sensor.printer_lightbulb_hours',
    sheets_month: 'sensor.printer_sheets_this_month',
    sheets_total: 'sensor.printer_sheets_used',
    cost: 'sensor.printer_cost_total',
    cost_month: 'sensor.printer_cost_this_month',
    since: 'input_datetime.printer_in_service_since',
    tooltips: true,
    paper_price: 'input_number.printer_paper_price_per_ream',
    toner_price: 'input_number.printer_toner_price',
    toner_yield: 'input_number.printer_toner_yield',
    starter_pages: 'input_number.printer_starter_toner_pages',
  };

  const LABELS = {
    title: 'Title', subtitle: 'Subtitle', flat_icons: 'Flat icons', tooltips: 'Descriptions on hover',
    trees: 'Trees', co2: 'CO₂', paper_energy: 'Paper energy', bulb_hours: 'Bulb hours',
    sheets_month: 'Sheets this month', sheets_total: 'Sheets total', cost: 'Cost (total)',
    cost_month: 'Cost (this month)', since: 'In service since (date)', asset_base: 'Asset folder URL (optional)',
    paper_price: 'Paper price per ream', toner_price: 'Toner cartridge price', toner_yield: 'Toner yield (pages)',
    starter_pages: 'Pages on the free starter toner',
    illustration: 'Illustration image URL (optional)', illustration_dark: 'Dark-mode illustration URL (optional)',
  };

  // Hover descriptions, in the spirit of PaperCut's "About" panel. The factors match PaperCut's
  // standard ones, which the Home Assistant sensors use. Override any of them with `descriptions:`.
  const DESCRIPTIONS = {
    trees: 'The trees that went into making the paper you’ve printed on, at about 8,333 sheets of A4 per tree.',
    co2: 'Greenhouse gases released in producing that paper, as CO₂ equivalent: about 12.7 g per sheet.',
    paper_energy: 'The energy used to produce the paper, about 48 Wh per sheet. It’s the paper’s footprint, not the printer’s own power use.',
    bulb_hours: 'The paper energy shown as hours of a standard 60 W light bulb.',
    sheets_month: 'Sheets of paper used since the 1st of the month. A double-sided page counts as one sheet.',
    sheets_total: 'Sheets of paper used since the printer went into service. A double-sided page counts as one sheet.',
    cost: null, // built from the price helpers at runtime
    since: 'When the printer went into service. Tap to change the date.',
  };

  const STYLE = `
    :host { display: block; }
    ha-card { overflow: hidden; container-type: inline-size; border-radius: var(--ha-card-border-radius, 12px); }
    .wrap {
      --bg: radial-gradient(130% 110% at 18% 22%, #1b2b21 0%, #121d16 55%, #0d1611 100%);
      --tile: linear-gradient(180deg, #1c2c22 0%, #19271f 100%);
      --tile-border: #4a6355; --tile-hover: #22352a;
      --title: #ffffff; --subtitle: #bedaca; --label: #f2f6f1; --value: #ffffff; --unit: #a9c2b2; --muted: #93ab9c;
      --glow: rgba(255, 190, 60, 0.7);
      --icon-shadow: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
      background: var(--bg); color: var(--value);
      font-family: var(--ha-font-family-body, Roboto, system-ui, sans-serif);
      display: grid; gap: var(--gap); padding: var(--pad);
      --gap: clamp(8px, 1.8cqw, 16px); --pad: clamp(12px, 3cqw, 26px);
      --icon: clamp(26px, 4.4cqw, 44px);
      --fs-title: clamp(19px, 4.4cqw, 40px); --fs-sub: clamp(12px, 2.1cqw, 19px);
      --fs-label: clamp(12px, 1.85cqw, 17px); --fs-value: clamp(18px, 3.7cqw, 34px); --fs-small: clamp(11px, 1.6cqw, 14px);
    }
    .wrap.light {
      --bg: radial-gradient(130% 110% at 18% 22%, #fbfbf5 0%, #f6f6ee 55%, #eff1e7 100%);
      --tile: linear-gradient(180deg, #e7eee1 0%, #e3eadc 100%);
      --tile-border: #b9c8b5; --tile-hover: #dde6d6;
      --title: #10261b; --subtitle: #3b4e46; --label: #13281d; --value: #10261b; --unit: #4d6256; --muted: #5a6d61;
      --glow: rgba(255, 186, 40, 0.55);
      --icon-shadow: drop-shadow(0 1px 1.5px rgba(30, 55, 35, 0.35)) drop-shadow(0 0 0.5px rgba(30, 55, 35, 0.4));
    }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-width: 0; }
    .titles { min-width: 0; }
    .title { font-size: var(--fs-title); font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; color: var(--title); }
    .subtitle { font-size: var(--fs-sub); font-weight: 600; color: var(--subtitle); margin-top: 0.25em; }
    .since { font-size: var(--fs-small); color: var(--muted); white-space: nowrap; cursor: pointer; padding-top: 0.35em; }
    .since:hover { text-decoration: underline; }
    /* The right-hand column (--q) is shared by both rows, so Cost lines up under Bulb hours and
       Sheets total ends where Paper energy ends; the two sheet tiles split the rest evenly. */
    .mid { display: grid; grid-template-columns: 1fr calc((100% - 2 * var(--gap)) * 0.62 + var(--gap)); gap: var(--gap); align-items: center; }
    .ill { width: 100%; height: auto; display: block; aspect-ratio: 1; object-fit: contain; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.25)); }
    .light .ill { filter: drop-shadow(0 10px 16px rgba(60,80,60,0.15)); }
    .quad { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
    .row3 { display: grid; grid-template-columns: 1fr 1fr calc((100% - 2 * var(--gap)) * 0.31); gap: var(--gap); }
    .tile {
      background: var(--tile); border: 1px solid var(--tile-border); border-radius: clamp(10px, 1.6cqw, 16px);
      padding: clamp(8px, 1.5cqw, 14px); display: flex; flex-direction: column; min-width: 0; cursor: pointer;
      transition: background 0.15s ease; min-height: calc(var(--icon) + var(--fs-value) * 2.6);
    }
    .tile:hover { background: var(--tile-hover); }
    .tile { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    /* Description tooltip: a popover, so it renders above the dashboard and is never clipped by the card */
    .tip {
      position: fixed; inset: auto; margin: 0; padding: 10px 12px; max-width: 270px; box-sizing: border-box;
      border-radius: 10px; font: 400 12.5px/1.45 var(--ha-font-family-body, Roboto, system-ui, sans-serif);
      background: #0b140f; color: #e8f0ea; border: 1px solid #3f5a4a; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      opacity: 0; transition: opacity 0.12s ease; pointer-events: none; overflow: visible;
    }
    .tip.light { background: #ffffff; color: #1d2f24; border-color: #c4d2c0; box-shadow: 0 10px 28px rgba(40, 60, 45, 0.18); }
    .tip.on { opacity: 1; }
    .tip b { display: block; font-weight: 700; margin-bottom: 3px; color: inherit; }
    .tip b sub { font-size: 0.7em; }
    .tile:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
    .tl { display: flex; align-items: center; gap: clamp(6px, 1.1cqw, 12px); min-width: 0; }
    .ic { width: var(--icon); height: var(--icon); flex: none; position: relative; display: grid; place-items: center; }
    .ic img, .ic svg { width: 100%; height: 100%; display: block; object-fit: contain; position: relative; filter: var(--icon-shadow); }
    .wrap.flat .ic img, .wrap.flat .ic svg { filter: none; }
    .ic.glow::before {
      content: ''; position: absolute; inset: -45%; border-radius: 50%;
      background: radial-gradient(circle, var(--glow) 0%, rgba(255, 180, 50, 0.28) 34%, rgba(255, 170, 40, 0.08) 52%, transparent 68%);
    }
    .lab { font-size: var(--fs-label); font-weight: 700; color: var(--label); line-height: 1.15; min-width: 0; overflow-wrap: anywhere; }
    .lab sub { font-size: 0.7em; vertical-align: -0.25em; }
    .val { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-top: 0.35em; min-width: 0; }
    .num { font-size: var(--fs-value); font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; color: var(--value); white-space: nowrap; }
    .unit { font-size: 0.6em; font-weight: 600; color: var(--unit); margin-left: 0.28em; letter-spacing: 0; }
    .sub { font-size: var(--fs-small); color: var(--muted); margin-top: 0.3em; white-space: nowrap; }
    /* Cost: stacked total + "this month" line when narrow-tiled; split Total | This month when it spans the card */
    .cv { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0; }
    .cap, .cv-month { display: none; }
    .cap { font-size: var(--fs-small); color: var(--muted); margin-top: 0.3em; white-space: nowrap; }

    /* Compact layout for one-column cards and phones */
    @container (max-width: 459px) {
      .wrap { --icon: clamp(26px, 9cqw, 34px); --fs-title: clamp(18px, 6.2cqw, 26px); --fs-sub: clamp(11px, 3.4cqw, 14px);
              --fs-label: clamp(11.5px, 3.5cqw, 14px); --fs-value: clamp(17px, 6.2cqw, 24px); --fs-small: clamp(10.5px, 3.1cqw, 13px);
              --gap: clamp(6px, 2.2cqw, 10px); --pad: clamp(10px, 3.4cqw, 16px); }
      .mid { grid-template-columns: 1fr; }
      .ill-wrap { display: none; }
      .head { align-items: center; }
      .head .ill-head { display: block; }
      .quad, .row3 { grid-template-columns: 1fr 1fr; }
      .row3 .tile.cost { grid-column: 1 / -1; }
      .row3 .tile.cost .val { flex-direction: row; align-items: stretch; padding-top: 0.5em; }
      .row3 .tile.cost .cv { flex: 1; padding: 0.15em 0 0.2em; }
      .row3 .tile.cost .cv-month { display: flex; border-left: 1px solid var(--tile-border); }
      .row3 .tile.cost .cap { display: block; }
      .row3 .tile.cost .sub { display: none; }
      .tile { min-height: 0; }
    }
    .ill-head { display: none; width: clamp(92px, 34cqw, 170px); flex: none; margin: -4px 0 -6px -4px; }
    .head-main { display: flex; align-items: center; gap: clamp(8px, 2.5cqw, 14px); min-width: 0; flex: 1; }
    @container (max-width: 459px) {
      .head { flex-direction: column; align-items: stretch; gap: 0; }
      .head-main .titles { flex: 1; }
      .since { padding-top: 0.5em; align-self: flex-start; }
      .titles .since-compact { display: block; }
      .head > .since { display: none; }
    }
    .since-compact { display: none; }
  `;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  class PrintingImpactCard extends HTMLElement {
    static getStubConfig() {
      return { ...DEFAULTS };
    }

    static getConfigForm() {
      const ent = (name, domain) => ({ name, selector: { entity: domain ? { domain } : {} } });
      return {
        schema: [
          {
            type: 'grid', name: '', schema: [
              { name: 'flat_icons', selector: { boolean: {} } },
              { name: 'tooltips', selector: { boolean: {} } },
            ],
          },
          {
            type: 'grid', name: '', schema: [
              { name: 'title', selector: { text: {} } },
              { name: 'subtitle', selector: { text: {} } },
            ],
          },
          {
            type: 'expandable', name: '', title: 'Entities', flatten: true, schema: [
              ent('trees', 'sensor'), ent('co2', 'sensor'), ent('paper_energy', 'sensor'), ent('bulb_hours', 'sensor'),
              ent('sheets_month', 'sensor'), ent('sheets_total', 'sensor'), ent('cost', 'sensor'), ent('cost_month', 'sensor'),
              ent('since', 'input_datetime'),
            ],
          },
          {
            type: 'expandable', name: '', title: 'Prices (used in the Cost description)', flatten: true, schema: [
              ent('paper_price', 'input_number'), ent('toner_price', 'input_number'),
              ent('toner_yield', 'input_number'), ent('starter_pages', 'input_number'),
            ],
          },
          {
            type: 'expandable', name: '', title: 'Artwork', flatten: true, schema: [
              { name: 'illustration', selector: { text: {} } },
              { name: 'illustration_dark', selector: { text: {} } },
              { name: 'asset_base', selector: { text: {} } },
            ],
          },
        ],
        computeLabel: (s) => LABELS[s.name] ?? s.name,
        computeHelper: (s) => ({
          flat_icons: 'Use the flat icon set instead of the 3D icons.',
          tooltips: 'Hover (or long-press on a phone) to explain each figure.',
          illustration: 'Your own printer picture, e.g. /local/my-printer.png. Square, transparent PNG works best.',
          illustration_dark: 'Optional separate picture for dark mode. Leave blank to use the one above.',
          asset_base: 'Folder with dark/ and light/ sub-folders of replacement artwork. Leave blank to use the built-in set.',
        }[s.name]),
      };
    }

    setConfig(config) {
      this._config = { ...DEFAULTS, ...(config || {}) };
      this._built = false;
      this._render();
    }

    set hass(hass) {
      const dark = !!hass?.themes?.darkMode;
      const first = !this._hass;
      this._hass = hass;
      if (first || dark !== this._dark) {
        this._dark = dark;
        this._built = false;
        this._render();
      } else {
        this._update();
      }
    }

    getCardSize() { return 7; }

    getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }

    _asset(mode, key) {
      const c = this._config;
      if (key === 'illustration') {
        const own = mode === 'dark' ? (c.illustration_dark || c.illustration) : c.illustration;
        if (own) return own;
      }
      const base = (c.asset_base || '').trim();
      if (base) return `${base.replace(/\/?$/, '/')}${mode}/${FILES[key]}.png`;
      if (EMBEDDED) return EMBEDDED[mode][key];
      // Unbuilt source loaded straight from the repo: use the assets folder beside src/.
      try { return new URL(`../assets/${mode}/${FILES[key]}.png`, import.meta.url).href; } catch (e) { return ''; }
    }

    _icon(mode, key) {
      if (this._config.flat_icons) {
        const colours = FLAT_COLOURS[mode];
        const body = FLAT[key].replace(/\{(\w+)\}/g, (_, k) => colours[k]);
        return `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
      }
      return `<img src="${esc(this._asset(mode, key))}" alt="" loading="lazy" decoding="async">`;
    }

    _render() {
      if (!this._config || !this._hass) return;
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      const mode = this._dark ? 'dark' : 'light';
      const c = this._config;
      const tile = (t) => `
        <div class="tile ${t.key === 'cost' ? 'cost' : ''}" data-key="${t.key}" role="button" tabindex="0" aria-label="${esc(t.plain || t.label)}">
          <div class="tl"><span class="ic ${t.key === 'bulb_hours' && !c.flat_icons ? 'glow' : ''}">${this._icon(mode, t.key)}</span><span class="lab">${t.label}</span></div>
          <div class="val">${t.key === 'cost'
            ? '<div class="cv"><span class="num" data-num="cost">–</span><span class="cap">Total</span></div><div class="cv cv-month"><span class="num" data-money="cost_month">–</span><span class="cap">This month</span></div><span class="sub" data-sub="cost"></span>'
            : `<span class="num" data-num="${t.key}">–</span>`}</div>
        </div>`;
      const ill = `<img class="ill" src="${esc(this._asset(mode, 'illustration'))}" alt="Printer, paper and trees">`;
      this.shadowRoot.innerHTML = `
        <style>${STYLE}</style>
        <ha-card>
          <div class="wrap ${mode}${c.flat_icons ? ' flat' : ''}">
            <div class="head">
              <div class="head-main">
                <div class="ill-head">${ill}</div>
                <div class="titles">
                  <div class="title">${esc(c.title)}</div>
                  <div class="subtitle">${esc(c.subtitle)}</div>
                  <div class="since since-compact" data-since role="button" tabindex="0"></div>
                </div>
              </div>
              <div class="since" data-since role="button" tabindex="0"></div>
            </div>
            <div class="mid">
              <div class="ill-wrap">${ill}</div>
              <div class="quad">${TILES.slice(0, 4).map(tile).join('')}</div>
            </div>
            <div class="row3">${TILES.slice(4).map(tile).join('')}</div>
          </div>
        </ha-card>
        <div class="tip ${mode}" popover="manual" role="tooltip"></div>`;
      this._tip = this.shadowRoot.querySelector('.tip');
      this.shadowRoot.querySelectorAll('.tile').forEach((el) => {
        const key = el.dataset.key;
        const open = () => this._moreInfo(c[key]);
        el.addEventListener('click', (ev) => { if (this._swallowClick) { this._swallowClick = false; ev.preventDefault(); return; } open(); });
        el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
        this._bindTip(el, key);
      });
      this.shadowRoot.querySelectorAll('[data-since]').forEach((el) => {
        el.addEventListener('click', (ev) => { if (this._swallowClick) { this._swallowClick = false; return; } this._moreInfo(c.since); });
        this._bindTip(el, 'since');
      });
      this._built = true;
      this._update();
    }

    // ---- Description tooltips -------------------------------------------------------------
    _describe(key) {
      const c = this._config;
      const custom = c.descriptions && c.descriptions[key];
      if (custom) return esc(custom);
      if (key !== 'cost') return esc(DESCRIPTIONS[key] || '');
      const num = (id) => { const s = id && this._hass.states[id]; const n = s ? Number(s.state) : NaN; return Number.isFinite(n) ? n : null; };
      const ream = num(c.paper_price), toner = num(c.toner_price), yld = num(c.toner_yield), free = num(c.starter_pages);
      const lang = this._hass.locale?.language;
      if (ream === null || toner === null || !yld) {
        return 'What your printing has cost in paper and toner, based on the prices you’ve set. The total runs from when the printer went into service, and this month resets on the 1st.';
      }
      const cents = (n) => `${(n * 100).toFixed(2)}c`;
      const money = (n) => this._fmtMoney(n);
      return esc(`Paper at ${money(ream)} a ream (${cents(ream / 500)} a sheet), plus toner at ${money(toner)} a cartridge, which lasts about ${Math.round(yld).toLocaleString(lang)} pages (${cents(toner / yld)} a page).`
        + (free ? ` The first ${Math.round(free).toLocaleString(lang)} pages used the free starter toner.` : '')
        + ' The total runs from when the printer went into service, and this month resets on the 1st.');
    }

    _bindTip(el, key) {
      if (!this._config.tooltips) return;
      const supported = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
      if (!supported) { el.title = (key === 'cost' ? this._describe(key) : DESCRIPTIONS[key] || '').replace(/&[^;]+;/g, ''); return; }
      let timer = null; let start = null;
      const label = key === 'since' ? 'In service since' : (TILES.find((t) => t.key === key)?.label || '');
      const show = () => this._showTip(el, label, this._describe(key));
      el.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType !== 'mouse') return;
        clearTimeout(timer); timer = setTimeout(show, 350);
      });
      el.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') { clearTimeout(timer); this._hideTip(); } });
      el.addEventListener('focus', () => { clearTimeout(timer); timer = setTimeout(show, 350); });
      el.addEventListener('blur', () => { clearTimeout(timer); this._hideTip(); });
      // Touch: long-press shows the description instead of opening the details.
      el.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType === 'mouse') { clearTimeout(timer); this._hideTip(); return; }
        start = { x: ev.clientX, y: ev.clientY };
        clearTimeout(timer); timer = setTimeout(() => { this._swallowClick = true; show(); }, 450);
      });
      el.addEventListener('pointermove', (ev) => {
        if (start && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 10) { clearTimeout(timer); start = null; }
      });
      const end = () => {
        clearTimeout(timer); start = null;
        if (this._swallowClick) setTimeout(() => this._hideTip(), 2500);
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('contextmenu', (ev) => { if (this._swallowClick) ev.preventDefault(); });
    }

    _showTip(el, label, html) {
      const tip = this._tip;
      if (!tip || !html || !el.isConnected) return;
      tip.innerHTML = `<b>${label}</b>${html}`;
      try { if (!tip.matches(':popover-open')) tip.showPopover(); } catch (e) { return; }
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight, pad = 8;
      let left = r.left + r.width / 2 - t.width / 2;
      left = Math.max(pad, Math.min(left, vw - t.width - pad));
      let top = r.top - t.height - 8;
      if (top < pad) top = Math.min(r.bottom + 8, vh - t.height - pad);
      tip.style.left = `${Math.round(left)}px`;
      tip.style.top = `${Math.round(top)}px`;
      requestAnimationFrame(() => tip.classList.add('on'));
      if (!this._onScroll) {
        this._onScroll = () => this._hideTip();
        window.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
      }
    }

    _hideTip() {
      const tip = this._tip;
      if (!tip) return;
      tip.classList.remove('on');
      try { if (tip.matches(':popover-open')) tip.hidePopover(); } catch (e) { /* ignore */ }
      if (this._onScroll) { window.removeEventListener('scroll', this._onScroll, { capture: true }); this._onScroll = null; }
    }

    disconnectedCallback() { this._hideTip(); }

    _moreInfo(entityId) {
      if (!entityId) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
    }

    _parts(entityId, opts = {}) {
      const st = this._hass.states[entityId];
      if (!st) return { num: '–', unit: '' };
      const bad = ['unknown', 'unavailable', ''].includes(st.state);
      if (bad && !opts.zero) return { num: '–', unit: '' };
      const state = bad ? '0' : st.state;
      const unitAttr = st.attributes.unit_of_measurement || opts.unit || '';
      if (typeof this._hass.formatEntityStateToParts === 'function') {
        try {
          const parts = this._hass.formatEntityStateToParts(st, state);
          const num = parts.filter((p) => p.type !== 'unit').map((p) => p.value).join('').trim();
          const unit = parts.filter((p) => p.type === 'unit').map((p) => p.value).join('').trim() || (bad ? unitAttr : '');
          if (num) return { num, unit };
        } catch (e) { /* fall through */ }
      }
      const n = Number(state);
      const num = Number.isFinite(n) ? n.toLocaleString(this._hass.locale?.language) : state;
      return { num, unit: unitAttr };
    }

    _money(entityId) {
      const st = this._hass.states[entityId];
      if (!st) return '–';
      const n = ['unknown', 'unavailable'].includes(st.state) ? 0 : Number(st.state);
      if (!Number.isFinite(n)) return '–';
      return this._fmtMoney(n, st.attributes.unit_of_measurement);
    }

    _fmtMoney(n, unit) {
      const currency = unit || this._hass.config?.currency || 'AUD';
      try {
        return new Intl.NumberFormat(this._hass.locale?.language, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(n);
      } catch (e) {
        return `$${Number(n).toFixed(2)}`;
      }
    }

    _update() {
      if (!this._built || !this._hass || !this.shadowRoot) return;
      const c = this._config;
      for (const t of TILES) {
        const el = this.shadowRoot.querySelector(`[data-num="${t.key}"]`);
        if (!el) continue;
        let html;
        if (t.money) {
          html = esc(this._money(c.cost));
        } else {
          const p = this._parts(c[t.key], { zero: t.zero, unit: t.unit });
          html = `${esc(p.num)}${p.unit ? `<span class="unit">${esc(p.unit)}</span>` : ''}`;
        }
        if (el.innerHTML !== html) el.innerHTML = html;
      }
      const sub = this.shadowRoot.querySelector('[data-sub="cost"]');
      if (sub) {
        const txt = c.cost_month && this._hass.states[c.cost_month] ? `${this._money(c.cost_month)} this month` : '';
        if (sub.textContent !== txt) sub.textContent = txt;
      }
      const month = this.shadowRoot.querySelector('[data-money="cost_month"]');
      if (month) {
        const txt = c.cost_month && this._hass.states[c.cost_month] ? this._money(c.cost_month) : '–';
        if (month.textContent !== txt) month.textContent = txt;
      }
      const since = c.since && this._hass.states[c.since];
      let sinceTxt = '';
      if (since && !['unknown', 'unavailable'].includes(since.state)) {
        const formatted = typeof this._hass.formatEntityState === 'function' ? this._hass.formatEntityState(since) : since.state;
        sinceTxt = `Since ${formatted}`;
      }
      this.shadowRoot.querySelectorAll('[data-since]').forEach((el) => { if (el.textContent !== sinceTxt) el.textContent = sinceTxt; });
    }
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, PrintingImpactCard);
    window.customCards = window.customCards || [];
    window.customCards.push({
      type: TAG,
      name: 'Printing Environmental Impact Card',
      description: 'Trees, CO₂, energy, paper and cost for your printer, with 3D or flat icons.',
      preview: true,
      documentationURL: 'https://github.com/CameronSmith93/printing-environmental-impact-card-HA',
    });
    console.info(`%c PRINTING-IMPACT-CARD %c ${VERSION} `, 'color:#fff;background:#2f5d3a;font-weight:700', 'color:#2f5d3a;background:#e4ebde');
  }
})();
