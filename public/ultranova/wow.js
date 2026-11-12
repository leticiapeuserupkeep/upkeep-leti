/* Ultranova "wow" starters: four things Ultranova does that Nova can't.
   Nova waits to be asked; Ultranova remembers, investigates across your data, and keeps watch (inspections, parts),
   then prepares the next step and asks you to approve (Product Brief: "it does the noticing and the prep work, the customer makes the call").

   Shared by the welcome (the "Want me to…" list) and home (the cards on the empty chat + the conversation itself).
   Each starter has:
     option   the question on the welcome ("Want me to… brief you every morning…?")
     title    the same request in the user's voice: their first message, and the card on home
     intro    how the assistant picks the task up
     setup    the few questions it asks to set it up, in the chat: { id, q, replies, ph, connect? }.
              Connections depend on the task: calendar only for meetings, Slack/Teams only if they want alerts there;
              watching work orders and inspections needs nothing but the UpKeep data.
     steps    what it shows while working; text(answers) its answer; card(answers) the result to approve; next the follow-ups.
   Styles: ultranova.css (.un-wow, .un-trace, .un-res). Prototype data only. */
(function (global) {
  'use strict';

  var ICON = {
    brief: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    cause: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M7 11h1.5l1-2.5 2 5 1-2.5H14"/>',
    parts: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    watch: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    go: '<path d="M7 17L17 7M9 7h8v8"/>'
  };
  function icon(name, cls) { return '<svg class="un-icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + '</svg>'; }
  function head(ic, title, sub, badge) {
    return '<div class="un-res__head"><span class="un-wow__icon">' + icon(ic) + '</span><div><b>' + title + '</b><small>' + sub + '</small></div>' + (badge ? '<span class="un-badge">' + badge + '</span>' : '') + '</div>';
  }
  function acts(primary, done, secondary) {
    return '<div class="un-res__acts"><button type="button" class="un-btn un-btn--sm un-btn--primary" data-approve="' + done + '">' + primary + '</button>'
      + '<button type="button" class="un-btn un-btn--sm un-btn--soft un-btn--gray">' + secondary + '</button></div>';
  }
  function list(items) {
    return '<ul class="un-res__list">' + items.map(function (it, i) { return '<li style="--i:' + i + '"><i class="dot ' + (it[0] || '') + '"></i><span>' + it[1] + '</span></li>'; }).join('') + '</ul>';
  }

  var B = '<b style="display:inline;font:inherit;color:inherit">';   /* bold inside an answer (a bare <b> in a message is the assistant's name) */

  var WOW = [
    {
      key: 'brief', icon: 'brief',
      option: 'Brief me every morning on work orders, approvals, and meetings',
      title: 'Brief me every morning on work orders, approvals, and meetings',
      intro: 'I’ll help you start each day with your work orders, pending approvals, and relevant meetings in one place.',
      setup: [
        { id: 'time', q: 'What time would you like your briefing?', replies: ['7:00 AM', '8:00 AM', '9:00 AM'], ph: 'Choose a time or type your own…' },
        { id: 'cal', q: 'To include your meetings, connect your calendar.', replies: ['Connect calendar', 'Continue without it'], ph: 'Connect your calendar or continue without it…', connect: 'Calendar connected' }
      ],
      steps: ['Reading today’s 6 work orders', 'Checking 3 approvals waiting on you', 'Matching your calendar to open work', 'Scheduling your weekday briefing'],
      text: function (a) { return 'Done. Starting tomorrow you’ll get it every weekday at ' + B + (a.time || '9:00 AM') + '</b>. Here’s what today’s would have looked like:'; },
      card: function (a) {
        var cal = a.cal !== 'Continue without it';
        return '<div class="un-res">' + head('brief', 'Your ' + (a.time || '9:00 AM') + ' briefing', 'Every weekday · here and as a push notification', 'Scheduled')
          + '<div class="un-res__body">' + list([
            ['hi', '<b>6 work orders today</b> · 2 high priority. Boiler #2 in Building A goes first.'],
            ['mid', '<b>3 approvals waiting</b> · PO-3381 ($4,820) is holding up the chiller repair.'],
            cal ? ['', '<b>11:00 call with Apex HVAC</b> · I pulled their 4 open work orders for you.'] : ['', '<b>Meetings</b> · connect your calendar anytime and I’ll add them.'],
            ['ok', '<b>Everything else is on track</b> · I’ll keep it short and skip what you don’t care about.']
          ]) + '</div>' + acts('Keep it', 'Briefing scheduled', 'Change the time') + '</div>';
      },
      next: ['Add overdue PMs to it', 'Send it to my supervisors too', 'Send it to Slack too']
    },
    {
      key: 'cause', icon: 'cause',
      option: 'Watch for equipment failures and prepare the next steps',
      title: 'Watch for equipment failures and prepare the next steps',
      intro: 'I’ll keep an eye on your assets, spot failures that keep coming back, and have the next step ready: the history, the parts and a draft work order.',
      setup: [
        { id: 'scope', q: 'Which assets should I start with?', replies: ['All critical assets', 'Production lines', 'Building A'], ph: 'Pick a group or name an asset…' }
      ],
      steps: ['Reading 14 months of breakdowns across 212 assets', 'Finding assets that fail on a pattern', 'Comparing the Line 3 gearbox failures', 'Checking vibration and load readings', 'Checking seal kit stock', 'Drafting the work order'],
      text: function () { return 'I’m watching them now, and one is worth fixing right away: the ' + B + 'Line 3 gearbox</b>. Its last 3 failures were the same seal kit, about 31 days apart, so the next one is likely around ' + B + 'Nov 13</b>. I drafted the fix before then:'; },
      card: function () {
        var marks = [['8%', 'Aug 12'], ['36%', 'Sep 12'], ['64%', 'Oct 13']];
        return '<div class="un-res">' + head('cause', 'Line 3 gearbox · root cause', 'Based on 14 months of history', '')
          + '<div class="un-res__body">'
          + '<div class="un-tl" style="--i:0" aria-label="Failures on Aug 12, Sep 12 and Oct 13; next expected around Nov 13">'
          + marks.map(function (m, i) { return '<span class="un-tl__m" style="left:' + m[0] + ';--k:' + i + '"><i></i><em>' + m[1] + '</em></span>'; }).join('')
          + '<span class="un-tl__m next" style="left:92%;--k:3"><i></i><em>Nov 13?</em></span></div>'
          + list([
            ['hi', '<b>Same part every time</b> · seal kit SK-220 failed in all 3 breakdowns.'],
            ['mid', '<b>Running 18% over rated load</b> since the July line speed change.'],
            ['ok', '<b>1 seal kit in stock</b> · I reserved it for this job.']
          ])
          + '<dl class="un-res__inset un-res__kv" style="--i:3"><dt>Draft</dt><dd><b>Replace seal kit on Line 3 gearbox</b></dd><dt>Assign to</dt><dd>Dave R. (fixed it the last 2 times)</dd><dt>Due</dt><dd>Nov 12, before the next likely failure</dd><dt>Attached</dt><dd>Gearbox seal replacement procedure</dd></dl>'
          + '</div>' + acts('Approve and assign Dave', 'Work order created and assigned to Dave', 'Edit the draft') + '</div>';
      },
      next: ['Check the other gearboxes too', 'Order 2 more seal kits', 'Add a monthly PM for this']
    },
    {
      key: 'parts', icon: 'parts',
      option: 'Alert me when parts delays put planned work at risk',
      title: 'Alert me when parts delays put planned work at risk',
      intro: 'I’ll match every open purchase order to the work it’s for, and tell you as soon as a delay puts that work at risk, with a way around it.',
      setup: [
        { id: 'where', q: 'Where should I alert you?', replies: ['Here in Ultranova', 'Slack', 'Microsoft Teams'], ph: 'Choose where, or type your own…', connect: function (v) { return v === 'Here in Ultranova' ? '' : v + ' connected'; } }
      ],
      steps: ['Checking 38 open purchase orders', 'Matching parts to scheduled work orders', 'Comparing new delivery dates with due dates', 'Looking for the same part at other suppliers', 'Drafting a fix'],
      text: function (a) { return 'I’m watching all 38 open orders' + (a.where && a.where !== 'Here in Ultranova' ? ' and I’ll alert you in ' + a.where : '') + '. One already needs you: a delayed part puts the Chiller #2 repair at risk, and I found a faster way to get it.'; },
      card: function () {
        return '<div class="un-res">' + head('parts', 'Watching parts deliveries', '38 open purchase orders · I’ll reach out when a delay hits planned work', 'Live')
          + '<div class="un-res__body">'
          + '<div class="un-res__inset" style="--i:0"><b>PO-3381 · Compressor contactor</b><br>Supplier moved delivery from Nov 13 to <b>Nov 22</b><div class="un-bar"><i style="width:82%;background:var(--un-bad)"></i></div></div>'
          + list([
            ['hi', '<b>Blocks WO-1051, Chiller #2 repair</b> · due Nov 14, Building A.'],
            ['mid', '<b>No contactor in stock</b> · the last one went to Chiller #1 in October.'],
            ['ok', '<b>Grainger has 2 in stock</b> · next-day delivery, $186 (vs $142 on the PO).']
          ])
          + '<dl class="un-res__inset un-res__kv" style="--i:4"><dt>Draft</dt><dd><b>Order 1 contactor from Grainger</b></dd><dt>Arrives</dt><dd>Nov 13, in time for the repair</dd><dt>PO-3381</dt><dd>Keep it as a spare, or cancel</dd></dl>'
          + '</div><p class="un-res__note">I never place an order without your OK.</p>' + acts('Order from Grainger', 'Order placed with Grainger, arrives Nov 13', 'Move the work order') + '</div>';
      },
      next: ['Cancel PO-3381', 'Tell the chiller tech', 'Watch only critical assets']
    },
    {
      key: 'watch', icon: 'watch',
      option: 'Track overdue inspections and draft follow-ups',
      title: 'Track overdue inspections and draft follow-ups',
      intro: 'I’ll watch your inspections, tell you when one slips, and have the follow-up drafted for you to approve.',
      setup: [
        { id: 'sites', q: 'Which sites should I watch?', replies: ['All 4 sites', 'Northland Plant', 'Only critical inspections'], ph: 'Choose a site or type your own…' }
      ],
      steps: ['Scanning inspections across 4 sites', 'Finding what’s overdue or at risk', 'Reading the open steps', 'Drafting a status update'],
      text: function () { return 'I’m on it, and I already found one. From now on I’ll message you as soon as anything slips, so you don’t need to keep checking.'; },
      card: function () {
        return '<div class="un-res">' + head('watch', 'Watching inspections', '4 sites · I’ll reach out when something slips', 'Live')
          + '<div class="un-res__body">'
          + '<div class="un-res__inset" style="--i:0"><b>Northland Plant · Fire safety inspection</b><br>11 days overdue · 8 of 12 steps done<div class="un-bar"><i style="width:66%"></i></div></div>'
          + '<dl class="un-res__inset un-res__kv" style="--i:1"><dt>To</dt><dd>Northland maintenance team (5)</dd><dt>Subject</dt><dd><b>Fire inspection: 4 steps left. Can we close it by Friday?</b></dd><dt>Message</dt><dd>Hi team, the fire safety inspection is 11 days overdue. Extinguisher tags, exit lights, the sprinkler valve and the log sign-off are still open. Can we wrap these up by Friday? Thanks!</dd></dl>'
          + '</div><p class="un-res__note">I never send anything without your OK.</p>' + acts('Send the update', 'Update sent to the Northland team', 'Edit the draft') + '</div>';
      },
      next: ['Watch PMs too', 'Only ping me for high priority', 'Show everything that’s overdue']
    }
  ];

  var byKey = {}; WOW.forEach(function (w) { byKey[w.key] = w; });

  /* the starter card on home (a <button>): icon + title */
  function cardHTML(w) {
    return '<button type="button" class="un-wow" data-wow="' + w.key + '">'
      + '<span class="un-wow__icon">' + icon(w.icon) + '</span><b class="un-wow__title">' + w.title + '</b>'
      + icon('go', 'un-wow__go') + '</button>';
  }

  global.UltranovaWow = {
    list: WOW,
    get: function (key) { return byKey[key] || null; },
    byPrompt: function (text) { for (var i = 0; i < WOW.length; i++) if (WOW[i].title === text || WOW[i].option === text) return WOW[i]; return null; },
    cardHTML: cardHTML,
    icon: icon
  };
})(window);
