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
    var EYE = { x: 0.3, y: 0.27, rx: 0.21, ry: 0.235 }, DEPE = 0.022;
    var SC1 = 1 - DEP, SC2 = SC1 * (1 - DEPE);
    function eyeT(wx, wy, s) { return Math.sqrt(Math.pow((wx - EYE.x * s) / EYE.rx, 2) + Math.pow((wy - EYE.y) / EYE.ry, 2)); }
    function bodyZ(px, py) { var yU = py / 0.95, k = 1 + 0.05 * yU, v = 1 - Math.pow(px / k, 2) - yU * yU; return v > 0 ? 0.92 * Math.sqrt(v) : 0; }
    function facePt(px, py) { return SC1 * bodyZ(px / SC1, py / SC1); }
    function eyeFloor(px, py) { return SC2 * bodyZ(px / SC2, py / SC2); }
    function sgnPow(v, p) { return Math.sign(v) * Math.pow(Math.abs(v), p); }
    function plateEdge(th) { return [PLATE.a * sgnPow(Math.cos(th), 2 / PLATE.n), PLATE.cy + PLATE.b * sgnPow(Math.sin(th), 2 / PLATE.n)]; }

    function buildBody(segW, segH) {
      var geo = new THREE.SphereGeometry(1, segW, segH), pos = geo.attributes.position, cols = [];
      var cWhite = new THREE.Color(WHITE), cWS = new THREE.Color('#c9dcf0'), cBlue = new THREE.Color(BLUE), cBS = new THREE.Color('#1f6fc4'), cA = new THREE.Color(), cB = new THREE.Color();
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        var lit = SM(-0.35 * x + 0.55 * y + 0.45 * z, -0.5, 0.75);
        cA.copy(cWS).lerp(cWhite, lit); cB.copy(cBS).lerp(cBlue, lit);
        cA.lerp(cB, 1 - SM(y, -0.36, -0.3)); cols.push(cA.r, cA.g, cA.b);
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
        pts.push(new THREE.Vector3(r * k * Math.sin(th) * 1.003, 0.95 * yU, 0.92 * r * Math.cos(th) * 1.003));
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
        v.push(px - ex, py - ey, eyeFloor(px, py) + 0.0012); uv.push(0.5 + 0.5 * r * Math.cos(th), 0.5 + 0.5 * r * Math.sin(th));
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
          var scv = SC1 * (1 - DEPE * (1 - SM(te, 0.9, 1.07)));
          v.push(px - ex, py - EYE.y, scv * bodyZ(px / scv, py / scv) + 0.0014);
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
        var w = new THREE.Color(WHITE).lerp(new THREE.Color('#c9dcf0'), 1 - lit2), b = new THREE.Color(BLUE).lerp(new THREE.Color('#1f6fc4'), 1 - lit2);
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
    var liquidSrc = canvasTex(function (x) {
      var y0 = WY(0.5), g = x.createLinearGradient(0, y0, 0, EH);
      g.addColorStop(0, 'rgba(20,90,225,0)'); g.addColorStop(0.16, 'rgba(20,95,232,0.55)'); g.addColorStop(0.5, 'rgba(22,110,238,0.62)'); g.addColorStop(1, 'rgba(42,166,245,0.95)');
      x.fillStyle = g; x.fillRect(0, y0, EW, EH - y0);
      x.save(); x.translate(WX(0.46), WY(0.9)); x.scale(1, 0.5);
      var gl = x.createRadialGradient(0, 0, 0, 0, 0, EW * 0.8 * 0.46); gl.addColorStop(0, 'rgba(120,225,255,0.95)'); gl.addColorStop(0.55, 'rgba(60,175,255,0.55)'); gl.addColorStop(1, 'rgba(40,150,255,0)');
      x.fillStyle = gl; x.fillRect(-EW, -EW, 2 * EW, 2 * EW); x.restore();
    });
    var glintSrc = canvasTex(function (x) {
      x.fillStyle = '#3a9cf0'; x.beginPath(); x.arc(WX(0.7), WY(0.5), EW * 0.8 * 0.04, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(120,200,255,0.5)'; x.beginPath(); x.arc(WX(0.77), WY(0.8), EW * 0.8 * 0.05, 0, Math.PI * 2); x.fill();
      x.save(); x.translate(WX(0.66), WY(0.2)); x.rotate(-0.55); x.scale(1, 0.72);
      var hg = x.createRadialGradient(0, 0, 0, 0, 0, EW * 0.8 * 0.17); hg.addColorStop(0, 'rgba(236,239,246,0.95)'); hg.addColorStop(0.78, 'rgba(226,231,241,0.9)'); hg.addColorStop(1, 'rgba(226,231,241,0)');
      x.fillStyle = hg; x.beginPath(); x.arc(0, 0, EW * 0.8 * 0.17, 0, Math.PI * 2); x.fill(); x.restore();
    });
    function decalMat(map, alpha, po) { return new THREE.MeshBasicMaterial({ map: map, alphaMap: alpha, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: po, polygonOffsetUnits: po }); }
    var eyeBaseMat = decalMat(eyeBase, null, -2);

    /* ----- lazily built shared geometry ----- */
    var G = {};
    function geo(name, make) { return G[name] || (G[name] = make()); }
    function mouthPts() {
      return geo('mouthPts', function () {
        var pts = [], MR = 0.1, MCY = 0.04;
        for (var j = 0; j <= 32; j++) { var phi = -0.85 * Math.PI + 0.7 * Math.PI * (j / 32), x = MR * 1.1 * Math.cos(phi), y = MCY + MR * Math.sin(phi); pts.push(new THREE.Vector3(x, y, facePt(x, y) - 0.005)); }
        return pts;
      });
    }

    /* ----- one assistant ----- */
    function createRobot(hi) {
      var group = new THREE.Group(); group.visible = false; scene.add(group);
      var root = new THREE.Group(), rig = new THREE.Group(); group.add(root); root.add(rig);
      function cast(m) { m.castShadow = hi; m.receiveShadow = hi; return m; }

      var body = cast(new THREE.Mesh(hi ? geo('bodyHi', function () { return buildBody(384, 288); }) : geo('bodyLo', function () { return buildBody(176, 132); }), M.body));
      body.scale.set(1, 0.95, 0.92); rig.add(body);
      rig.add(new THREE.Mesh(geo('seamA', function () { return seamGeo(-0.33, 0, 0, true, 0.011); }), M.seamBlue));
      rig.add(new THREE.Mesh(geo('seamB', function () { return seamGeo(0.8, -1.25, 1.25, false, 0.007); }), M.seam));

      var face = new THREE.Group(); rig.add(face);
      face.add(new THREE.Mesh(geo('hair1', function () { return hairGeo(1.0, 0.0032, false); }), M.hair1));
      face.add(new THREE.Mesh(geo('hair2', function () { return hairGeo(0.93, 0.0022, true); }), M.hair2));

      var liquidTex = liquidSrc.clone(), glintTex = glintSrc.clone();
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

      var mp = mouthPts();
      face.add(new THREE.Mesh(geo('mouth', function () { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mp), 64, 0.0165, 12, false); }), M.navy));
      [mp[0], mp[mp.length - 1]].forEach(function (pt) { var cap = new THREE.Mesh(geo('cap', function () { return new THREE.SphereGeometry(0.0165, 16, 12); }), M.navy); cap.position.copy(pt); face.add(cap); });

      [-1, 1].forEach(function (s) {
        var g = new THREE.Group(); g.position.set(0.9 * s, 0.1, 0.06); g.rotation.z = -0.3 * s; rig.add(g);
        var disc = cast(new THREE.Mesh(geo('earDisc', function () { return new THREE.CylinderGeometry(0.285, 0.285, 0.16, 56); }), M.white)); disc.rotation.z = Math.PI / 2; g.add(disc);
        var border = new THREE.Mesh(geo('earBorder', function () { return new THREE.TorusGeometry(0.285, 0.022, 10, 64); }), M.blue); border.rotation.y = Math.PI / 2; border.position.x = 0.075 * s; g.add(border);
        var plate = new THREE.Mesh(geo('earPlate', function () { return new THREE.CylinderGeometry(0.2, 0.2, 0.02, 56); }), M.white); plate.rotation.z = Math.PI / 2; plate.position.x = 0.085 * s; g.add(plate);
        var rg = new THREE.Mesh(geo('earRing', function () { return new THREE.TorusGeometry(0.215, 0.03, 12, 64); }), M.ring); rg.rotation.y = Math.PI / 2; rg.position.x = 0.09 * s; g.add(rg);
      });

      var arms = [-1, 1].map(function (s) {
        var piv = new THREE.Group(); piv.position.set(0.93 * s, -0.28, 0.05); rig.add(piv);
        piv.add(cast(new THREE.Mesh(geo('joint', function () { return new THREE.SphereGeometry(0.125, 32, 24); }), M.blue)));
        var arm = cast(new THREE.Mesh(geo('arm', function () { return new THREE.CapsuleGeometry(0.105, 0.3, 10, 24); }), M.white)); arm.position.y = -0.22; piv.add(arm);
        piv.rotation.z = 0.7 * s; piv.userData.rest = 0.7 * s; return piv;
      });

      [-1, 1].forEach(function (s) {
        var g = new THREE.Group(); g.position.set(0.36 * s, -0.8, 0.1); g.rotation.set(-0.15, 0, 0.12 * s); rig.add(g);
        var pod = cast(new THREE.Mesh(geo('leg', buildLegGeo), M.body)); pod.scale.set(0.22, 0.28, 0.24); pod.position.y = -0.1; g.add(pod);
        var gr = new THREE.Mesh(geo('legRing', function () { return new THREE.TorusGeometry(0.213, 0.014, 8, 48); }), M.ring);
        gr.rotation.x = Math.PI / 2; gr.scale.set(1, 1.09, 1); gr.position.y = -0.1 + 0.28 * -0.25; g.add(gr);
      });

      var btn = cast(new THREE.Mesh(geo('btn', function () { return new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32); }), M.visor));
      btn.position.set(0, -0.55, 0.77); btn.rotation.x = Math.PI / 2 + 0.5; rig.add(btn);

      var antenna = new THREE.Group(); antenna.position.set(0.14, 0.9, -0.05); antenna.rotation.z = -0.28; rig.add(antenna);
      var stem = new THREE.Mesh(geo('stem', function () { return new THREE.CylinderGeometry(0.016, 0.02, 0.5, 16); }), M.stem); stem.position.y = 0.25; antenna.add(stem);
      var bulb = new THREE.Group(); bulb.position.y = 0.55; antenna.add(bulb);
      bulb.add(new THREE.Mesh(geo('bulbC', function () { return new THREE.SphereGeometry(0.075, 24, 18); }), M.bulbCore));
      bulb.add(new THREE.Mesh(geo('bulbS', function () { return new THREE.SphereGeometry(0.105, 32, 24); }), M.bulbShell));
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(0.7, 0.7, 1); bulb.add(halo);
      var bulbLight = new THREE.PointLight(0x1fa8ff, 2, 3); bulb.add(bulbLight);

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
      return { el: el, id: kind, hi: (opts.hi || []).indexOf(kind) > -1, inst: null, mx: 0, my: 0, greet: (opts.greet || []).indexOf(kind) > -1 };
    });
    var byId = {}; slots.forEach(function (s) { byId[s.id] = s; });
    var px = window.innerWidth / 2, py = window.innerHeight / 2;
    window.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
    function resize() { renderer.setSize(fg.clientWidth, fg.clientHeight, false); }
    window.addEventListener('resize', resize); resize();

    function render(t, dt) {
      var H = fg.clientHeight, W = fg.clientWidth;
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      slots.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (r.width < 24 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
        var op = opts.opacityOf ? opts.opacityOf(s.el) : 1; if (op < 0.03) return;
        if (!s.inst) { s.inst = createRobot(s.hi); if (s.greet) s.inst.wave(); }
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        s.inst.update(t, dt, C((px - cx) / (W * 0.3), -1.4, 1.4), C((py - cy) / (H * 0.3), -1.4, 1.4), opts.asleepOf ? opts.asleepOf(s.el) : false);
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
      wake: function (id) { var s = byId[id]; if (s && s.inst) s.inst.wake(); }
    };
  }
  global.UltranovaRobots = { init: init };
})(window);
