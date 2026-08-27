/* ---------------------------------------------------------------
   Daily — 4 Pillars
   Everything is stored locally in the browser (localStorage).
--------------------------------------------------------------- */
(function () {
  'use strict';

  var STORE_KEY = 'dailyApp.v1';

  /* ---------------- pillar / task definitions ---------------- */
  var PILLARS = [
    {
      id: 'faith', name: 'Faith', icon: 'cross',
      tasks: [{ id: 'bible', label: 'Read bible' }, { id: 'prayer', label: 'Prayer' }]
    },
    {
      id: 'family', name: 'Family', icon: 'family',
      tasks: [{ id: 'marriage', label: 'Marriage' }, { id: 'relationship', label: 'Relationship' }]
    },
    {
      id: 'fitness', name: 'Fitness', icon: 'dumbbell',
      tasks: [{ id: 'exercise', label: 'Exercise' }, { id: 'nutrition', label: 'Nutrition' }]
    },
    {
      id: 'finance', name: 'Finance', icon: 'chart',
      tasks: [{ id: 'learn', label: 'Learn' }, { id: 'plan', label: 'Plan' }]
    }
  ];

  var TASK_TOTAL = PILLARS.reduce(function (n, p) { return n + p.tasks.length; }, 0); // 8
  var BONUS_TOTAL = 2;                       // gratitude + journal
  var DAY_MAX = TASK_TOTAL + BONUS_TOTAL;    // 10 points a day
  var DAY_TARGET = 8;                        // the blue goal line on the chart

  var ICONS = {
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="#4fd1a5" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v18M6.5 8.5h11"/></svg>',
    family: '<svg viewBox="0 0 24 24" fill="#f47272"><circle cx="8" cy="8.5" r="3"/><circle cx="16" cy="8.5" r="3"/><path d="M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5z"/><path d="M10.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5z"/></svg>',
    dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="#4fd1a5" stroke-width="2.2" stroke-linecap="round"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="#b9ee45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5.5-5.5 3.5 3.5L21 6"/><path d="M15 6h6v6"/></svg>'
  };

  var CHECK_SVG = '<svg viewBox="0 0 24 24"><polyline points="5 12.5 10 17.5 19 7"/></svg>';

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function keyOf(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseKey(k) {
    var p = k.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function startOfWeek(d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; }
  function sameDay(a, b) { return keyOf(a) === keyOf(b); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(d) {
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }
  function fmtShort(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ---------------- state ---------------- */
  var state = load();
  var viewDate = new Date(); viewDate.setHours(0, 0, 0, 0);
  var range = 'daily';
  var query = '';

  function blankState() {
    return {
      profile: { name: 'Kory', sub: 'K' },
      days: {},      // key -> { tasks: {}, gratitude: [], journal: [] }
      goals: [],
      prayers: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blankState();
      var parsed = JSON.parse(raw);
      var base = blankState();
      return {
        profile: Object.assign(base.profile, parsed.profile || {}),
        days: parsed.days || {},
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        prayers: Array.isArray(parsed.prayers) ? parsed.prayers : []
      };
    } catch (e) {
      return blankState();
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { toast('Could not save — storage full or blocked'); }
  }

  function day(key) {
    if (!state.days[key]) state.days[key] = { tasks: {}, gratitude: [], journal: [] };
    var d = state.days[key];
    if (!d.tasks) d.tasks = {};
    if (!Array.isArray(d.gratitude)) d.gratitude = [];
    if (!Array.isArray(d.journal)) d.journal = [];
    return d;
  }

  /* ---------------- scoring ---------------- */
  function pointsFor(key) {
    var d = state.days[key];
    if (!d) return 0;
    var pts = 0;
    PILLARS.forEach(function (p) {
      p.tasks.forEach(function (t) { if (d.tasks && d.tasks[p.id + '.' + t.id]) pts++; });
    });
    if (d.gratitude && d.gratitude.length) pts++;
    if (d.journal && d.journal.length) pts++;
    return pts;
  }

  function totalPoints() {
    return Object.keys(state.days).reduce(function (sum, k) { return sum + pointsFor(k); }, 0);
  }

  function streak() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var cursor = today;
    // A streak stays alive until today ends: if nothing is logged yet today,
    // count back starting from yesterday.
    if (pointsFor(keyOf(today)) === 0) cursor = addDays(today, -1);
    var n = 0;
    while (pointsFor(keyOf(cursor)) > 0) { n++; cursor = addDays(cursor, -1); }
    return n;
  }

  /* ---------------- chart data ---------------- */
  function chartSeries() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var out = [];
    var i, d, k;

    if (range === 'daily') {
      for (i = 6; i >= 0; i--) {
        d = addDays(today, -i);
        k = keyOf(d);
        out.push({
          label: d.toLocaleDateString(undefined, { weekday: 'short' }),
          value: pointsFor(k),
          max: DAY_MAX,
          isNow: i === 0
        });
      }
      return { bars: out, max: DAY_MAX, target: DAY_TARGET };
    }

    if (range === 'weekly') {
      var ws = startOfWeek(today);
      for (i = 5; i >= 0; i--) {
        var start = addDays(ws, -7 * i);
        var sum = 0;
        for (var j = 0; j < 7; j++) sum += pointsFor(keyOf(addDays(start, j)));
        out.push({
          label: (start.getMonth() + 1) + '/' + start.getDate(),
          value: sum,
          max: DAY_MAX * 7,
          isNow: i === 0
        });
      }
      return { bars: out, max: DAY_MAX * 7, target: DAY_TARGET * 7 };
    }

    // monthly — last 6 months
    for (i = 5; i >= 0; i--) {
      var m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      var days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      var msum = 0;
      for (var dd = 1; dd <= days; dd++) msum += pointsFor(keyOf(new Date(m.getFullYear(), m.getMonth(), dd)));
      out.push({
        label: m.toLocaleDateString(undefined, { month: 'short' }),
        value: msum,
        max: DAY_MAX * days,
        isNow: i === 0
      });
    }
    var maxDays = 31;
    return { bars: out, max: DAY_MAX * maxDays, target: DAY_TARGET * 30 };
  }

  function rangePoints() {
    var s = chartSeries();
    if (range === 'daily') return s.bars.reduce(function (a, b) { return a + b.value; }, 0);
    return s.bars[s.bars.length - 1].value;
  }

  /* ---------------- rendering ---------------- */
  function renderHeader() {
    $('userName').textContent = state.profile.name;
    $('userSub').textContent = state.profile.sub;
    $('avatar').textContent = (state.profile.name || '?').trim().charAt(0).toUpperCase();
    $('totalPoints').textContent = totalPoints();
    $('streakCount').textContent = streak();
  }

  function renderChart() {
    var s = chartSeries();
    var box = $('chart');
    box.innerHTML = '';

    // dashed grid + axis labels
    var grid = el('div', 'grid');
    var rows = 5;
    for (var r = rows; r >= 0; r--) {
      var line = el('div', 'grid-line');
      var lab = el('span');
      lab.textContent = Math.round(s.max * (r / rows));
      line.appendChild(lab);
      grid.appendChild(line);
    }
    box.appendChild(grid);

    // blue target line
    var t = el('div', 'target');
    var plotH = 168 - 4 - 24; // matches .chart padding
    t.style.bottom = (24 + (s.target / s.max) * plotH) + 'px';
    box.appendChild(t);

    s.bars.forEach(function (b) {
      var col = el('div', 'bar-col');
      var bar = el('div', 'bar');
      var pct = s.max ? Math.min(1, b.value / s.max) : 0;
      bar.style.height = (pct * 100) + '%';
      if (b.value >= (range === 'daily' ? DAY_MAX : s.target)) bar.classList.add('full');
      if (b.isNow) bar.classList.add('today');
      bar.title = b.label + ': ' + b.value + ' points';
      var lab = el('div', 'bar-label');
      lab.textContent = b.label;
      col.appendChild(bar);
      col.appendChild(lab);
      box.appendChild(col);
    });

    $('rangePoints').textContent = rangePoints();
  }

  function renderDateNav() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var isToday = sameDay(viewDate, today);
    var lbl = $('dateLabel');
    lbl.textContent = isToday ? 'Today · ' + fmtDate(viewDate) : fmtDate(viewDate);
    lbl.classList.toggle('past', !isToday);
    $('nextDay').disabled = isToday;
  }

  function renderPillars() {
    var key = keyOf(viewDate);
    var d = day(key);
    var wrap = $('pillars');
    wrap.innerHTML = '';

    PILLARS.forEach(function (p) {
      var doneCount = p.tasks.filter(function (t) { return !!d.tasks[p.id + '.' + t.id]; }).length;
      var complete = doneCount === p.tasks.length;

      var card = el('section', 'pillar' + (complete ? ' complete' : ''));

      var head = el('div', 'pillar-head');
      var h3 = el('h3'); h3.textContent = p.name;
      var count = el('span', 'count');
      count.innerHTML = '<span class="ticks">&#10003;&#10003;</span>' + doneCount + '/' + p.tasks.length;
      head.appendChild(h3); head.appendChild(count);

      var body = el('div', 'pillar-body');
      var ico = el('div', 'pillar-icon');
      ico.innerHTML = ICONS[p.icon];
      body.appendChild(ico);

      p.tasks.forEach(function (t) {
        var id = p.id + '.' + t.id;
        var done = !!d.tasks[id];
        var btn = el('button', 'task' + (done ? ' done' : ''));
        btn.type = 'button';
        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
        btn.innerHTML = '<span class="box">' + CHECK_SVG + '</span><span class="label">' + escapeHtml(t.label) + '</span>';
        btn.addEventListener('click', function () { toggleTask(id); });
        body.appendChild(btn);
      });

      card.appendChild(head);
      card.appendChild(body);
      wrap.appendChild(card);
    });
  }

  function toggleTask(id) {
    var d = day(keyOf(viewDate));
    if (d.tasks[id]) delete d.tasks[id];
    else d.tasks[id] = true;
    save();
    renderPillars();
    renderChart();
    renderHeader();
  }

  function renderBonus() {
    var d = day(keyOf(viewDate));

    var gc = $('gratitudeCount'), jc = $('journalCount');
    gc.textContent = d.gratitude.length;
    gc.classList.toggle('show', d.gratitude.length > 0);
    jc.textContent = d.journal.length;
    jc.classList.toggle('show', d.journal.length > 0);

    var list = $('bonusList');
    list.innerHTML = '';

    var items = []
      .concat(d.gratitude.map(function (e) { return { kind: 'gratitude', e: e }; }))
      .concat(d.journal.map(function (e) { return { kind: 'journal', e: e }; }))
      .filter(function (it) { return matches(it.e.text); })
      .sort(function (a, b) { return b.e.ts - a.e.ts; });

    items.forEach(function (it) {
      var li = el('li', 'entry');
      var main = el('div', 'entry-main');
      var title = el('div', 'entry-title');
      title.textContent = it.kind === 'gratitude' ? 'Gratitude' : 'Journal';
      var body = el('div', 'entry-body');
      body.textContent = it.e.text;
      var meta = el('div', 'entry-meta');
      meta.innerHTML = '<span class="tag ' + (it.kind === 'gratitude' ? 'family' : 'finance') + '">' + it.kind + '</span><span>' + fmtShort(it.e.ts) + '</span>';
      main.appendChild(title); main.appendChild(body); main.appendChild(meta);

      var actions = el('div', 'entry-actions');
      var del = el('button', 'mini-btn danger');
      del.type = 'button'; del.textContent = 'Delete';
      del.addEventListener('click', function () {
        var arr = it.kind === 'gratitude' ? d.gratitude : d.journal;
        var i = arr.findIndex(function (x) { return x.id === it.e.id; });
        if (i > -1) arr.splice(i, 1);
        save(); renderBonus(); renderChart(); renderHeader();
      });
      actions.appendChild(del);

      li.appendChild(main); li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function matches(text) {
    if (!query) return true;
    return String(text || '').toLowerCase().indexOf(query) > -1;
  }

  /* ---------------- goals ---------------- */
  function renderGoals() {
    var list = $('goalList');
    list.innerHTML = '';

    var visible = state.goals.filter(function (g) { return matches(g.text) || matches(g.pillar); });
    var doneCount = state.goals.filter(function (g) { return g.done; }).length;
    $('goalMeta').textContent = doneCount + '/' + state.goals.length + ' complete';

    if (!visible.length) {
      var e = el('li'); e.innerHTML = '<div class="empty">' + (state.goals.length ? 'No goals match your search.' : 'No goals yet — type one above to get started.') + '</div>';
      list.appendChild(e);
      return;
    }

    visible.forEach(function (g) {
      var li = el('li', 'entry' + (g.done ? ' done' : ''));

      var chk = el('button', 'entry-check');
      chk.type = 'button';
      chk.setAttribute('aria-label', 'Toggle goal complete');
      chk.setAttribute('aria-pressed', g.done ? 'true' : 'false');
      chk.innerHTML = CHECK_SVG;
      chk.addEventListener('click', function () {
        g.done = !g.done;
        g.completedAt = g.done ? Date.now() : null;
        save(); renderGoals();
      });

      var main = el('div', 'entry-main');
      var title = el('div', 'entry-title');
      title.textContent = g.text;
      var meta = el('div', 'entry-meta');
      meta.innerHTML = '<span class="tag ' + escapeHtml(g.pillar) + '">' + escapeHtml(g.pillar) + '</span><span>Added ' + fmtShort(g.createdAt) + '</span>' +
        (g.done && g.completedAt ? '<span class="tag answered">done ' + fmtShort(g.completedAt) + '</span>' : '');
      main.appendChild(title); main.appendChild(meta);

      var actions = el('div', 'entry-actions');
      var edit = el('button', 'mini-btn'); edit.type = 'button'; edit.textContent = 'Edit';
      edit.addEventListener('click', function () {
        openModal('Edit goal', g.text, function (val) { g.text = val; save(); renderGoals(); });
      });
      var del = el('button', 'mini-btn danger'); del.type = 'button'; del.textContent = 'Delete';
      del.addEventListener('click', function () {
        state.goals = state.goals.filter(function (x) { return x.id !== g.id; });
        save(); renderGoals(); toast('Goal deleted');
      });
      actions.appendChild(edit); actions.appendChild(del);

      li.appendChild(chk); li.appendChild(main); li.appendChild(actions);
      list.appendChild(li);
    });
  }

  /* ---------------- prayers ---------------- */
  function renderPrayers() {
    var list = $('prayerList');
    list.innerHTML = '';

    var visible = state.prayers.filter(function (p) { return matches(p.title) || matches(p.text); });
    var answered = state.prayers.filter(function (p) { return p.answered; }).length;
    $('prayerMeta').textContent = answered + ' answered · ' + state.prayers.length + ' total';

    if (!visible.length) {
      var e = el('li');
      e.innerHTML = '<div class="empty">' + (state.prayers.length ? 'No prayers match your search.' : 'No prayers yet — write one above.') + '</div>';
      list.appendChild(e);
      return;
    }

    visible.slice().sort(function (a, b) { return b.ts - a.ts; }).forEach(function (p) {
      var li = el('li', 'entry' + (p.answered ? ' done' : ''));

      var chk = el('button', 'entry-check');
      chk.type = 'button';
      chk.setAttribute('aria-label', 'Mark prayer answered');
      chk.setAttribute('aria-pressed', p.answered ? 'true' : 'false');
      chk.innerHTML = CHECK_SVG;
      chk.addEventListener('click', function () {
        p.answered = !p.answered;
        p.answeredAt = p.answered ? Date.now() : null;
        save(); renderPrayers();
        if (p.answered) toast('Marked answered \u{1F64F}');
      });

      var main = el('div', 'entry-main');
      if (p.title) {
        var title = el('div', 'entry-title');
        title.textContent = p.title;
        main.appendChild(title);
      }
      var body = el('div', 'entry-body');
      body.textContent = p.text;
      main.appendChild(body);

      var meta = el('div', 'entry-meta');
      meta.innerHTML = '<span>' + fmtShort(p.ts) + '</span>' +
        (p.answered && p.answeredAt ? '<span class="tag answered">answered ' + fmtShort(p.answeredAt) + '</span>' : '');
      main.appendChild(meta);

      var actions = el('div', 'entry-actions');
      var edit = el('button', 'mini-btn'); edit.type = 'button'; edit.textContent = 'Edit';
      edit.addEventListener('click', function () {
        openModal('Edit prayer', p.text, function (val) { p.text = val; save(); renderPrayers(); });
      });
      var del = el('button', 'mini-btn danger'); del.type = 'button'; del.textContent = 'Delete';
      del.addEventListener('click', function () {
        state.prayers = state.prayers.filter(function (x) { return x.id !== p.id; });
        save(); renderPrayers(); toast('Prayer deleted');
      });
      actions.appendChild(edit); actions.appendChild(del);

      li.appendChild(chk); li.appendChild(main); li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function renderAll() {
    renderHeader();
    renderChart();
    renderDateNav();
    renderPillars();
    renderBonus();
    renderGoals();
    renderPrayers();
  }

  /* ---------------- modal + toast ---------------- */
  var modalSaveHandler = null;
  var modalExtraHandler = null;
  var modalAllowEmpty = false;

  function openModal(title, value, onSave, opts) {
    opts = opts || {};
    $('modalTitle').textContent = title;
    var input = $('modalInput');
    input.value = value || '';
    input.readOnly = !!opts.readonly;
    input.placeholder = opts.placeholder || '';
    $('modalSave').textContent = opts.saveLabel || 'Save';
    $('modalCancel').textContent = opts.cancelLabel || 'Cancel';

    var extra = $('modalExtra');
    if (opts.extraLabel) {
      extra.textContent = opts.extraLabel;
      extra.hidden = false;
      modalExtraHandler = opts.onExtra || null;
    } else {
      extra.hidden = true;
      modalExtraHandler = null;
    }

    modalAllowEmpty = !!opts.allowEmpty;
    modalSaveHandler = onSave;
    $('modal').hidden = false;
    setTimeout(function () { input.focus(); if (opts.readonly) input.select(); }, 30);
  }

  function closeModal() {
    $('modal').hidden = true;
    modalSaveHandler = null;
    modalExtraHandler = null;
    modalAllowEmpty = false;
    $('modalInput').readOnly = false;
  }

  /* Copies text without relying on the clipboard API, which some embedded
     viewers block. Falls back to selecting the text so it can be copied by hand. */
  function copyText(text) {
    var input = $('modalInput');
    input.focus();
    input.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('Copied to clipboard'); },
        function () { toast('Press Ctrl/Cmd+C to copy'); }
      );
      return;
    }
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    toast(ok ? 'Copied to clipboard' : 'Press Ctrl/Cmd+C to copy');
  }

  /* Downloads work when the app is served as a normal page, but some embedded
     viewers block them — so copy/paste is always offered alongside. */
  function tryDownload(filename, text) {
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) { return false; }
  }

  function applyImport(parsed) {
    state = {
      profile: Object.assign(blankState().profile, parsed.profile || {}),
      days: parsed.days || {},
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      prayers: Array.isArray(parsed.prayers) ? parsed.prayers : []
    };
    save();
    renderAll();
    toast('Data imported');
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2000);
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    $('rangeSelect').addEventListener('change', function (e) {
      range = e.target.value;
      renderChart();
    });

    $('prevDay').addEventListener('click', function () {
      viewDate = addDays(viewDate, -1);
      renderDateNav(); renderPillars(); renderBonus();
    });
    $('nextDay').addEventListener('click', function () {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (sameDay(viewDate, today)) return;
      viewDate = addDays(viewDate, 1);
      renderDateNav(); renderPillars(); renderBonus();
    });
    $('dateLabel').addEventListener('click', function () {
      viewDate = new Date(); viewDate.setHours(0, 0, 0, 0);
      renderDateNav(); renderPillars(); renderBonus();
    });

    $('gratitudeBtn').addEventListener('click', function () {
      openModal('Add Gratitude', '', function (val) {
        day(keyOf(viewDate)).gratitude.push({ id: uid(), text: val, ts: Date.now() });
        save(); renderBonus(); renderChart(); renderHeader();
        toast('Gratitude added +1');
      });
    });

    $('journalBtn').addEventListener('click', function () {
      openModal('Add Journal', '', function (val) {
        day(keyOf(viewDate)).journal.push({ id: uid(), text: val, ts: Date.now() });
        save(); renderBonus(); renderChart(); renderHeader();
        toast('Journal added +1');
      });
    });

    $('modalCancel').addEventListener('click', closeModal);
    $('modalSave').addEventListener('click', function () {
      var val = $('modalInput').value.trim();
      if (!val && !modalAllowEmpty) { toast('Write something first'); return; }
      // a handler returning false keeps the modal open so nothing typed is lost
      if (modalSaveHandler && modalSaveHandler(val) === false) return;
      closeModal();
    });

    $('modalExtra').addEventListener('click', function () {
      if (modalExtraHandler) modalExtraHandler($('modalInput').value);
    });
    $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('modal').hidden) closeModal();
    });

    $('goalForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var text = $('goalInput').value.trim();
      if (!text) { toast('Type a goal first'); return; }
      state.goals.unshift({
        id: uid(), text: text, pillar: $('goalPillar').value,
        done: false, createdAt: Date.now(), completedAt: null
      });
      $('goalInput').value = '';
      save(); renderGoals(); toast('Goal added');
    });

    $('prayerForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var text = $('prayerInput').value.trim();
      var title = $('prayerTitle').value.trim();
      if (!text && !title) { toast('Write a prayer first'); return; }
      state.prayers.unshift({
        id: uid(), title: title, text: text || title,
        answered: false, ts: Date.now(), answeredAt: null
      });
      $('prayerInput').value = '';
      $('prayerTitle').value = '';
      save(); renderPrayers(); toast('Prayer saved \u{1F64F}');
    });

    $('searchInput').addEventListener('input', function (e) {
      query = e.target.value.trim().toLowerCase();
      renderGoals(); renderPrayers(); renderBonus();
    });

    $('menuBtn').addEventListener('click', function () {
      var name = prompt('Your name', state.profile.name);
      if (name === null) return;
      state.profile.name = name.trim() || 'Friend';
      state.profile.sub = state.profile.name.trim().charAt(0).toUpperCase();
      save(); renderHeader();
    });

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var target = tab.dataset.scroll;
        if (target === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        var node = $(target) || document.querySelector('.' + target);
        if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    $('exportBtn').addEventListener('click', function () {
      var json = JSON.stringify(state, null, 2);
      openModal('Export data', json, function () { copyText(json); }, {
        readonly: true,
        allowEmpty: true,
        saveLabel: 'Copy',
        cancelLabel: 'Close',
        extraLabel: 'Save file',
        onExtra: function () {
          tryDownload('daily-app-backup-' + keyOf(new Date()) + '.json', json);
          toast('If nothing downloaded, use Copy instead');
        }
      });
    });

    $('importBtn').addEventListener('click', function () {
      openModal('Import data', '', function (val) {
        try { applyImport(JSON.parse(val)); }
        catch (err) { toast('That is not valid backup data'); return false; }
      }, {
        placeholder: 'Paste your exported backup here, or choose a file\u2026',
        saveLabel: 'Import',
        extraLabel: 'Choose file',
        onExtra: function () { $('importFile').click(); }
      });
    });
    $('importFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          applyImport(JSON.parse(reader.result));
          closeModal();
        } catch (err) { toast('That file could not be read'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('resetBtn').addEventListener('click', function () {
      if (!confirm('Erase all check-ins, goals and prayers on this device? This cannot be undone.')) return;
      state = blankState();
      save(); renderAll(); toast('All data cleared');
    });

    // roll the view over to the new day if the app is left open overnight
    setInterval(function () {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (!sameDay(viewDate, today) && viewDate < today) {
        viewDate = today;
        renderAll();
      }
    }, 60000);
  }

  /* ---------------- boot ---------------- */
  wire();
  renderAll();

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      // check for a newer version on every launch
      reg.update().catch(function () {});
    }).catch(function () { /* offline support is optional */ });

    // when a new version takes over, reload once so it is actually shown
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }
})();
