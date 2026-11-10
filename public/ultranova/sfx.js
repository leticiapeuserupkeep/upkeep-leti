/* Ultranova UI sounds: tiny synthesized tones (Web Audio, no files).
   click()  soft pop for elements marked data-sfx; ready()  two-note chime when an answer is ready.
   Mute is remembered in localStorage. Browsers only allow audio after a user gesture, which every click here is. */
(function (global) {
  'use strict';
  var ctx = null, muted = false;
  try { muted = localStorage.getItem('ultranova.muted') === '1'; } catch (e) { /* no storage: sound stays on */ }

  function audio() {
    if (!ctx) { var C = global.AudioContext || global.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /* one soft note: quick attack, exponential fade, optional pitch glide */
  function tone(freq, at, dur, type, peak, glideTo) {
    var a = audio(); if (!a || muted) return;
    var t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var api = {
    click: function () { tone(520, 0, 0.09, 'triangle', 0.05, 760); },
    ready: function () { tone(659.25, 0, 0.2, 'sine', 0.07); tone(987.77, 0.12, 0.34, 'sine', 0.07); },
    isMuted: function () { return muted; },
    setMuted: function (v) { muted = !!v; try { localStorage.setItem('ultranova.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ } }
  };
  /* only elements marked data-sfx click (the assistant's suggested actions) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sfx]');
    if (t && !t.disabled) api.click();
  }, true);
  global.UltranovaSFX = api;
})(window);
