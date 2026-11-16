/* Ultranova conversation cards: reference for developers.
   Every card the assistant shows in the chat is the same component, .un-res (ultranova.css):

     <div class="un-res">
       .un-res__head   icon tile · title + one-line context · optional badge (right)
       .un-res__body   the content, built from a few blocks:
                         .un-rows    list of records (work orders, PMs…): title + meta on the left, pills on the right
                         .un-vtl     vertical timeline: date · dot (colored by severity) · what happened
                         .un-res__inset   grey box for a summary, a bar (.un-bar) or key/values (.un-res__kv)
                         .un-res__list    short findings with a colored dot (hi / mid / ok)
                         .un-stats   a strip of 2–4 key numbers (on top of a list or a carousel)
                         .un-car     a carousel of tiles for several things of the same kind (PMs); arrows in the header (carNav)
                         .un-grid    a 2-column grid of tiles with a big number + sparkline, to compare at a glance (assets)
                       Pick by content: records to scan → list; a few items to browse → carousel; a few to compare → grid.
       .un-res__acts   primary action (black) + secondary (soft grey); the primary confirms in place
     </div>

   Status and priority use the same pills everywhere:
     .un-status--open  .un-status--prog  .un-status--hold  .un-status--done  .un-status--late  .un-status--due  .un-status--sched   (status)
     .un-prio--high  .un-prio--med   .un-prio--low                                    (priority)
   Color rule: greys by default; red = wrong/overdue, yellow = at risk; success/live = black or the brand purple (never green).

   UltranovaCards.match(text) → which card a message asks for ('wo', 'pm', 'assets', 'timeline') or null
   UltranovaCards.get(key)    → { ask, text, card, next } for the conversation
   Prototype data only. */
