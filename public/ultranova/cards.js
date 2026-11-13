/* Ultranova conversation cards: reference for developers.
   Every card the assistant shows in the chat is the same component, .un-res (ultranova.css):

     <div class="un-res">
       .un-res__head   icon tile · title + one-line context · optional badge (right)
       .un-res__body   the content, built from a few blocks:
                         .un-rows    list of records (work orders, PMs…): title + meta on the left, pills on the right
                         .un-vtl     vertical timeline: date · dot (colored by severity) · what happened
                         .un-res__inset   grey box for a summary, a bar (.un-bar) or key/values (.un-res__kv)
                         .un-res__list    short findings with a colored dot (hi / mid / ok)
       .un-res__acts   primary action (black) + secondary (soft grey); the primary confirms in place
     </div>

   Status and priority use the same pills everywhere:
     .un-status--open  .un-status--prog  .un-status--hold  .un-status--done  .un-status--late  .un-status--due  .un-status--sched   (status)
     .un-prio--high  .un-prio--med   .un-prio--low                                    (priority)
   Color rule: greys by default; red = wrong/overdue, yellow = at risk; success/live = black or the brand purple (never green).

   UltranovaCards.match(text) → which card a message asks for ('wo', 'pm', 'timeline') or null
   UltranovaCards.get(key)    → { ask, text, card, next } for the conversation
   Prototype data only. */
(function (global) {
  'use strict';

  var ICON = {
    wo: '<path d="M9 4h6v3H9zM7 5.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-1M9 12h6M9 16h4"/>',
    pm: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    timeline: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'
  };
  function icon(name) { return '<svg class="un-icon" viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + '</svg>'; }
  function head(ic, title, sub, badge, muted) {
    return '<div class="un-res__head"><span class="un-wow__icon">' + icon(ic) + '</span><div><b>' + title + '</b><small>' + sub + '</small></div>'
      + (badge ? '<span class="un-badge' + (muted ? ' un-badge--muted' : '') + '">' + badge + '</span>' : '') + '</div>';
  }
  function acts(primary, done, secondary) {
    return '<div class="un-res__acts"><button type="button" class="un-btn un-btn--sm un-btn--primary" data-approve="' + done + '">' + primary + '</button>'
      + '<button type="button" class="un-btn un-btn--sm un-btn--soft un-btn--gray" data-open>' + secondary + '</button></div>';   /* data-open: goes to the CMS, it doesn't ask what to change */
  }
  var STATUS = { open: 'Open', prog: 'In progress', hold: 'On hold', done: 'Done', late: 'Overdue', due: 'Due', sched: 'Scheduled' };
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

  var CARDS = {
    wo: {
      ask: 'Show me my open work orders',
      text: 'Here are your open work orders for this week, the urgent ones first. Two are unassigned.',
      card: '<div class="un-res">' + head('wo', 'Open work orders', 'Building A · this week', '5 of 12', true)
        + '<div class="un-res__body">' + rows([
          ['WO-1051 · Chiller #2 repair', 'Chiller #2 · due Nov 14 · James C.', prio('high') + pill('prog')],
          ['WO-1049 · Conveyor #3 belt alignment', 'Conveyor #3 · due Nov 12 · Dave R.', prio('high') + pill('late')],
          ['WO-1047 · Replace air filters', 'HVAC Unit 3 · due Nov 15 · Unassigned', prio('med') + pill('open')],
          ['WO-1044 · Press 4 sensor check', 'Press 4 · due Nov 16 · Maria L.', prio('med') + pill('hold')],
          ['WO-1040 · Boiler #2 inspection', 'Boiler #2 · done Nov 10 · Ana P.', prio('low') + pill('done')]
        ]) + '</div>' + acts('Assign the 2 unassigned', 'Assigned to James C. and Dave R.', 'Open in Work Orders') + '</div>',
      next: ['Show only the overdue ones', 'Who has the most work this week?', 'Create a work order']
    },
    pm: {
      ask: 'Show me the preventive maintenance due',
      text: 'This is your preventive maintenance for the next two weeks. One is already overdue.',
      card: '<div class="un-res">' + head('pm', 'Preventive maintenance', 'Next 14 days · 23 scheduled', '87% on time', true)
        + '<div class="un-res__body"><div class="un-res__inset" style="--i:0"><b>On time this month</b> · 41 of 47<div class="un-bar"><i style="width:87%;background:var(--un-ok)"></i></div></div>'
        + rows([
          ['Monthly lubrication', 'Press 4 · every month · was due Nov 12', pill('late')],
          ['Filter change', 'HVAC Unit 3 · every 3 months · due Nov 14', pill('due')],
          ['Belt inspection', 'Conveyor #3 · every 2 weeks · due Nov 15', pill('due')],
          ['Quarterly calibration', 'Scale B · every 3 months · Nov 18', pill('sched')]
        ]) + '</div>' + acts('Reschedule the overdue one', 'Monthly lubrication moved to tomorrow, 8:00 AM', 'Open in Preventive Maintenance') + '</div>',
      next: ['Which assets have no PM?', 'Show last month’s compliance', 'Create a PM']
    },
    timeline: {
      ask: 'What happened with Chiller #2 this month?',
      text: 'Here’s Chiller #2 over the last 30 days. The contactor failed twice, and the part is delayed.',
      card: '<div class="un-res">' + head('timeline', 'Chiller #2 · last 30 days', 'Building A · 4 work orders · 2 stops', 'At risk', true)
        + '<div class="un-res__body">' + vtl([
          ['Nov 11', 'hi', 'Stopped: contactor failure', 'Down 2 h 45 min · WO-1051 opened, James C.'],
          ['Nov 8', 'mid', 'Part ordered', 'PO-3381, compressor contactor · supplier moved delivery to Nov 22'],
          ['Oct 27', 'hi', 'Stopped: contactor failure', 'Down 1 h 10 min · fixed with the last spare'],
          ['Oct 14', 'ok', 'Quarterly PM done', 'Ana P. · coils cleaned, pressures normal']
        ]) + '<div class="un-res__inset" style="--i:4"><b>Same failure twice in 15 days.</b> I’d replace the contactor with the Grainger one (arrives tomorrow) and keep PO-3381 as a spare.</div>'
        + '</div>' + acts('Order from Grainger', 'Order placed with Grainger, arrives Nov 13', 'Open the asset') + '</div>',
      next: ['Compare with Chiller #1', 'Show the full asset history', 'Create a work order']
    }
  };

  function match(text) {
    var t = (text || '').toLowerCase();
    if (/timeline|history|what happened|last 30 days/.test(t)) return 'timeline';
    if (/\bpms?\b|preventive/.test(t)) return 'pm';
    if (/work orders?|\bwos?\b/.test(t) && !/create|new work order/.test(t)) return 'wo';
    return null;
  }

  global.UltranovaCards = { list: ['wo', 'pm', 'timeline'], get: function (k) { return CARDS[k]; }, match: match };
})(window);
