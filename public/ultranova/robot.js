/* Ultranova assistant (3D) — shared by the onboarding and the home screen.
   One WebGL canvas draws one assistant inside every element matched by `selector` (default [data-robot]).
   Requires three.js r152 (global THREE).

   UltranovaRobots.init({
     canvas:    HTMLCanvasElement (fixed, full-viewport, pointer-events none),
     hi:        data-robot values drawn with the hi-res body (large placements),
     greet:     data-robot values that wave when they first appear,
     opacityOf: optional fn(el) -> 0..1, return 0 to skip a slot that is not visible
   }) -> { hop(id), wave(id) }  (throws if WebGL is unavailable; body gets .no-gl) */
(function (global) {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = THREE.MathUtils.clamp, SM = THREE.MathUtils.smoothstep;
  function init(opts) {
    var fg = opts.canvas, renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: fg, antialias: true, alpha: true }); }
    catch (e) { document.body.classList.add('no-gl'); return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

    // studio reflections tinted to the violet stage
    (function () {
      var env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 14, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.36, 0.33, 0.52), side: THREE.BackSide })));
      function panel(w, h, x, y, z, rx, ry, c) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m);
      }
      panel(9, 5, 0, 6.8, 2, Math.PI / 2, 0, new THREE.Color(6, 6, 6.6));
      panel(4, 6, -7, 1.5, 5, 0, Math.PI / 2.6, new THREE.Color(5.4, 4.6, 6));
      panel(2.5, 7, 7.5, 1, 3, 0, -Math.PI / 2.4, new THREE.Color(2.6, 2.8, 6.5));
      panel(10, 3, 0, -4, 6, -0.5, 0, new THREE.Color(1.8, 1.0, 3.2));
      var pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(env, 0.02).texture; pm.dispose();
    })();
    var key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-3, 5, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1; key.shadow.camera.far = 16;
    key.shadow.camera.left = -2.6; key.shadow.camera.right = 2.6; key.shadow.camera.top = 2.6; key.shadow.camera.bottom = -2.6;
    key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03;
    scene.add(key);
    var rim = new THREE.PointLight(0xb48cff, 16, 14); rim.position.set(3, 1, -3); scene.add(rim);

    /* ----- the five assistants: pastel palette, body shape (superellipsoid exponent N: 2 = round, higher = more cube) and a
       maintenance-themed plate behind the body (cog, wrench, hex nut) ----- */
    function hsl(h, sat, l) { return new THREE.Color().setHSL(h / 360, sat, l); }
    function palette(h, deco, N, L, S) {
      S = S || 0.92;   /* saturation of the suit: lower = drier, less pastel */
      L = L || 0.62;   /* greens and yellows read paler in the light, so they sit a little deeper */
      return {
        N: N, deco: deco,
        suit: '#' + hsl(h, S, L).getHexString(), suitDark: '#' + hsl(h, S * 0.7, L - 0.16).getHexString(),
        accent: '#' + hsl(h, 1, 0.6).getHexString(), accentSoft: '#' + hsl(h, 1, 0.72).getHexString(), light: hsl(h, 1, 0.6).getHex(),
        halo: [hsl(h, 1, 0.62), hsl(h, 1, 0.52), hsl(h, 1, 0.45)],
        eye: { a: hsl(h, 0.8, 0.5), b: hsl(h, 0.82, 0.55), c: hsl(h, 0.88, 0.64), glow: hsl(h, 1, 0.8), glow2: hsl(h, 1, 0.68), dot: hsl(h, 0.85, 0.6), dot2: hsl(h, 1, 0.8) },
        plate: '#' + hsl(h, 0.85, 0.6).getHexString(), shoe: '#' + hsl(h, Math.min(0.85, S), Math.max(0.3, L - 0.17)).getHexString()
      };
    }
    var VARIANTS = [
      null,                                   /* 0 · Core: the original blue, round (filled in below) */
      palette(40, null, 3.4, 0.38, 0.9),      /* 1 · deep amber yellow, cube like a notebook */
      Object.assign(palette(128, 'cogbody', 2, 0.35, 0.6), { pantsY: -0.31, flat: true, flatZ: 0.235, btnY: -0.74 }),   /* drier, yellower green */
      Object.assign(palette(46, 'wrenchbody', 2, 0.54), { pantsY: -0.66, flat: true, flatZ: 0.235, btnY: -0.95, faceDY: -0.38 }),   /* 3 · butter yellow, the body is a wrench */
      Object.assign(palette(355, 'nutbody', 2, 0.5), { pantsY: -0.31, flat: true, flatZ: 0.235, btnY: -0.7 })   /* 4 · soft coral, the body is a hex nut */
    ];
    var CUR = 0, V = null, NN = 2;
    function useVariant(i) {
      CUR = i; V = VARIANTS[i]; NN = V.N;
      var k = V.eyeScale || 1; EYE.rx = EYE0.rx * k; EYE.ry = EYE0.ry * k; EYE.x = EYE0.x + (V.eyeX || 0); EYE.y = EYE0.y + (V.eyeY || 0);
      PLATE.cy = 0.18 + (V.faceDY || 0); EYE.y += (V.faceDY || 0);   /* the whole face (plate, eyes, mouth) can sit lower */
      if (V.flat) { var zt = V.flatZ + 0.001; DEP = 0.04 / zt; DEPE = 1 - (1 - 0.06 / zt) / (1 - DEP); }   /* flat bodies: plate recessed 0.04, eye sockets 0.02 more (absolute), like the round ones */
      else { DEP = V.noPlate ? 0 : 0.04; DEPE = 0.022; } SC1 = 1 - DEP; SC2 = SC1 * (1 - DEPE);   /* no carved face plate for some assistants */   /* some assistants have smaller eyes */
    }

    /* ----- shared look ----- */
    var WHITE = '#f7faff', BLUE = '#3fa2f5', LIGHT_BLUE = '#12a0ff';
    function plastic(color, extra) { return new THREE.MeshPhysicalMaterial(Object.assign({ color: color, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.28 }, extra || {})); }
    var M = {
      body: plastic(0xffffff, { vertexColors: true }), white: plastic(WHITE), blue: plastic(BLUE),
      visor: plastic('#fdfeff', { roughness: 0.26, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
      navy: new THREE.MeshPhysicalMaterial({ color: '#030b1c', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.6 }),
      ring: new THREE.MeshBasicMaterial({ color: LIGHT_BLUE, toneMapped: false }),
      seam: new THREE.MeshStandardMaterial({ color: '#7ea3cb', roughness: 0.6 }),
      seamBlue: new THREE.MeshStandardMaterial({ color: '#2a78c4', roughness: 0.55 }),
      hair1: new THREE.MeshStandardMaterial({ color: '#a9c2dd', roughness: 0.55 }),
      hair2: new THREE.MeshStandardMaterial({ color: '#cddcee', roughness: 0.55 }),
      stem: new THREE.MeshStandardMaterial({ color: '#cfd8e6', roughness: 0.35, metalness: 0.4 }),
      bulbCore: new THREE.MeshBasicMaterial({ color: LIGHT_BLUE, toneMapped: false }),
      bulbShell: new THREE.MeshPhysicalMaterial({ color: '#5cbcff', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0, transparent: true, opacity: 0.35, envMapIntensity: 2, depthWrite: false }),
      ringShade: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    };
    VARIANTS[0] = {
      N: 2, deco: null, suit: BLUE, suitDark: '#1f6fc4', accent: LIGHT_BLUE, accentSoft: '#5cbcff', light: 0x1fa8ff,
      halo: null,
      eye: { a: new THREE.Color('#145ae1'), b: new THREE.Color('#166eee'), c: new THREE.Color('#2aa6f5'), glow: new THREE.Color('#78e1ff'), glow2: new THREE.Color('#3cafff'), dot: new THREE.Color('#3a9cf0'), dot2: new THREE.Color('#78c8ff') },
      plate: BLUE
    };
    function gray(l) { return new THREE.Color(l, l, l); }
    function grayOf(v) {   /* the same assistant with every colour drained: used while it is asleep */
      return { N: v.N, deco: v.deco, suit: '#c9ccd6', suitDark: '#8d93a3', accent: '#a9afbe', accentSoft: '#c3c8d4', light: 0x8890a0, shoe: '#9aa0b0', eyeScale: v.eyeScale, eyeY: v.eyeY, eyeX: v.eyeX, noPlate: v.noPlate, pantsY: v.pantsY, flat: v.flat, flatZ: v.flatZ, btnY: v.btnY, faceDY: v.faceDY,
        halo: [gray(0.8), gray(0.6), gray(0.5)],
        eye: { a: gray(0.36), b: gray(0.44), c: gray(0.58), glow: gray(0.85), glow2: gray(0.68), dot: gray(0.55), dot2: gray(0.8) }, plate: '#b3b8c4' };
    }
    for (var gi = 0; gi < 5; gi++) VARIANTS[10 + gi] = grayOf(VARIANTS[gi]);
    function rgba(c, a) { return 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + a + ')'; }
    var MV = {};
    function matsFor(v) {   /* shared materials, with the colour-bearing ones swapped per assistant */
      if (v === VARIANTS[0]) return M;
      if (MV[v.suit + v.accent]) return MV[v.suit + v.accent];
      return MV[v.suit + v.accent] = Object.assign({}, M, {
        blue: plastic(v.suit), shoe: plastic(v.shoe || v.suit), ring: new THREE.MeshBasicMaterial({ color: v.accent, toneMapped: false }),
        seamBlue: new THREE.MeshStandardMaterial({ color: v.suitDark, roughness: 0.55 }),
        bulbCore: new THREE.MeshBasicMaterial({ color: v.accent, toneMapped: false }),
        bulbShell: new THREE.MeshPhysicalMaterial({ color: v.accentSoft, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0, transparent: true, opacity: 0.35, envMapIntensity: 2, depthWrite: false })
      });
    }
    function softTex(stops) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    }
    var haloTex = softTex([[0, 'rgba(40,170,255,0.95)'], [0.3, 'rgba(20,140,255,0.5)'], [1, 'rgba(10,110,255,0)']]);
    var blobTex = {};
    function makeBlob() {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      g.addColorStop(0, 'rgba(150,110,255,0.5)'); g.addColorStop(1, 'rgba(150,110,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    }
    var blob = makeBlob();

    /* ----- face carved into the shell ----- */
    var PLATE = { cy: 0.18, a: 0.68, b: 0.44, n: 3.4 }, DEP = 0.04;
    var EYE = { x: 0.3, y: 0.27, rx: 0.21, ry: 0.235 }, EYE0 = { x: 0.3, y: 0.27, rx: 0.21, ry: 0.235 }, DEPE = 0.022;
    var SC1 = 1 - DEP, SC2 = SC1 * (1 - DEPE);
    function eyeT(wx, wy, s) { return Math.sqrt(Math.pow((wx - EYE.x * s) / EYE.rx, 2) + Math.pow((wy - EYE.y) / EYE.ry, 2)); }
    var FACE_DOME = 0.05;
    function plateT(px, py) { return Math.pow(Math.pow(Math.abs(px) / PLATE.a, PLATE.n) + Math.pow(Math.abs(py - PLATE.cy) / PLATE.b, PLATE.n), 1 / PLATE.n); }
    function bodyZ(px, py) { if (V.flat) { if (px * px + py * py >= 0.8) return 0; var tt = plateT(px, py) / 1.07; return V.flatZ + 0.001 + FACE_DOME * Math.max(0, 1 - tt * tt); }   /* a flat face with a gentle bulge inside the plate */
      var yU = py / 0.95, k = 1 + 0.05 * yU, v = 1 - Math.pow(Math.abs(px / k), NN) - Math.pow(Math.abs(yU), NN); return v > 0 ? 0.92 * Math.pow(v, 1 / NN) : 0; }
    function facePt(px, py) { return V.flat ? bodyZ(px, py) - 0.04 : SC1 * bodyZ(px / SC1, py / SC1); }   /* flat bodies: the plate floor is 0.04 below the face, like the round ones */
    function eyeFloor(px, py) { return V.flat ? bodyZ(px, py) - 0.06 : SC2 * bodyZ(px / SC2, py / SC2); }   /* …and the eye sockets 0.02 deeper */
    function sgnPow(v, p) { return Math.sign(v) * Math.pow(Math.abs(v), p); }
    function plateEdge(th) { return [PLATE.a * sgnPow(Math.cos(th), 2 / PLATE.n), PLATE.cy + PLATE.b * sgnPow(Math.sin(th), 2 / PLATE.n)]; }

    function buildBody(segW, segH) {
      var geo = new THREE.SphereGeometry(1, segW, segH), pos = geo.attributes.position, cols = [];
      var cWhite = new THREE.Color(WHITE), cWS = new THREE.Color('#c9dcf0'), cBlue = new THREE.Color(V.suit), cBS = new THREE.Color(V.suitDark), cA = new THREE.Color(), cB = new THREE.Color();
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (NN !== 2) { var ps = Math.pow(Math.pow(Math.abs(x), NN) + Math.pow(Math.abs(y), NN) + Math.pow(Math.abs(z), NN), 1 / NN); x /= ps; y /= ps; z /= ps; }
        var lit = SM(-0.35 * x + 0.55 * y + 0.45 * z, -0.5, 0.75);
        cA.copy(cWS).lerp(cWhite, lit); cB.copy(cBS).lerp(cBlue, lit);
        cA.lerp(cB, 1 - SM(y, (V.pantsY || -0.33) - 0.03, (V.pantsY || -0.33) + 0.03)); cols.push(cA.r, cA.g, cA.b);
        var wx = x * (1 + 0.05 * y), wy = 0.95 * y, sc = 1;
        if (z > 0.2) {
          var tq = Math.pow(Math.pow(Math.abs(wx) / PLATE.a, PLATE.n) + Math.pow(Math.abs(wy - PLATE.cy) / PLATE.b, PLATE.n), 1 / PLATE.n);
          sc = 1 - DEP * (1 - SM(tq, 0.93, 1.0));
          sc *= 1 - DEPE * (1 - SM(Math.min(eyeT(wx, wy, -1), eyeT(wx, wy, 1)), 0.9, 1.07));
        }
        pos.setXYZ(i, wx * sc, y * sc, z * sc);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals(); return geo;
    }
    function seamGeo(yU, a0, a1, closed, radius) {
      var pts = [], n = 120, r = Math.sqrt(1 - yU * yU), k = 1 + 0.05 * yU;
      for (var j = 0; j < n; j++) {
        var th = closed ? (j / n) * Math.PI * 2 : a0 + (a1 - a0) * (j / (n - 1));
        var dx = r * Math.sin(th), dz = r * Math.cos(th), sp = NN === 2 ? 1 : Math.pow(Math.pow(Math.abs(dx), NN) + Math.pow(Math.abs(yU), NN) + Math.pow(Math.abs(dz), NN), 1 / NN);
        pts.push(new THREE.Vector3(dx / sp * k * 1.003, 0.95 * yU / sp, 0.92 * dz / sp * 1.003));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), n * 2, radius, 6, closed);
    }
    function hairGeo(t, radius, floor) {
      var pts = [], n = 160;
      for (var j = 0; j < n; j++) {
        var e = plateEdge((j / n) * Math.PI * 2), px = e[0] * t, py = PLATE.cy + (e[1] - PLATE.cy) * t;
        pts.push(new THREE.Vector3(px, py, (floor ? facePt(px, py) : bodyZ(px, py)) + 0.002));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 320, radius, 6, true);
    }
    var T0 = 0.9;
    function eyeDecalGeo(ex, ey) {
      var S = 56, R = 12, v = [], uv = [], idx = [];
      function add(r, th) {
        var px = ex + EYE.rx * T0 * r * Math.cos(th), py = EYE.y + EYE.ry * T0 * r * Math.sin(th);
        v.push(px - ex, py - ey, eyeFloor(px, py) + (V.flat ? 0.006 : 0.0012)); uv.push(0.5 + 0.5 * r * Math.cos(th), 0.5 + 0.5 * r * Math.sin(th));
      }
      add(0, 0);
      for (var r = 1; r <= R; r++) for (var s = 0; s < S; s++) add(r / R, (s / S) * Math.PI * 2);
      for (var s1 = 0; s1 < S; s1++) idx.push(0, 1 + s1, 1 + ((s1 + 1) % S));
      for (var r1 = 1; r1 < R; r1++) for (var s2 = 0; s2 < S; s2++) {
        var a = 1 + (r1 - 1) * S + s2, b = 1 + (r1 - 1) * S + ((s2 + 1) % S), c = a + S, d = b + S; idx.push(a, c, b, b, c, d);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
    }
    function socketRingGeo(ex) {
      var S = 72, R = 12, te0 = 0.9, te1 = 1.22, v = [], col = [], idx = [];
      function bump(t, a, b) { return t > a && t < b ? Math.sin(Math.PI * (t - a) / (b - a)) : 0; }
      for (var r = 0; r <= R; r++) {
        var te = te0 + (te1 - te0) * (r / R);
        for (var sI = 0; sI < S; sI++) {
          var th = (sI / S) * Math.PI * 2, px = ex + EYE.rx * te * Math.cos(th), py = EYE.y + EYE.ry * te * Math.sin(th);
          var scv = SC1 * (1 - DEPE * (1 - SM(te, 0.9, 1.07))), zr = V.flat ? bodyZ(px, py) - 0.04 - 0.02 * (1 - SM(te, 0.9, 1.07)) + 0.006 : scv * bodyZ(px / scv, py / scv) + 0.0014;
          v.push(px - ex, py - EYE.y, zr);
          var toLight = 0.5 + 0.5 * Math.cos(th - 0.8), away = 0.5 - 0.5 * Math.cos(th - 0.8);
          var aS = 0.6 * Math.pow(toLight, 1.6) * bump(te, 0.9, 1.12), aH = 0.8 * Math.pow(away, 2.4) * bump(te, 1.0, 1.2);
          var a = 1 - (1 - aS) * (1 - aH), k = aS + aH + 1e-6;
          col.push((0.08 * aS + 0.92 * aH) / k, (0.2 * aS + 0.97 * aH) / k, (0.52 * aS + 1.0 * aH) / k, a);
        }
      }
      for (var r2 = 0; r2 < R; r2++) for (var s2 = 0; s2 < S; s2++) {
        var a0 = r2 * S + s2, b0 = r2 * S + ((s2 + 1) % S), c0 = a0 + S, d0 = b0 + S; idx.push(a0, c0, b0, b0, c0, d0);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx); return g;
    }
    function buildLegGeo() {
      var g = new THREE.SphereGeometry(1, 48, 36), lp = g.attributes.position, lc = [], tc = new THREE.Color();
      for (var q = 0; q < lp.count; q++) {
        var ly = lp.getY(q), lit2 = SM(-0.35 * lp.getX(q) + 0.55 * ly + 0.45 * lp.getZ(q), -0.5, 0.75);
        var w = new THREE.Color(WHITE).lerp(new THREE.Color('#c9dcf0'), 1 - lit2), b = new THREE.Color(V.suit).lerp(new THREE.Color(V.suitDark), 1 - lit2);
        tc.copy(b).lerp(w, SM(ly, -0.28, -0.22)); lc.push(tc.r, tc.g, tc.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3)); return g;
    }

    /* ----- eye layers (textures are cloned per robot so each one reacts on its own) ----- */
    var EW = 320, EH = 360;
    function canvasTex(draw) { var c = document.createElement('canvas'); c.width = EW; c.height = EH; draw(c.getContext('2d')); var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
    function WX(u) { return EW * (0.1 + 0.8 * u); } function WY(v) { return EH * (0.1 + 0.8 * v); }
    var eyeMask = canvasTex(function (x) { x.fillStyle = '#000'; x.fillRect(0, 0, EW, EH); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(EW / 2, EH / 2, EW / 2 - 1, EH / 2 - 1, 0, 0, Math.PI * 2); x.fill(); });
    var eyeBase = canvasTex(function (x) {
      x.beginPath(); x.ellipse(EW / 2, EH / 2, EW / 2 - 1, EH / 2 - 1, 0, 0, Math.PI * 2); x.clip();
      var g = x.createLinearGradient(0, 0, 0, EH); g.addColorStop(0, '#010103'); g.addColorStop(1, '#02030a'); x.fillStyle = g; x.fillRect(0, 0, EW, EH);
      var vg = x.createRadialGradient(EW / 2, EH / 2, EH * 0.36, EW / 2, EH / 2, EH * 0.55); vg.addColorStop(0, 'rgba(0,4,16,0)'); vg.addColorStop(1, 'rgba(0,4,16,0.6)'); x.fillStyle = vg; x.fillRect(0, 0, EW, EH);
    });
    function makeLiquid(e) {
      return canvasTex(function (x) {
        var y0 = WY(0.5), g = x.createLinearGradient(0, y0, 0, EH);
        g.addColorStop(0, rgba(e.a, 0)); g.addColorStop(0.16, rgba(e.a, 0.55)); g.addColorStop(0.5, rgba(e.b, 0.62)); g.addColorStop(1, rgba(e.c, 0.95));
        x.fillStyle = g; x.fillRect(0, y0, EW, EH - y0);
        x.save(); x.translate(WX(0.46), WY(0.9)); x.scale(1, 0.5);
        var gl = x.createRadialGradient(0, 0, 0, 0, 0, EW * 0.8 * 0.46); gl.addColorStop(0, rgba(e.glow, 0.95)); gl.addColorStop(0.55, rgba(e.glow2, 0.55)); gl.addColorStop(1, rgba(e.glow2, 0));
        x.fillStyle = gl; x.fillRect(-EW, -EW, 2 * EW, 2 * EW); x.restore();
      });
    }
    function makeGlint(e) {
      return canvasTex(function (x) {
        x.fillStyle = rgba(e.dot, 1); x.beginPath(); x.arc(WX(0.7), WY(0.5), EW * 0.8 * 0.04, 0, Math.PI * 2); x.fill();
        x.fillStyle = rgba(e.dot2, 0.5); x.beginPath(); x.arc(WX(0.77), WY(0.8), EW * 0.8 * 0.05, 0, Math.PI * 2); x.fill();
        x.save(); x.translate(WX(0.66), WY(0.2)); x.rotate(-0.55); x.scale(1, 0.72);
        var hg = x.createRadialGradient(0, 0, 0, 0, 0, EW * 0.8 * 0.17); hg.addColorStop(0, 'rgba(236,239,246,0.95)'); hg.addColorStop(0.78, 'rgba(226,231,241,0.9)'); hg.addColorStop(1, 'rgba(226,231,241,0)');
        x.fillStyle = hg; x.beginPath(); x.arc(0, 0, EW * 0.8 * 0.17, 0, Math.PI * 2); x.fill(); x.restore();
      });
    }
    var ET = {};
    function eyeSrc(v) { var k = v.suit + v.accent; return ET[k] || (ET[k] = { liquid: makeLiquid(v.eye), glint: makeGlint(v.eye) }); }
    var HT = {};
    function haloFor(v) {
      if (!v.halo) return haloTex;
      var k = v.suit + v.accent; return HT[k] || (HT[k] = softTex([[0, rgba(v.halo[0], 0.95)], [0.3, rgba(v.halo[1], 0.5)], [1, rgba(v.halo[2], 0)]]));
    }
    function decalMat(map, alpha, po) { return new THREE.MeshBasicMaterial({ map: map, alphaMap: alpha, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: po, polygonOffsetUnits: po }); }
    var eyeBaseMat = decalMat(eyeBase, null, -2);

    /* ----- lazily built shared geometry ----- */
    var G = {};
    function geo(name, make) { var k = CUR + ':' + name; return G[k] || (G[k] = make()); }
    function mouthPts() {
      return geo('mouthPts', function () {
        var pts = [], MR = 0.1, MCY = 0.04 + (V.faceDY || 0);
        for (var j = 0; j <= 32; j++) { var phi = -0.85 * Math.PI + 0.7 * Math.PI * (j / 32), x = MR * 1.1 * Math.cos(phi), y = MCY + MR * Math.sin(phi); pts.push(new THREE.Vector3(x, y, facePt(x, y) - 0.005)); }
        return pts;
      });
    }

    /* ----- maintenance plates behind the body: cog, wrench, hex nut (extruded outlines, same plastic look) ----- */
    function decoShape(kind) {
      var sh = new THREE.Shape(), i;
      if (kind === 'cog') {
        var teeth = 10;
        for (i = 0; i < teeth; i++) {
          var a = (i / teeth) * Math.PI * 2, d = Math.PI / teeth, pts = [[a - d * 0.62, 1.12], [a - d * 0.36, 1.34], [a + d * 0.36, 1.34], [a + d * 0.62, 1.12]];
          pts.forEach(function (q, k) { var X = Math.cos(q[0]) * q[1], Y = Math.sin(q[0]) * q[1]; if (i === 0 && k === 0) sh.moveTo(X, Y); else sh.lineTo(X, Y); });
        }
      } else if (kind === 'nut') {
        for (i = 0; i < 6; i++) { var h = Math.PI / 6 + (i / 6) * Math.PI * 2; if (i === 0) sh.moveTo(Math.cos(h) * 1.38, Math.sin(h) * 1.38); else sh.lineTo(Math.cos(h) * 1.38, Math.sin(h) * 1.38); }
      } else {   /* wrench: open jaw on top, rounded handle end below */
        var R = 0.52, cy = 1.3, nw = 0.17, hw = 0.17, c0 = Math.atan2(Math.sqrt(R * R - nw * nw), nw), j0 = -Math.PI / 2 + Math.asin(hw / R), q;
        sh.moveTo(nw, cy + Math.sqrt(R * R - nw * nw));
        for (q = 0; q <= 24; q++) { var an = c0 + (j0 - c0) * (q / 24); sh.lineTo(Math.cos(an) * R, cy + Math.sin(an) * R); }
        sh.lineTo(hw, -1.6);
        for (q = 0; q <= 12; q++) { var an2 = -Math.PI * (q / 12); sh.lineTo(Math.cos(an2) * hw, -1.6 + Math.sin(an2) * hw); }
        var j1 = -Math.PI / 2 - Math.asin(hw / R), c1 = Math.PI - c0 - 2 * Math.PI;
        sh.lineTo(-hw, cy + Math.sin(j1) * R);
        for (q = 0; q <= 24; q++) { var an3 = j1 + (c1 - j1) * (q / 24); sh.lineTo(Math.cos(an3) * R, cy + Math.sin(an3) * R); }
        sh.lineTo(-nw, cy + 0.05); sh.lineTo(nw, cy + 0.05);
      }
      sh.closePath(); return sh;
    }
    /* Arco: the body itself is the cog. Every tooth is a soft rounded nub; the ears, hands and feet are teeth too
       (ears a touch shorter, hands and feet a touch longer). No separate arms, legs or ears. */
    function cogTooth(len, mat) {
      var m = new THREE.Mesh(geo('tooth' + len, function () {
        /* a squarish nub with generously rounded corners: still reads as a cog tooth, but soft */
        var h = len / 2 + 0.2, wb = 0.21, wt = 0.18, c = 0.1, sh = new THREE.Shape();
        sh.moveTo(-wb + c, -h); sh.lineTo(wb - c, -h); sh.quadraticCurveTo(wb, -h, wb, -h + c);
        sh.lineTo(wt, h - c); sh.quadraticCurveTo(wt, h, wt - c, h);
        sh.lineTo(-wt + c, h); sh.quadraticCurveTo(-wt, h, -wt, h - c);
        sh.lineTo(-wb, -h + c); sh.quadraticCurveTo(-wb, -h, -wb + c, -h);
        var g = new THREE.ExtrudeGeometry(sh, { depth: 0.38, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 8 });
        g.translate(0, 0, -0.19); return g;
      }), mat);
      m.castShadow = true; return m;
    }
    function placeTooth(rig, deg, len, center, mat) {   /* static tooth at an angle around the rim, pointing outward */
      var a = deg * Math.PI / 180, t = cogTooth(len, mat);
      t.position.set(center * Math.cos(a), 0.95 * center * Math.sin(a), 0); t.rotation.z = a - Math.PI / 2; rig.add(t); return t;
    }
    function addCogTeeth(rig, M) { [58, 90, 122].forEach(function (d) { placeTooth(rig, d, 0.1, 1.1, M.white); }); }
    function buildDeco(v, mat) {
      var g = new THREE.ExtrudeGeometry(decoShape(v.deco), { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 10 });
      g.translate(0, 0, -0.1); var m = new THREE.Mesh(g, mat);
      if (v.deco === 'wrench') { m.rotation.z = 0.8; m.position.set(0.1, -0.15, -0.55); }
      else if (v.deco === 'nut') { m.position.set(0, -0.02, -0.5); m.rotation.z = 0.0; }
      else m.position.set(0, -0.02, -0.5);
      return m;
    }

    /* Arco's body: a thick wheel with soft edges. The mouth is a real hole through its middle (the hole of a cog),
       rebuilt as it breathes into a half smile; a dark backing gives it depth. */
    /* The wheel is ONE outline with its eight teeth (ears, hands and feet included, all the same length), so nothing is stuck on.
       It is cut into body, trousers and shoes; each piece is extruded with soft bevels, so the cuts read as carved grooves. */
    var GEAR_R = 0.88, SHOE_CUT = 1.03, BELLY = 0.1;   /* the waistline dips by BELLY in the middle: a little tummy */
    function waistY(v, x) { return v.pantsY - BELLY * (1 - Math.min(1, x * x / (GEAR_R * GEAR_R))); }
    function gearOutline(handR, handExtra) {
      var teeth = [[68, 0.34], [112, 0.34], [28, 0.34], [152, 0.34], [handR, 0.34 + (handExtra || 0)], [185, 0.34], [250, 0.34], [290, 0.34]]   /* all eight teeth the same length */, pts = [], n = 360, hw = 13, soft = 3.5;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 360, r = GEAR_R;
        teeth.forEach(function (t) { var d = Math.abs(((a - t[0] + 540) % 360) - 180); r = Math.max(r, GEAR_R + t[1] * (1 - SM(d, hw - soft, hw + soft))); });
        pts.push({ x: r * Math.cos(a * Math.PI / 180), y: r * Math.sin(a * Math.PI / 180) });
      }
      return pts;
    }
    function clipPoly(pts, f) {   /* keep the part where f(p) >= 0 (Sutherland–Hodgman, one half-plane) */
      var out = [];
      for (var i = 0; i < pts.length; i++) {
        var c = pts[i], nx = pts[(i + 1) % pts.length], fc = f(c), fn = f(nx);
        if (fc >= 0) out.push(c);
        if ((fc >= 0) !== (fn >= 0)) { var t = fc / (fc - fn); out.push({ x: c.x + (nx.x - c.x) * t, y: c.y + (nx.y - c.y) * t }); }
      }
      return out;
    }
    function extrudePoly(pts, hole, depth) {
      var sh = new THREE.Shape(); pts.forEach(function (q, i) { if (i) sh.lineTo(q.x, q.y); else sh.moveTo(q.x, q.y); }); sh.closePath();
      if (hole) { var h = new THREE.Path(); hole.slice().reverse().forEach(function (q, i) { if (i) h.lineTo(q.x, q.y); else h.moveTo(q.x, q.y); }); h.closePath(); sh.holes.push(h); }
      var d = depth || 0.3, g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 4 });
      g.translate(0, 0, -d / 2); return g;
    }
    function plateOutline() {   /* the carved face plate: same outline as the other assistants */
      var pts = []; for (var q = 0; q < 96; q++) { var e = plateEdge((q / 96) * Math.PI * 2); pts.push({ x: e[0], y: e[1] }); } return pts;
    }
    /* body: the whole wheel (with its eight teeth) as one mesh, with the face plate cut into it; the plate floor is a second, thinner piece */
    /* Onyx: the body is an open-end wrench standing up: a round head with the jaw on top (its two prongs are the ears),
       two little hands at the sides, and the handle below as legs ending in two feet. */
    function wrenchOutline() {
      var pts = [], R = GEAR_R, a, hx = 0.27, hw = 0.4, ya = Math.sqrt(R * R - hx * hx), aL = Math.atan2(ya, -hx) * 180 / Math.PI, aH = Math.atan2(-Math.sqrt(R * R - hw * hw), -hw) * 180 / Math.PI + 360;
      function circ(deg) { var q = deg * Math.PI / 180; pts.push({ x: R * Math.cos(q), y: R * Math.sin(q) }); }
      var cy0 = -Math.sqrt(R * R - hw * hw);
      function blend(from, to, ctrl) { for (var u = 1; u <= 8; u++) { var t = u / 8, m = 1 - t; pts.push({ x: m * m * from.x + 2 * m * t * ctrl.x + t * t * to.x, y: m * m * from.y + 2 * m * t * ctrl.y + t * t * to.y }); } }
      for (a = aL; a <= aH - 12; a += 1) circ(a);                                                       // left side of the head
      var pl = pts[pts.length - 1]; blend(pl, { x: -hw, y: -1.08 }, { x: -hw, y: cy0 });                // eased neck: the head flows into the handle, no sharp corner   // wide handle ending in a single foot: straight sides, round corners, no slot
      for (var c = 0; c <= 8; c++) { var qa = Math.PI + (c / 8) * (Math.PI / 2), cr = 0.16; pts.push({ x: -hw + cr + cr * Math.cos(qa), y: -1.45 + cr + cr * Math.sin(qa) }); }
      for (c = 0; c <= 8; c++) { var qb = 1.5 * Math.PI + (c / 8) * (Math.PI / 2); pts.push({ x: hw - cr + cr * Math.cos(qb), y: -1.45 + cr + cr * Math.sin(qb) }); }
      pts.push({ x: hw, y: -1.08 });
      var qa2 = (540 - aH + 12) * Math.PI / 180; blend({ x: hw, y: -1.08 }, { x: R * Math.cos(qa2), y: R * Math.sin(qa2) }, { x: hw, y: cy0 });
      for (a = 540 - aH + 12; a <= 360 + (180 - aL); a += 1) circ(a);                                        // right side, up to the jaw
      /* the open jaw, like a real open-end wrench: parallel straight faces and a flat bottom with small rounded corners */
      var jw = 0.27, jb = 0.47, jc = 0.07;
      pts.push({ x: jw, y: jb + jc });
      for (var k2 = 1; k2 <= 6; k2++) { var ka = (k2 / 6) * (Math.PI / 2); pts.push({ x: jw - jc + jc * Math.cos(ka), y: jb + jc - jc * Math.sin(ka) }); }
      for (k2 = 0; k2 <= 6; k2++) { var kb = Math.PI / 2 + (k2 / 6) * (Math.PI / 2); pts.push({ x: -jw + jc + jc * Math.cos(kb), y: jb + jc - jc * Math.sin(kb) }); }
      pts.push({ x: -jw, y: jb + jc });
      return pts;
    }
    /* Vegas: the body is a hex nut (soft rounded corners) on Elio's round legs */
    function nutOutline() {
      var R = 1.05, h = R * Math.sqrt(3) / 2, pts = [], c;
      var hexTop = [{ x: R, y: 0 }, { x: R / 2, y: h }, { x: -R / 2, y: h }, { x: -R, y: 0 }];
      function corner(P, V, N, t) {   // round the corner at V between P and N
        var a1 = { x: V.x + (P.x - V.x) * t, y: V.y + (P.y - V.y) * t }, a2 = { x: V.x + (N.x - V.x) * t, y: V.y + (N.y - V.y) * t };
        for (var u = 0; u <= 6; u++) { var k = u / 6, m = 1 - k; pts.push({ x: m * m * a1.x + 2 * m * k * V.x + k * k * a2.x, y: m * m * a1.y + 2 * m * k * V.y + k * k * a2.y }); }
      }
      var bl = { x: -R / 2, y: -h }, br = { x: R / 2, y: -h };
      corner({ x: R / 2, y: -h }, hexTop[0], hexTop[1], 0.2);
      corner(hexTop[0], hexTop[1], hexTop[2], 0.2);
      corner(hexTop[1], hexTop[2], hexTop[3], 0.2);
      corner(hexTop[2], hexTop[3], bl, 0.2);
      corner(hexTop[3], bl, br, 0.2);
      corner(bl, br, hexTop[0], 0.2);   // plain hex bottom: the legs are Elio's round pods, added below

      return pts;
    }
    function buildGearBody(v, handR, handExtra, plateHole) { return extrudePoly(v.deco === 'wrenchbody' ? wrenchOutline(handR, handExtra) : (v.deco === 'nutbody' ? nutOutline() : gearOutline(handR, handExtra)), plateHole || plateOutline()); }
    /* the face: a fine mesh carved with exactly the same recess as the round assistants (soft plate slope + eye sockets);
       it sits just proud of the flat front and covers the plate-shaped hole in the body */
    function buildFaceDisc() {
      var zTop = V.flatZ + 0.001, S = 160, R = 48, tMax = 1.04, pos = [0, PLATE.cy, (zTop + FACE_DOME) - 0.04], idx = [], i, j;
      for (i = 1; i <= R; i++) {
        var t = tMax * i / R, zb = zTop + FACE_DOME * Math.max(0, 1 - (t / tMax) * (t / tMax));
        for (j = 0; j < S; j++) {
          var e = plateEdge((j / S) * Math.PI * 2), px = e[0] * t, py = PLATE.cy + (e[1] - PLATE.cy) * t;
          var drop = 0.04 * (1 - SM(t, 0.93, 1.0)) + 0.02 * (1 - SM(Math.min(eyeT(px, py, -1), eyeT(px, py, 1)), 0.9, 1.07));
          pos.push(px, py, zb - drop);
        }
      }
      for (j = 0; j < S; j++) idx.push(0, 1 + j, 1 + (j + 1) % S);
      for (i = 1; i < R; i++) for (j = 0; j < S; j++) { var a = 1 + (i - 1) * S + j, b = 1 + (i - 1) * S + (j + 1) % S, c = a + S, d = b + S; idx.push(a, c, b, b, c, d); }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;    }
    /* colours (trousers, white legs, shoes) are painted per pixel from the position, so there are no extra pieces, no overlaps and nothing to flicker */
    function gearMaterial(v) {
      var mat = new THREE.MeshPhysicalMaterial({ color: WHITE, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.28 });
      mat.onBeforeCompile = function (sh) {
        sh.uniforms.uSuit = { value: new THREE.Color(v.suit) }; sh.uniforms.uShoe = { value: new THREE.Color(v.shoe) }; sh.uniforms.uPY = { value: v.pantsY }; sh.uniforms.uMode = { value: v.deco === 'wrenchbody' ? 1 : (v.deco === 'nutbody' ? 2 : 0) };
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vGxy;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGxy = position.xy;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vGxy; uniform vec3 uSuit; uniform vec3 uShoe; uniform float uPY; uniform float uMode;')
          .replace('#include <color_fragment>', `#include <color_fragment>
          vec2 g = vGxy; float rr = length(g); vec2 dir = g / max(rr, 1e-4);
          float edge = uPY - ${BELLY.toFixed(3)} * (1.0 - min(1.0, g.x * g.x / ${(GEAR_R * GEAR_R).toFixed(4)}));
          float below = 1.0 - smoothstep(edge - 0.004, edge + 0.004, g.y);
          vec2 nL = vec2(-0.342, -0.940), nR = vec2(0.342, -0.940);
          float fl = step(0.951, dot(dir, nL)), fr = step(0.951, dot(dir, nR));
          float leg = max(fl, fr) * step(0.89, rr);
          float dist = max(fl * dot(g, nL), fr * dot(g, nR));
          float shoe = leg * step(${SHOE_CUT.toFixed(3)}, dist);
          if (uMode > 0.5 && uMode < 1.5) { leg = 0.0; shoe = step(abs(g.x), 0.46) * step(g.y, -1.22); }
          if (uMode > 1.5) { leg = 0.0; shoe = 0.0; }   // the nut: just trousers (its legs are Elio's pods)   // the wrench: trousers and legs are all yellow, the feet a stronger yellow
          float hand = max(step(0.956, dot(dir, vec2(0.996, -0.087))), step(0.956, dot(dir, vec2(-0.996, -0.087)))) * step(0.89, rr);
          if (uMode > 0.5) hand = 0.0;
          float pants = below * (1.0 - leg) * (1.0 - hand);
          diffuseColor.rgb = mix(mix(diffuseColor.rgb, uSuit, pants), uShoe, shoe);`);
      };
      mat.customProgramCacheKey = function () { return 'ultranova-gear'; };
      return mat;
    }

    /* ----- one assistant ----- */
    function createRobot(hi, vi) {
      useVariant(vi || 0); var M = matsFor(V), haloTex = haloFor(V), pv = V;   /* this assistant's palette, shape and plate */
      var group = new THREE.Group(); group.visible = false; scene.add(group);
      var root = new THREE.Group(), rig = new THREE.Group(); group.add(root); root.add(rig);
      function cast(m) { m.castShadow = hi; m.receiveShadow = hi; return m; }

      var body, gearBody = pv.flat ? { hr: -5, ex: 0, at: 0 } : null;
      if (gearBody) {
        var gmat = gearMaterial(pv);
        gearBody.hole = plateOutline();   /* kept for later rebuilds: other assistants move the shared plate position, so it must not be recomputed */
        body = cast(new THREE.Mesh(buildGearBody(pv, gearBody.hr, 0, gearBody.hole), gmat)); rig.add(body);
        var dmat = gearMaterial(pv); dmat.polygonOffset = true; dmat.polygonOffsetFactor = -1; dmat.polygonOffsetUnits = -1;
        rig.add(new THREE.Mesh(geo('faceDisc', buildFaceDisc), dmat));
        /* the waistline is engraved like the other assistants' seam: a thin line across the front */
        var wx = pv.deco === 'nutbody' ? 1.05 - Math.abs(pv.pantsY) / Math.tan(Math.PI / 3) - 0.012 : Math.sqrt(GEAR_R * GEAR_R - pv.pantsY * pv.pantsY) - 0.03,   /* the nut's waistline runs all the way to its edges */
             wz = pv.flatZ + 0.004, wp = [];
        for (var wq = 0; wq <= 16; wq++) { var wxx = -wx + 2 * wx * wq / 16; wp.push(new THREE.Vector3(wxx, waistY(pv, wxx), wz)); }
        rig.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wp), 48, 0.009, 8, false), M.seamBlue));
      }
      else { body = cast(new THREE.Mesh(hi ? geo('bodyHi', function () { return buildBody(384, 288); }) : geo('bodyLo', function () { return buildBody(176, 132); }), M.body)); body.scale.set(1, 0.95, 0.92); rig.add(body); }
      if (pv.flat) { /* the shape is the body itself */ } else if (pv.deco) rig.add(buildDeco(pv, plastic(pv.plate)));
      if (!pv.flat) rig.add(new THREE.Mesh(geo('seamA', function () { return seamGeo(V.pantsY || -0.33, 0, 0, true, 0.011); }), M.seamBlue));
      if (!pv.flat) rig.add(new THREE.Mesh(geo('seamB', function () { return seamGeo(0.8, -1.25, 1.25, false, 0.007); }), M.seam));

      var face = new THREE.Group(); rig.add(face);
      if (!pv.noPlate) {
        face.add(new THREE.Mesh(geo('hair1', function () { return hairGeo(1.0, 0.0032, false); }), M.hair1));
        face.add(new THREE.Mesh(geo('hair2', function () { return hairGeo(0.93, 0.0022, true); }), M.hair2));
      }

      var es = eyeSrc(V), liquidTex = es.liquid.clone(), glintTex = es.glint.clone();
      [liquidTex, glintTex].forEach(function (t) { t.needsUpdate = true; t.repeat.set(0.8, 0.8); t.offset.set(0.1, 0.1); });
      var liquidMat = decalMat(liquidTex, eyeMask, -3), glintMat = decalMat(glintTex, eyeMask, -4);
      var eyes = [];
      [-1, 1].forEach(function (s) {
        var ex = EYE.x * s, ey = EYE.y, dg = geo('eyeDecal' + s, function () { return eyeDecalGeo(ex, ey); });
        var ring = new THREE.Mesh(geo('ring' + s, function () { return socketRingGeo(ex); }), M.ringShade); ring.position.set(ex, ey, 0); ring.renderOrder = 4; face.add(ring);
        var g = new THREE.Group(); g.position.set(ex, ey, 0); face.add(g);
        [[eyeBaseMat, 1], [liquidMat, 2], [glintMat, 3]].forEach(function (L) { var m = new THREE.Mesh(dg, L[0]); m.renderOrder = L[1]; g.add(m); });
        eyes.push(g);
      });

      var holeMorph = null;
      if (gearBody) {   /* the right hand (a tooth of the wheel) waves: the upper piece is rebuilt with the tooth at its new angle */
        holeMorph = function (k, sc, hr, ex) {
          var now = performance.now();
          if (pv.deco !== 'cogbody') return;
          if (now - gearBody.at < 40 || (Math.abs(hr - gearBody.hr) < 0.6 && Math.abs(ex - gearBody.ex) < 0.01)) return;   /* ~25 rebuilds a second at most, only when the hand moved */
          gearBody.at = now; gearBody.hr = hr; gearBody.ex = ex; var old = body.geometry; body.geometry = buildGearBody(pv, hr, ex, gearBody.hole); old.dispose();
        };
      }
      var mp = mouthPts();
      face.add(new THREE.Mesh(geo('mouth', function () { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mp), 64, 0.0165, 12, false); }), M.navy));
      [mp[0], mp[mp.length - 1]].forEach(function (pt) { var cap = new THREE.Mesh(geo('cap', function () { return new THREE.SphereGeometry(0.0165, 16, 12); }), M.navy); cap.position.copy(pt); face.add(cap); });

      [-1, 1].forEach(function (s) {
        if (pv.flat) return;   /* Arco: the ears are teeth of the wheel */
        var g = new THREE.Group(); g.position.set(0.9 * s, 0.1, 0.06); g.rotation.z = -0.3 * s; rig.add(g);
        var disc = cast(new THREE.Mesh(geo('earDisc', function () { return new THREE.CylinderGeometry(0.285, 0.285, 0.16, 56); }), M.white)); disc.rotation.z = Math.PI / 2; g.add(disc);
        var border = new THREE.Mesh(geo('earBorder', function () { return new THREE.TorusGeometry(0.285, 0.022, 10, 64); }), M.blue); border.rotation.y = Math.PI / 2; border.position.x = 0.075 * s; g.add(border);
        var plate = new THREE.Mesh(geo('earPlate', function () { return new THREE.CylinderGeometry(0.2, 0.2, 0.02, 56); }), M.white); plate.rotation.z = Math.PI / 2; plate.position.x = 0.085 * s; g.add(plate);
        var rg = new THREE.Mesh(geo('earRing', function () { return new THREE.TorusGeometry(0.215, 0.03, 12, 64); }), M.ring); rg.rotation.y = Math.PI / 2; rg.position.x = 0.09 * s; g.add(rg);
      });

      var arms = [-1, 1].map(function (s) {
        if (pv.deco === 'cogbody') return new THREE.Group();   /* Arco: the hands are teeth of the wheel (the right one still waves, see below) */
        var piv = new THREE.Group(); piv.position.set(0.93 * s, -0.28, 0.05); rig.add(piv);
        piv.add(cast(new THREE.Mesh(geo('joint', function () { return new THREE.SphereGeometry(0.125, 32, 24); }), M.blue)));
        var arm = cast(new THREE.Mesh(geo('arm', function () { return new THREE.CapsuleGeometry(0.105, 0.3, 10, 24); }), M.white)); arm.position.y = -0.22; piv.add(arm);
        piv.rotation.z = 0.7 * s; piv.userData.rest = 0.7 * s; return piv;
      });

      [-1, 1].forEach(function (s) {
        if (pv.flat && pv.deco !== 'nutbody') return;   /* the cog and the wrench have feet in their outline; the nut uses Elio's pods */
        var g = new THREE.Group(); g.position.set(0.36 * s, -0.8, 0.1); g.rotation.set(-0.15, 0, 0.12 * s); rig.add(g);
        var pod = cast(new THREE.Mesh(geo('leg', buildLegGeo), M.body)); pod.scale.set(0.22, 0.28, 0.24); pod.position.y = -0.1; g.add(pod);
        var gr = new THREE.Mesh(geo('legRing', function () { return new THREE.TorusGeometry(0.213, 0.014, 8, 48); }), M.ring);
        gr.rotation.x = Math.PI / 2; gr.scale.set(1, 1.09, 1); gr.position.y = -0.1 + 0.28 * -0.25; g.add(gr);
      });

      var btn = cast(new THREE.Mesh(geo('btn', function () { return new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32); }), M.visor));
      if (pv.flat) {   /* the carved button: a small domed button inside a darker ring groove, set into the trousers */
        var bz = pv.flatZ + 0.005, bg = new THREE.Mesh(geo('btnGroove', function () { return new THREE.RingGeometry(0.075, 0.105, 40); }), M.seamBlue);
        bg.position.set(0, pv.btnY, bz); rig.add(bg);
        btn.rotation.x = Math.PI / 2; btn.scale.set(0.8, 1, 0.8); btn.position.set(0, pv.btnY, bz + 0.004); rig.add(btn);
      } else { btn.position.set(0, -0.55, 0.77); btn.rotation.x = Math.PI / 2 + 0.5; rig.add(btn); }

      var antenna = new THREE.Group(); antenna.position.set(0.14, 0.9, -0.05); antenna.rotation.z = -0.28; if (!pv.flat || pv.deco === 'nutbody') rig.add(antenna);   /* the cog and the wrench have their own; the nut keeps Elio's */
      var stem = new THREE.Mesh(geo('stem', function () { return new THREE.CylinderGeometry(0.016, 0.02, 0.5, 16); }), M.stem); stem.position.y = 0.25; antenna.add(stem);
      var bulb = new THREE.Group(); bulb.position.y = 0.55; antenna.add(bulb);
      bulb.add(new THREE.Mesh(geo('bulbC', function () { return new THREE.SphereGeometry(0.075, 24, 18); }), M.bulbCore));
      bulb.add(new THREE.Mesh(geo('bulbS', function () { return new THREE.SphereGeometry(0.105, 32, 24); }), M.bulbShell));
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(0.7, 0.7, 1); bulb.add(halo);
      var bulbLight = new THREE.PointLight(pv.light, 2, 3); bulb.add(bulbLight);
      /* Volt and Mesh: two antennae leaning outward and swaying on their own (Volt's on each side of the jaw, Mesh's on its two top teeth) */
      var twinAnt = [];
      if (pv.deco === 'wrenchbody' || pv.deco === 'cogbody') [-1, 1].forEach(function (sd) {
        var g = new THREE.Group(); g.position.set((pv.deco === 'cogbody' ? 0.46 : 0.56) * sd, pv.deco === 'cogbody' ? 1.04 : 0.68, -0.02); g.rotation.z = -0.38 * sd; g.userData.side = sd; rig.add(g);
        var st = new THREE.Mesh(geo('stem', function () { return new THREE.CylinderGeometry(0.016, 0.02, 0.5, 16); }), M.stem); st.position.y = 0.25; g.add(st);
        var bb = new THREE.Group(); bb.position.y = 0.55; g.add(bb);
        bb.add(new THREE.Mesh(geo('bulbC', function () { return new THREE.SphereGeometry(0.075, 24, 18); }), M.bulbCore));
        bb.add(new THREE.Mesh(geo('bulbS', function () { return new THREE.SphereGeometry(0.105, 32, 24); }), M.bulbShell));
        var hl = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); hl.scale.set(0.6, 0.6, 1); bb.add(hl);
        twinAnt.push(g);
      });

      var shadow = new THREE.Mesh(geo('blob', function () { return new THREE.PlaneGeometry(2.6, 2.6); }), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.6; group.add(shadow);

      var wakeT = 0, seen = false, sl = 0, tx = 0, ty = 0, hopY = 0, hopV = 0, squash = 0, squashV = 0, waveT = -1, blinkT = 0, nextBlink = 1 + Math.random() * 3, phase = Math.random() * 6.28, amp = reduce ? 0.3 : 1;
      return {
        group: group, root: root,
        hop: function (p) { if (sl < 0.5 && hopY < 0.02) { hopV = p || 5.2; squashV = -2; } },
        /* wake: starts from asleep, stretches awake, then hops and waves hello */
        wake: function () { sl = 1; wakeT = 0.4; },
        wave: function () { if (sl > 0.5) return; waveT = 0; this.hop(3.6); },
        update: function (t, dt, mx, my, asleep) {
          t += phase;
          /* asleep: ignores the cursor, head sunk, eyes shut, arms and antenna drooping, slow shallow breathing */
          if (!seen) { seen = true; sl = asleep ? 1 : 0; }
          sl += ((asleep ? 1 : 0) - sl) * Math.min(1, dt * 3);
          if (wakeT > 0) { wakeT -= dt; if (wakeT <= 0 && !asleep) this.wave(); } mx *= 1 - sl; my = my * (1 - sl) + 0.9 * sl;
          tx += (mx - tx) * Math.min(1, dt * 5); ty += (my - ty) * Math.min(1, dt * 5);
          root.rotation.y = tx * 0.5 + Math.sin(t * 0.7) * 0.08 * amp; root.rotation.x = ty * 0.22; root.rotation.z = -tx * 0.05;
          hopV -= 16 * dt; hopY += hopV * dt;
          if (hopY < 0) { if (hopV < -1) squashV = hopV * 0.14; hopY = 0; hopV = 0; }
          squashV += (-120 * squash - 9 * squashV) * dt; squash += squashV * dt;
          var stretch = C(hopV * 0.025, -0.08, 0.12), sy = 1 + stretch - squash, sxz = 1 / Math.sqrt(Math.max(sy, 0.5));
          rig.scale.set(sxz, sy, sxz);
          var bob = Math.sin(t * 1.7) * 0.07 * amp * (1 - 0.55 * sl); rig.position.y = 0.2 + bob + hopY - (1 - sy) * 0.9;
          var h = Math.max(0, bob + hopY); shadow.scale.setScalar(1 - h * 0.18); shadow.material.opacity = 1 - h * 0.25;
          twinAnt.forEach(function (g, gi) { g.rotation.z = -0.38 * g.userData.side - 0.4 * sl * g.userData.side + Math.sin(t * 3.1 + gi * 1.7) * 0.06 * amp - hopV * 0.02 * g.userData.side; });
          antenna.rotation.z = -0.28 - 0.4 * sl - tx * 0.18 + Math.sin(t * 3.1) * 0.06 * amp - hopV * 0.025; antenna.rotation.x = Math.cos(t * 2.3) * 0.05 * amp;
          bulbLight.intensity = (1.8 + Math.sin(t * 3) * 0.5) * (1 - 0.75 * sl); halo.scale.setScalar(0.7 + Math.sin(t * 3) * 0.06);
          var a0 = arms[0], a1 = arms[1];
          a0.rotation.z = a0.userData.rest + 0.3 * sl - Math.sin(t * 1.7 + 1) * 0.06 * amp - hopY * 0.3;
          var wz = a1.userData.rest - 0.3 * sl + Math.sin(t * 1.7) * 0.06 * amp + hopY * 0.3;
          if (waveT >= 0) { waveT += dt; wz = THREE.MathUtils.lerp(wz, 2.6 + Math.sin(waveT * 14) * 0.28, Math.sin(Math.min(waveT / 0.35, 1) * Math.PI / 2)); if (waveT > 2.2) waveT = -1; }
          a1.rotation.z += (wz - a1.rotation.z) * Math.min(1, dt * 12);
          nextBlink -= dt; if (nextBlink < 0 && sl < 0.5) { blinkT = 0.0001; nextBlink = 2 + Math.random() * 3; }
          var bl = 1; if (blinkT > 0) { blinkT += dt; bl = 1 - Math.sin(Math.min(blinkT / 0.16, 1) * Math.PI) * 0.92; if (blinkT > 0.16) blinkT = 0; }
          bl = bl * (1 - sl) + 0.06 * sl; eyes.forEach(function (g) { g.scale.y = bl; });
          if (holeMorph) {
            var wv = waveT >= 0 ? Math.sin(Math.min(waveT / 0.35, 1) * Math.PI / 2) : 0;
            /* the hand waves in place: it stretches a little and wiggles, never sweeping over its neighbours */
            holeMorph(0, 1, -5 + (waveT >= 0 ? Math.sin(waveT * 14) * 4 * wv : 0), 0.13 * wv);
          }
          // reflections follow the light: they slide as the assistant turns, tilts, bobs or jumps
          var ry = root.rotation.y, rx = root.rotation.x;
          glintTex.offset.set(0.1 + C(ry * 0.2, -0.095, 0.095) + Math.sin(t * 1.7) * 0.008, 0.1 - C(rx * 0.45, -0.095, 0.095) + Math.cos(t * 1.7) * 0.006);
          liquidTex.offset.set(0.1 + C(ry * 0.09, -0.05, 0.05), 0.1 + C(hopV * 0.006 - rx * 0.12, -0.06, 0.06) + Math.sin(t * 1.7) * 0.007);
        }
      };
    }

    /* ----- slots: every [data-robot] element gets an assistant drawn inside its box ----- */
    var slots = [].slice.call(document.querySelectorAll(opts.selector || '[data-robot]')).map(function (el) {
      var kind = el.getAttribute('data-robot');
      var vm = /^a(\d)$/.exec(kind), vr = el.getAttribute('data-variant');   /* a0..a4 = the five assistants; data-variant overrides */
      return { el: el, id: kind, hi: (opts.hi || []).indexOf(kind) > -1, inst: null, insts: {}, wakeReq: false, variant: vr !== null ? +vr : (vm ? +vm[1] : 0), mx: 0, my: 0, greet: (opts.greet || []).indexOf(kind) > -1 };
    });
    var byId = {}; slots.forEach(function (s) { byId[s.id] = s; });
    var px = window.innerWidth / 2, py = window.innerHeight / 2;
    window.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
    function resize() { renderer.setSize(fg.clientWidth, fg.clientHeight, false); }
    window.addEventListener('resize', resize); resize();

    function el_variant(s) { var v = s.el.getAttribute('data-variant'); return v !== null ? +v : s.variant; }
    function render(t, dt) {
      var H = fg.clientHeight, W = fg.clientWidth;
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      slots.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (r.width < 24 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
        var op = opts.opacityOf ? opts.opacityOf(s.el) : 1; if (op < 0.03) return;
        /* an asleep assistant is drawn by its grey twin; when it wakes the coloured one takes over (and says hello) */
        var vr = el_variant(s), asleep = opts.asleepOf ? opts.asleepOf(s.el) : false, vi = vr + (asleep ? 10 : 0);
        if (!s.insts[vi]) { s.insts[vi] = createRobot(s.hi, vi); if (s.greet && !asleep) s.insts[vi].wave(); }
        s.inst = s.insts[vi];
        if (s.wakeReq && !asleep) { s.inst.wake(); s.wakeReq = false; }
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        s.inst.update(t, dt, C((px - cx) / (W * 0.3), -1.4, 1.4), C((py - cy) / (H * 0.3), -1.4, 1.4), asleep);
        camera.aspect = r.width / r.height;
        var fov = THREE.MathUtils.degToRad(camera.fov), dH = (4.1 / 2) / Math.tan(fov / 2), dW = (2.7 / camera.aspect) / 2 / Math.tan(fov / 2);
        camera.position.set(0, 0.3, Math.max(dH, dW, 6.2)); camera.lookAt(0, 0.1, 0); /* headroom above: the antenna and hops must not clip at the slot edge */ camera.updateProjectionMatrix();
        renderer.setViewport(r.left, H - r.bottom, r.width, r.height); renderer.setScissor(r.left, H - r.bottom, r.width, r.height);
        s.inst.group.visible = true; s.inst.group.scale.setScalar(0.88 + 0.12 * op);
        renderer.render(scene, camera);
        s.inst.group.visible = false;
      });
    }
    var last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.max(0, Math.min((now - last) / 1000, 0.05)); last = now;
      try { render(now / 1000, dt); } catch (e) { if (window.console) console.error(e); }
    })(last);
    return {
      hop: function (id) { var s = byId[id]; if (s && s.inst) s.inst.hop(); },
      wave: function (id) { var s = byId[id]; if (s && s.inst) s.inst.wave(); },
      wake: function (id) { var s = byId[id]; if (s) s.wakeReq = true; },
      /* light page backgrounds: a lower exposure turns the white shell into a soft grey so the assistant keeps its contrast */
      setLight: function (on) { renderer.toneMappingExposure = on ? 0.74 : 1.0; }
    };
  }
  global.UltranovaRobots = { init: init };
})(window);