(function (global) {
  'use strict';

  var ICON = {
    wo: '<path d="M9 4h6v3H9zM7 5.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-1M9 12h6M9 16h4"/>',
    pm: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    timeline: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    assets: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>'
  };
  function icon(name) { return '<svg class="un-icon" viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + '</svg>'; }
  function head(ic, title, sub, badge, muted, right) {
    return '<div class="un-res__head"><span class="un-wow__icon">' + icon(ic) + '</span><div><b>' + title + '</b><small>' + sub + '</small></div>'
      + (badge ? '<span class="un-badge' + (muted ? ' un-badge--muted' : '') + '">' + badge + '</span>' : '') + (right || '') + '</div>';
  }
  function acts(primary, done, secondary) {
    return '<div class="un-res__acts"><button type="button" class="un-btn un-btn--sm un-btn--primary" data-approve="' + done + '">' + primary + '</button>'
      + '<button type="button" class="un-btn un-btn--sm un-btn--soft un-btn--gray" data-open>' + secondary + '</button></div>';   /* data-open: goes to the CMS, it doesn't ask what to change */
  }
  var STATUS = { ok: 'Steady', risk: 'At risk', watch: 'Watch', open: 'Open', prog: 'In progress', hold: 'On hold', done: 'Done', late: 'Overdue', due: 'Due', sched: 'Scheduled' };
  function pill(s) { return '<span class="un-status un-status--' + s + '">' + STATUS[s] + '</span>'; }
  var FLAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h1.5v18H6zM8 4h11l-2.5 4.2L19 12H8z"/></svg>';   /* priority flag (same as the CMS) */
  function prio(p) { var n = { high: 'High', med: 'Medium', low: 'Low' }[p]; return '<span class="un-prio un-prio--' + p + '" title="' + n + ' priority">' + FLAG + n + '</span>'; }
  /* a list of records: [title, meta, right side html] */
  function rows(items) {
    return '<ul class="un-rows">' + items.map(function (r, i) {
      return '<li style="--i:' + i + '"><div class="un-rows__main"><b>' + r[0] + '</b><small>' + r[1] + '</small></div><div class="un-rows__side">' + r[2] + '</div></li>';
    }).join('') + '</ul>';
  }
  /* a vertical timeline: [date, severity (hi|mid|ok|''), title, detail] */
  function vtl(items) {
    return '<ol class="un-vtl">' + items.map(function (e, i) {
      return '<li style="--i:' + i + '"><time>' + e[0] + '</time><i class="dot ' + e[1] + '"></i><div><b>' + e[2] + '</b><small>' + e[3] + '</small></div></li>';
    }).join('') + '</ol>';
  }


  /* a strip of 2–4 key numbers: [value, label, tone ('' | 'bad' | 'warn')] */
  /* t[3] (optional): a filter key; then the numbers are buttons that filter the list below, and the picked one fills */
  function stats(items) {
    return '<div class="un-stats" style="--i:0">' + items.map(function (t, i) {
      var cls = 'un-stat' + (t[2] ? ' un-stat--' + t[2] : '');
      return t[3] ? '<button type="button" class="' + cls + '" data-filter="' + t[3] + '" aria-pressed="' + (i === 0) + '"><b>' + t[0] + '</b><small>' + t[1] + '</small></button>'
        : '<div class="' + cls + '"><b>' + t[0] + '</b><small>' + t[1] + '</small></div>';
    }).join('') + '</div>';
  }
  /* picking a number filters the focus list in the same card: the others leave, the matches close up, the first match takes the focus */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.un-stat[data-filter]'); if (!b) return;
    var card = b.closest('.un-res'), key = b.getAttribute('data-filter'), fl = card && card.querySelector('.un-fl'), cf = card && card.querySelector('.un-cf');
    [].forEach.call(card.querySelectorAll('.un-stat[data-filter]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    if (cf) {
      var all = JSON.parse(cf.querySelector('.un-cf__data').textContent), pick = key === 'all' ? all : all.filter(function (t) { return t.status === key; }), st = cf.querySelector('.un-cf__stage');
      st.classList.add('leaving');
      setTimeout(function () { cf.setAttribute('data-at', 0); st.innerHTML = cfStage(pick.slice(), 0); st.classList.remove('leaving'); st.classList.add('entering');
        requestAnimationFrame(function () { requestAnimationFrame(function () { st.classList.remove('entering'); }); }); }, 150);
      return;
    }
    if (!fl) return;
    [].forEach.call(fl.querySelectorAll('.un-fl__item'), function (it) { it.classList.toggle('out', key !== 'all' && (' ' + it.getAttribute('data-tags') + ' ').indexOf(' ' + key + ' ') < 0); });
    flGo(fl, 0);
  });
  /* a carousel of tiles (several things of the same kind: PMs, parts…), scrolled with the arrows in the header.
     tile: { icon, status, title, sub, date, every, who, late } */
  function carNav() {
    return '<span class="un-car-nav"><button type="button" class="un-car-btn" data-car="-1" aria-label="Previous" disabled>' + icon('left')
      + '</button><button type="button" class="un-car-btn" data-car="1" aria-label="Next">' + icon('right') + '</button></span>';
  }
  /* opts.auto: the tiles glide on their own in a slow loop (a second, hidden copy closes the loop); hover or focus pauses it */
  function carousel(tiles, opts) {
    var auto = opts && opts.auto, set = tiles.map(tileHTML).join('');
    if (auto) return '<div class="un-car un-car--auto" style="--i:1;--dur:' + (tiles.length * 6) + 's"><div class="un-car__track">' + set
      + '<div class="un-car__copy" aria-hidden="true">' + set + '</div></div></div>';
    return '<div class="un-car" style="--i:1"><div class="un-car__track">' + set + '</div></div>';
  }
  /* calendar strip: a row of days (scrolls sideways, starts at the latest); days with something on them carry a dot
     in its color, and the picked day is a filled pill. Under it, that day's events as an agenda: time range, title,
     detail, colored rule on the left and a View button. events: [ISO date, tone (hi|mid|ok), from, to, title, detail] */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  function isoOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function cal(from, to, today, events, pick) {
    var d = new Date(from + 'T12:00:00'), end = new Date(to + 'T12:00:00'), days = '', k = 0, sel = events[pick][0], tones = {};
    events.forEach(function (e) { (tones[e[0]] = tones[e[0]] || []).push(e[1]); });
    for (; d <= end; d.setDate(d.getDate() + 1), k++) {
      var iso = isoOf(d), t = tones[iso];
      days += '<button type="button" class="un-strip__day' + (t ? ' has' : '') + (iso === today ? ' today' : '') + (iso === sel ? ' sel' : '') + '" data-day="' + iso + '"'
        + (t ? '' : ' tabindex="-1"') + ' aria-label="' + MON[d.getMonth()] + ' ' + d.getDate() + '">'
        + '<span>' + WD[d.getDay()] + '</span><b>' + d.getDate() + '</b>' + (t ? '<i class="' + t[0] + '"></i>' : '<i></i>') + '</button>';
    }
    return '<div class="un-cal" style="--i:0"><div class="un-strip">' + days + '</div><div class="un-agenda" aria-live="polite">' + agendaHTML(events, sel) + '</div>'
      + '<script type="application/json" class="un-cal__data">' + JSON.stringify(events).replace(/</g, '\\u003c') + '</' + 'script></div>';
  }
  function agendaHTML(events, iso) {
    var d = new Date(iso + 'T12:00:00'), list = events.filter(function (e) { return e[0] === iso; });
    return '<p class="un-agenda__day">' + WD[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate() + '</p>' + list.map(function (e) {
      return '<div class="un-agenda__item ' + e[1] + '"><div><p class="un-agenda__time">' + e[2] + ' – ' + e[3] + '</p><b>' + e[4] + '</b><small>' + e[5] + '</small></div>'
        + '<button type="button" class="un-btn un-btn--sm un-btn--soft un-btn--gray">View</button></div>';
    }).join('');
  }
  document.addEventListener('click', function (e) {
    var day = e.target.closest('.un-strip__day.has'); if (!day || day.classList.contains('sel')) return;
    var c = day.closest('.un-cal'), ag = c.querySelector('.un-agenda'), events = JSON.parse(c.querySelector('.un-cal__data').textContent);
    [].forEach.call(c.querySelectorAll('.un-strip__day'), function (x) { x.classList.toggle('sel', x === day); });
    day.scrollIntoView({ block: 'nearest', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    ag.classList.add('leaving');   /* the old day leaves (150ms ease-in), then the new one comes in (200ms ease-out) */
    setTimeout(function () { ag.innerHTML = agendaHTML(events, day.getAttribute('data-day')); ag.classList.remove('leaving'); ag.classList.add('entering'); requestAnimationFrame(function () { requestAnimationFrame(function () { ag.classList.remove('entering'); }); }); }, 150);
  });
  /* numbers in a card that just arrived count up from zero (key numbers, tile values), a beat after the card lands */
  function countIn(card) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    [].forEach.call(card.querySelectorAll('.un-stat b, .un-tile__val'), function (el) {
      var tn = el.firstChild; if (!tn || tn.nodeType !== 3) return;
      var m = tn.nodeValue.match(/^([$€£]?)(\d+(?:\.\d+)?)(.*)$/); if (!m) return;
      var to = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = performance.now() + 250, dur = 700;
      tn.nodeValue = m[1] + (0).toFixed(dec) + m[3];
      (function tick(now) { var k = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
        tn.nodeValue = m[1] + (to * e).toFixed(dec) + m[3]; if (k < 1) requestAnimationFrame(tick); })(performance.now());
    });
  }
  /* the strip opens scrolled to the picked day */
  new MutationObserver(function () {
    [].forEach.call(document.querySelectorAll('.un-strip:not([data-ready])'), function (st) { st.setAttribute('data-ready', ''); var sel = st.querySelector('.sel'); if (sel) st.scrollLeft = sel.offsetLeft - st.clientWidth / 2 + sel.offsetWidth / 2; });
    [].forEach.call(document.querySelectorAll('.un-res:not([data-counted])'), function (c) { c.setAttribute('data-counted', ''); countIn(c); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  /* focus list: each record is a card stacked vertically; the one in focus is bigger and lifted, the others get a little
     smaller and lighter the further they are. Click one, scroll over the list or use ↑ ↓ to move the focus. */
  function focusList(items) {
    return '<div class="un-fl" data-at="0" style="--i:1"><div class="un-fl__stage">' + items.map(function (r, i) {
      return '<article class="un-fl__item" tabindex="0" role="button" data-tags="' + (r[3] || '') + '" aria-current="' + (i === 0) + '" style="--pos:' + i + ';--k:' + i + '">'
        + '<div class="un-rows__main"><b>' + r[0] + '</b><small>' + r[1] + '</small></div><div class="un-rows__side">' + r[2] + '</div></article>';
    }).join('') + '</div><p class="un-fl__hint">' + items.length + ' work orders · scroll or pick one</p></div>';
  }
  function flGo(fl, at) {   /* positions count only the cards still in the list (filtered-out ones fade away in place) */
    var items = [].filter.call(fl.querySelectorAll('.un-fl__item'), function (x) { return !x.classList.contains('out'); }); at = Math.max(0, Math.min(items.length - 1, at));
    fl.setAttribute('data-at', at); fl.style.setProperty('--lift', Math.min(at, 2));
    items.forEach(function (el, i) { el.style.setProperty('--pos', i - at); el.setAttribute('aria-current', String(i === at)); });
    [].forEach.call(fl.querySelectorAll('.un-fl__item.out'), function (el) { el.setAttribute('aria-current', 'false'); });
    return at;
  }
  document.addEventListener('click', function (e) {
    var it = e.target.closest('.un-fl__item'); if (!it) return;
    if (it.classList.contains('out')) return; var fl = it.closest('.un-fl'); flGo(fl, [].indexOf.call(fl.querySelectorAll('.un-fl__item:not(.out)'), it));
  });
  var flLock = 0;
  document.addEventListener('wheel', function (e) {
    var st = e.target.closest && e.target.closest('.un-fl__stage'); if (!st) return;
    var fl = st.parentNode, at = Number(fl.getAttribute('data-at')), n = fl.querySelectorAll('.un-fl__item:not(.out)').length, dir = e.deltaY > 0 ? 1 : -1;
    if ((dir > 0 && at >= n - 1) || (dir < 0 && at <= 0)) return;   /* at the ends the conversation scrolls as usual */
    e.preventDefault(); if (Date.now() < flLock || Math.abs(e.deltaY) < 4) return;
    flLock = Date.now() + 320; flGo(fl, at + dir);
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    var it = e.target.closest && e.target.closest('.un-fl__item'); if (!it || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault(); var fl = it.closest('.un-fl'), n = flGo(fl, Number(fl.getAttribute('data-at')) + (e.key === 'ArrowDown' ? 1 : -1));
    fl.querySelectorAll('.un-fl__item:not(.out)')[n].focus({ preventScroll: true });
  });
  /* focus carousel: one card in the center, bigger; the others step back on both sides. Clicking (or Enter on) a side
     card brings it to the center and the focused one moves aside. No container: a centered title sits above it. */
  /* it loops: there's no first or last card, the next ones always fill both sides */
  function cfPos(i, at, n) { var half = Math.floor(n / 2); return ((i - at + n + half) % n + n) % n - half; }
  function cfStage(tiles, at) {
    var real = tiles.length; if (!real) return '';
    if (real >= 3) while (tiles.length < 7) tiles = tiles.concat(tiles.slice(0, real));   /* a few items: repeat them so both sides stay full (one or two just sit in the middle) */
    var n = tiles.length;
    return tiles.map(function (t, i) {
      return tileHTML(t, i).replace('<article class="un-car__item', '<article tabindex="0" role="button" aria-current="' + (i === at) + '" aria-label="' + t.title + ', ' + t.date + '" style="--pos:' + cfPos(i, at, n) + '" class="un-cf__item un-car__item').replace(' style="--k:' + i + '"', '');
    }).join('');
  }
  function focusCar(tiles, title, sub, start) {
    var at = start || 0;
    return '<section class="un-cf" data-at="' + at + '">' + (title ? '<header class="un-cf__title"><h3>' + title + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>' : '')
      + '<div class="un-cf__stage">' + cfStage(tiles.slice(), at) + '</div>'
      + '<script type="application/json" class="un-cf__data">' + JSON.stringify(tiles).replace(/</g, '\\u003c') + '</' + 'script>'
      + '</section>';
  }
  function cfGo(cf, at) {
    var items = cf.querySelectorAll('.un-cf__item'), n = items.length; at = (at + n) % n;
    cf.setAttribute('data-at', at);
    [].forEach.call(items, function (el, i) {
      var from = Number(el.style.getPropertyValue('--pos')), to = cfPos(i, at, n);
      if (Math.abs(to - from) > 2) { el.style.transition = 'none'; el.style.setProperty('--pos', to); void el.offsetWidth; el.style.transition = ''; }   /* wrapping to the other side: jump, don't fly across */
      else el.style.setProperty('--pos', to);
      el.setAttribute('aria-current', String(i === at));
    });
    [].forEach.call(cf.querySelectorAll('.un-cf__dots i'), function (d, i) { d.classList.toggle('on', i === at); });
  }
  document.addEventListener('click', function (e) {
    var it = e.target.closest('.un-cf__item'); if (!it) return;
    var cf = it.closest('.un-cf'); cfGo(cf, [].indexOf.call(cf.querySelectorAll('.un-cf__item'), it));
  });
  /* scroll (wheel or trackpad, either direction) over the carousel moves it, endlessly */
  var cfLock = 0;
  document.addEventListener('wheel', function (e) {
    var st = e.target.closest && e.target.closest('.un-cf__stage'); if (!st) return;
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(d) < 4) return;
    e.preventDefault(); if (Date.now() < cfLock) return; cfLock = Date.now() + 320;
    var cf = st.closest('.un-cf'); cfGo(cf, Number(cf.getAttribute('data-at')) + (d > 0 ? 1 : -1));
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    var it = e.target.closest && e.target.closest('.un-cf__item'); if (!it) return;
    var cf = it.closest('.un-cf'), all = cf.querySelectorAll('.un-cf__item'), at = Number(cf.getAttribute('data-at')), i = [].indexOf.call(all, it);
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cfGo(cf, i); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = (at + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length; cfGo(cf, n); all[n].focus(); }
  });
  function tileHTML(t, i) {
    return '<article class="un-car__item' + (t.late ? ' late' : '') + '" style="--k:' + i + '">'
        + '<div class="un-car__top"><span class="un-car__ic">' + icon(t.icon || 'gear') + '</span>' + pill(t.status) + '</div>'
        + '<div><b>' + t.title + '</b><small>' + t.sub + '</small></div>'
        + '<div class="un-car__foot"><div><span class="un-car__date">' + t.date + '</span><small>' + t.every + '</small></div>'
        + '<span class="un-ini" title="' + t.who + '">' + t.who.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span></div>'
        + '</article>';
  }
  /* a grid of tiles with a number and a sparkline (several things to compare at a glance: assets, sites…).
     tile: { title, sub, value, unit, status, tone ('' | 'warn' | 'bad'), spark: [numbers] } */
  function spark(v) {
    if (!v || v.length < 2) return '';
    var w = 120, h = 32, mx = Math.max.apply(null, v), mn = Math.min.apply(null, v), r = mx - mn || 1;
    var pts = v.map(function (n, i) { return (i * w / (v.length - 1)).toFixed(1) + ',' + (h - 3 - (n - mn) / r * (h - 6)).toFixed(1); }).join(' ');
    return '<svg class="un-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  }
  /* opts.best: the tile doing best (highest value, nothing wrong with it) is filled in brand blue to stand out */
  function grid(tiles, opts) {
    var best = -1;
    if (opts && opts.best) tiles.forEach(function (t, i) { if (!t.tone && (best < 0 || Number(t.value) > Number(tiles[best].value))) best = i; });
    return '<div class="un-grid' + (tiles.length === 4 ? ' un-grid--4' : '') + '" style="--i:1">' + tiles.map(function (t, i) {
      return '<article class="un-tile' + (t.tone ? ' un-tile--' + t.tone : '') + (i === best ? ' un-tile--best' : '') + '" style="--k:' + i + '">'
        + '<div class="un-tile__top"><div><b>' + t.title + '</b><small>' + t.sub + '</small></div>' + pill(t.status) + '</div>'
        + '<div class="un-tile__val">' + t.value + '<span>' + t.unit + '</span></div>' + spark(t.spark)
        + '</article>';
    }).join('') + '</div>';
  }

  var CARDS = {
    wo: {
      ask: 'Show me my open work orders',
      text: 'Here are your open work orders for this week, the urgent ones first. Two are unassigned.',
      card: '<div class="un-res">' + head('wo', 'Open work orders', 'Building A · this week', '5 of 12', true)
        + '<div class="un-res__body">' + stats([['12', 'Open this week', 'brand', 'all'], ['1', 'Overdue', 'bad', 'late'], ['2', 'Unassigned', 'ink', 'unassigned']]) + focusList([
          ['WO-1051 · Chiller #2 repair', 'Chiller #2 · due Nov 14 · James C.', prio('high') + pill('prog'), ''],
          ['WO-1049 · Conveyor #3 belt alignment', 'Conveyor #3 · due Nov 12 · Dave R.', prio('high') + pill('late'), 'late'],
          ['WO-1047 · Replace air filters', 'HVAC Unit 3 · due Nov 15 · Unassigned', prio('med') + pill('open'), 'unassigned'],
          ['WO-1044 · Press 4 sensor check', 'Press 4 · due Nov 16 · Unassigned', prio('med') + pill('hold'), 'unassigned'],
          ['WO-1040 · Boiler #2 inspection', 'Boiler #2 · done Nov 10 · Ana P.', prio('low') + pill('done'), '']
        ]) + '</div>' + acts('Assign the 2 unassigned', 'Assigned to James C. and Dave R.', 'Open in Work Orders') + '</div>',
      next: ['Show only the overdue ones', 'Who has the most work this week?', 'Create a work order']
    },
    pm: {
      ask: 'Show me the preventive maintenance due',
      text: 'This is your preventive maintenance for the next two weeks. One is already overdue.',
      card: '<div class="un-res">' + head('pm', 'Preventive maintenance', 'Next 14 days · 23 scheduled')
        + '<div class="un-res__body">' + stats([['87%', 'On time this month', 'brand', 'all'], ['1', 'Overdue', 'bad', 'late'], ['2', 'Due this week', 'warn', 'due'], ['2', 'Scheduled', 'ink', 'sched']])
        + focusCar([
          { icon: 'gear', status: 'late', title: 'Monthly lubrication', sub: 'Press 4 · Building A', date: 'Nov 12', every: 'Every month', who: 'Maria L.', late: true },
          { icon: 'gear', status: 'due', title: 'Filter change', sub: 'HVAC Unit 3 · Roof', date: 'Nov 14', every: 'Every 3 months', who: 'James C.' },
          { icon: 'gear', status: 'due', title: 'Belt inspection', sub: 'Conveyor #3 · Line 2', date: 'Nov 15', every: 'Every 2 weeks', who: 'Dave R.' },
          { icon: 'gear', status: 'sched', title: 'Quarterly calibration', sub: 'Scale B · Shipping', date: 'Nov 18', every: 'Every 3 months', who: 'Ana P.' },
          { icon: 'gear', status: 'sched', title: 'Pressure test', sub: 'Boiler #2 · Building A', date: 'Nov 21', every: 'Every 6 months', who: 'James C.' }
        ], '', '', 1) + '</div>' + acts('Reschedule the overdue one', 'Monthly lubrication moved to tomorrow, 8:00 AM', 'Open in Preventive Maintenance') + '</div>',
      next: ['Which assets have no PM?', 'Show last month’s compliance', 'Create a PM']
    },
    assets: {
      ask: 'How are my critical assets doing?',
      text: 'Here are your four critical assets. Chiller #2 needs attention; the rest are steady.',
      card: '<div class="un-res">' + head('assets', 'Critical assets · health', 'Building A · last 30 days', '4 assets', true)
        + '<div class="un-res__body">' + grid([
          { title: 'Chiller #2', sub: 'Building A · HVAC', value: '61', unit: '%', status: 'risk', tone: 'bad', spark: [88, 86, 84, 79, 80, 72, 70, 66, 64, 61] },
          { title: 'Line 3 gearbox', sub: 'Line 3 · Drive', value: '74', unit: '%', status: 'watch', tone: 'warn', spark: [90, 89, 85, 86, 82, 80, 79, 77, 75, 74] },
          { title: 'Boiler #2', sub: 'Building A · Utility', value: '93', unit: '%', status: 'ok', tone: '', spark: [91, 92, 92, 90, 93, 94, 93, 92, 93, 93] },
          { title: 'Air compressor', sub: 'Building B · Utility', value: '89', unit: '%', status: 'ok', tone: '', spark: [85, 86, 88, 87, 88, 90, 89, 88, 89, 89] }
        ], { best: true }) + '</div>' + acts('Open a work order for Chiller #2', 'WO-1052 created for Chiller #2', 'Open in Assets') + '</div>',
      next: ['Why is Chiller #2 dropping?', 'Compare with last quarter', 'Add an asset to watch']
    },
    timeline: {
      ask: 'What happened with Chiller #2 this month?',
      text: 'Here’s Chiller #2 over the last 30 days. The contactor failed twice, and the part is delayed.',
      card: '<div class="un-res">' + head('timeline', 'Chiller #2 · last 30 days', 'Building A · 4 work orders · 2 stops', 'At risk', true)
        + '<div class="un-res__body">' + cal('2026-10-12', '2026-11-16', '2026-11-13', [
          ['2026-10-14', 'ok', '09:00', '11:30', 'Quarterly PM done', 'Ana P. · coils cleaned, pressures normal'],
          ['2026-10-27', 'hi', '13:20', '14:30', 'Stopped: contactor failure', 'Down 1 h 10 min · fixed with the last spare'],
          ['2026-11-08', 'mid', '10:05', '10:20', 'Part ordered', 'PO-3381, compressor contactor · supplier moved delivery to Nov 22'],
          ['2026-11-11', 'hi', '06:40', '09:25', 'Stopped: contactor failure', 'Down 2 h 45 min · WO-1051 opened, James C.'],
          ['2026-11-11', 'mid', '09:40', '10:10', 'WO-1051 opened', 'Assigned to James C. · waiting on the contactor']
        ], 3) + '<div class="un-res__inset" style="--i:4"><b>Same failure twice in 15 days.</b> I’d replace the contactor with the Grainger one (arrives tomorrow) and keep PO-3381 as a spare.</div>'
        + '</div>' + acts('Order from Grainger', 'Order placed with Grainger, arrives Nov 13', 'Open the asset') + '</div>',
      next: ['Compare with Chiller #1', 'Show the full asset history', 'Create a work order']
    }
  };

  function match(text) {
    var t = (text || '').toLowerCase();
    if (/timeline|history|what happened|last 30 days/.test(t)) return 'timeline';
    if (/assets?|health|critical|equipment status/.test(t)) return 'assets';
    if (/\bpms?\b|preventive/.test(t)) return 'pm';
    if (/work orders?|\bwos?\b/.test(t) && !/create|new work order/.test(t)) return 'wo';
    return null;
  }

  function syncCar(track) {
    var box = track.closest('.un-res, .ap-panel'); var nav = box && box.querySelector('.un-car-nav'); if (!nav) return;
    var b = nav.querySelectorAll('.un-car-btn');
    b[0].disabled = track.scrollLeft < 4; b[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.un-car-btn'); if (!btn) return;
    var box = btn.closest('.un-res, .ap-panel'); var track = box && box.querySelector('.un-car__track'); if (!track) return;
    var item = track.querySelector('.un-car__item'), step = item ? item.offsetWidth + 10 : 200;
    track.scrollBy({ left: step * Number(btn.getAttribute('data-car')), behavior: 'smooth' });
  });
  document.addEventListener('scroll', function (e) { if (e.target.classList && e.target.classList.contains('un-car__track')) syncCar(e.target); }, true);

  global.UltranovaCards = { list: ['wo', 'pm', 'assets', 'timeline'], get: function (k) { return CARDS[k]; }, match: match,
    /* the same blocks, for the apps (home.html renderers) */
    blocks: { stats: stats, cal: cal, focusList: focusList, carousel: carousel, focusCar: focusCar, carNav: carNav, grid: grid, pill: pill, spark: spark, icon: icon } };
})(window);
