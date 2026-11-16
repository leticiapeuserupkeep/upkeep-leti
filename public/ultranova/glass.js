/* Ranger glass shape: soft glass that slowly changes shape (it's alive, it doesn't just float).
   Requires three.js r152 (global THREE), same as robot.js.

     <canvas class="un-glass"></canvas>
     UltranovaGlass.mount(canvas)                    → wave (default): one wide glass ribbon that undulates and folds in the middle
     UltranovaGlass.mount(canvas, { shape: 'ring' }) → a glass ring that keeps turning into new soft forms
       options: rotate [x, y, z], offset [x, y], scale, start (the moment of the loop it starts at)
     → { stop() }

   Shape: every piece is a tube around a curve. Each frame the curve, the tube's thickness and how flat it is are
   recomputed from a few slow sine waves with unrelated periods, so it never repeats exactly.
     wave   one wide ribbon goes from edge to edge (a bit past them) and folds over itself in the middle.
     ring   one closed loop: a soft triangle, a twisted band, a stretched loop…
   Look: a small glass shader instead of physical transmission (which turns milky on a light page): clear lavender
   where the surface faces you, blue → violet → orchid toward the edges (blue on the left, orchid on the right),
   an indigo rim, studio reflections and highlights. Back faces are drawn first and fainter, so you see through the
   glass. Prototype only. */
(function (global) {
  'use strict';

  var RAD = 40;          /* points around each tube */
  var SPEED = 0.18;      /* lower = slower (very slow: it's a background, it shouldn't pull the eye) */

  /* ---------- ring ---------- */
  var RING = {
    seg: 280, closed: true, span: 1,
    center: function (u, t, o) {
      var a = u * Math.PI * 2;
      var r = 1 + 0.2 * Math.sin(3 * a + 0.5 * Math.sin(t * 0.31)) + 0.06 * Math.sin(2 * a - t * 0.23 + 1.7) + 0.02 * Math.sin(5 * a + t * 0.17);   /* the triangle stays; it only sways */
      o.x = r * Math.cos(a);
      o.y = r * Math.sin(a) * (0.88 + 0.05 * Math.sin(t * 0.13));
      o.z = 0.4 * Math.sin(2 * a + 0.6 * Math.sin(t * 0.27)) + 0.08 * Math.sin(3 * a - t * 0.19);
      return o;
    },
    thick: function (u, t) { var a = u * Math.PI * 2; return 0.3 + 0.05 * Math.sin(2 * a + t * 0.37) + 0.025 * Math.sin(3 * a - t * 0.29 + 0.8); },
    flat: function (u, t) { return 0.66 + 0.14 * Math.sin(u * Math.PI * 2 + t * 0.21); }
  };

  /* ---------- wave: one wide glass ribbon that crosses the canvas and folds over itself in the middle ----------
     The fold is a half turn of the ribbon around its own length, packed into the center: on the left you see one
     face, on the right the other. The fold drifts a little left and right and the wave travels sideways. */
  function wave() {
    return {
      seg: 360, closed: false, span: 0,   /* span (half width) is set from the camera */
      center: function (u, t, o) {
        var x = (u * 2 - 1) * this.span;
        o.x = x;
        o.y = -0.2 + 0.5 * Math.sin(x * 0.7 + t * 0.35) + 0.2 * Math.sin(x * 1.3 - t * 0.24 + 1.2);
        o.z = 0.3 * Math.sin(x * 0.55 + t * 0.2);
        return o;
      },
      thick: function (u, t) { var x = (u * 2 - 1) * this.span; return 0.42 + 0.06 * Math.sin(x * 0.8 + t * 0.3); },   /* a wide ribbon */
      flat: function () { return 0.3; },                                                                              /* …and thin */
      roll: function (u, t) {
        var x = (u * 2 - 1) * this.span, c = 0.35 * Math.sin(t * 0.18);         /* where the fold sits */
        var k = Math.tanh((x - c) / 0.55);                                         /* -1 → 1 across the fold */
        return 0.35 + (k + 1) * 0.5 * Math.PI + 0.25 * Math.sin(x * 0.6 + t * 0.25);
      }
    };
  }

  var VERT = [
    'varying vec3 vN; varying vec3 vV; varying vec3 vP;',
    'void main() {',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');
  var FRAG = [
    'uniform float uT; uniform float uSide; uniform float uSpan;',
    'varying vec3 vN; varying vec3 vV; varying vec3 vP;',
    'void main() {',
    '  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;',
    '  float f = 1.0 - abs(dot(N, vV));                        // 0 facing you, 1 at the edge',
    '  vec3 indigo = vec3(0.16, 0.08, 0.86), blue = vec3(0.30, 0.30, 1.0), violet = vec3(0.56, 0.30, 1.0);',
    '  vec3 orchid = vec3(0.80, 0.42, 1.0), lilac = vec3(0.76, 0.73, 1.0), blush = vec3(0.92, 0.78, 1.0);',
    /* where the glass is: blue on the left and bottom, violet → orchid toward the right, drifting slowly */
    '  float side = clamp(0.5 + 0.55 * (vP.x / uSpan * 0.8 - vP.y * 0.25) + 0.18 * sin(vP.z * 2.0 + uT * 0.3), 0.0, 1.0);',
    '  vec3 edge = mix(blue, violet, smoothstep(0.15, 0.6, side));',
    '  edge = mix(edge, orchid, smoothstep(0.6, 1.0, side) * 0.8);',
    '  vec3 body = mix(lilac, blush, smoothstep(0.55, 1.0, side) * 0.7);   // the clear part: cool lilac, pinker on the right',
    '  vec3 col = mix(body, edge, smoothstep(0.05, 0.68, f));',
    '  vec3 ink = vec3(0.05, 0.03, 0.20);                                      // near-black navy, like the reference',
    '  col = mix(col, indigo, smoothstep(0.78, 0.95, f) * 0.85);              // deep indigo toward the rim',
    '  col = mix(col, ink, smoothstep(0.88, 1.0, f) * 0.8);                   // and almost black right at it',
    /* glass: the reflection of a bright studio (soft bands) and a few dark refracted lines inside */
    '  vec3 R = reflect(-vV, N);',
    /* glass = what it reflects: a big soft light above (softbox), a dark studio floor below with a crisp horizon,
       and a thin light strip on the side. Each is a single soft shape, so no repeating stripes. */
    '  float bright = smoothstep(0.45, 0.8, R.y) * (0.15 + 0.85 * f);                       // softbox above',
    '  float strip = smoothstep(0.55, 0.8, R.x) * smoothstep(0.35, 0.0, abs(R.y - 0.05)) * f; // light strip on the right',
    '  float dark = smoothstep(-0.12, -0.32, R.y) * smoothstep(0.15, 0.6, f);               // dark floor, with a crisp horizon',
    '  float dark2 = smoothstep(-0.55, -0.85, R.x) * smoothstep(0.3, 0.8, f) * 0.6;          // a darker wall on the left',
    '  col = mix(col, ink, max(dark * 0.8, dark2));',
    '  float s1 = pow(max(dot(R, normalize(vec3(-0.45, 0.75, 0.55))), 0.0), 90.0);   // sharp highlight, top left',
    '  float s2 = pow(max(dot(R, normalize(vec3(0.55, -0.25, 0.8))), 0.0), 22.0) * 0.4; // soft one, bottom right',
    '  float rim = pow(f, 6.0) * smoothstep(0.4, 1.0, side) * 0.5;               // pink-white sheen on the right edge',
    '  col += vec3(1.0) * (s1 + s2 + bright * 0.45 + strip * 0.5) + vec3(1.0, 0.85, 1.0) * rim;',
    '  float a = mix(0.08, 0.92, smoothstep(0.05, 0.85, f)) + s1 + s2 * 0.6 + bright * 0.35 + strip * 0.4 + dark * 0.7 + dark2 * 0.6 + rim;',
    '  gl_FragColor = vec4(min(col, 1.0), clamp(a * uSide, 0.0, 1.0));',
    '}'
  ].join('\n');

  function glassMaterial(side, strength) {
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, side: side,
      uniforms: { uT: { value: 0 }, uSide: { value: strength }, uSpan: { value: 1 } },
      transparent: true, depthWrite: false
    });
  }

  /* one tube: fixed topology, positions rewritten every frame from its shape functions */
  function Tube(shape) {
    var seg = shape.seg, pos = new Float32Array((seg + 1) * (RAD + 1) * 3), idx = [];
    for (var i = 0; i < seg; i++) for (var j = 0; j < RAD; j++) {
      var a = i * (RAD + 1) + j, b = (i + 1) * (RAD + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    var geo = new THREE.BufferGeometry();
    geo.setIndex(idx);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var C = new THREE.Vector3(), P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), Q = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
    function build(t) {
      for (var i = 0; i <= seg; i++) {
        var u = i / seg, e = 0.0015;
        shape.center(u, t, C); shape.center(u + e, t, P);
        T.subVectors(P, C).normalize();
        N.crossVectors(T, Z).normalize();
        B.crossVectors(N, T).normalize();
        if (shape.roll) {   /* turn the cross-section around the curve (the wave's fold) */
          var ph = shape.roll(u, t), cr = Math.cos(ph), sr = Math.sin(ph);
          Q.copy(N).multiplyScalar(cr).addScaledVector(B, sr); B.multiplyScalar(cr).addScaledVector(N, -sr); N.copy(Q);
        }
        var r = shape.thick(u, t), fl = shape.flat(u, t);
        if (!shape.closed) r *= Math.min(1, Math.min(u, 1 - u) * 14 + 0.25);   /* open ends round off (they sit past the edges) */
        for (var j = 0; j <= RAD; j++) {
          var v = (j / RAD) * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v), k = ((i * (RAD + 1)) + j) * 3;
          pos[k]     = C.x + r * (cv * N.x + fl * sv * B.x);
          pos[k + 1] = C.y + r * (cv * N.y + fl * sv * B.y);
          pos[k + 2] = C.z + r * (cv * N.z + fl * sv * B.z);
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    }
    return { geo: geo, build: build };
  }

  function mount(canvas, opts) {
    opts = opts || {};
    var isRing = opts.shape === 'ring';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });   /* default premultiplied alpha: three blends into a premultiplied buffer */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, isRing ? 6.4 : 4.2);

    var shapes = isRing ? [RING] : [wave()];
    var back = glassMaterial(THREE.BackSide, 0.45), front = glassMaterial(THREE.FrontSide, 1);
    var group = new THREE.Group(), tubes = [];
    shapes.forEach(function (s, n) {
      var tb = Tube(s); tubes.push(tb);
      var mb = new THREE.Mesh(tb.geo, back), mf = new THREE.Mesh(tb.geo, front);
      mb.renderOrder = n * 2; mf.renderOrder = n * 2 + 1;
      group.add(mb, mf);
    });
    /* pose: opts.rotate [x, y, z] (radians), opts.offset [x, y] (scene units), opts.scale, opts.start (time it starts at) */
    var rot = opts.rotate || (isRing ? [-0.35, 0.25, -0.2] : null);
    if (opts.offset) group.position.set(opts.offset[0], opts.offset[1], 0);
    if (opts.scale) group.scale.setScalar(opts.scale);
    if (isRing) group.rotation.set(rot[0], rot[1], rot[2]);
    else group.rotation.set(-0.25, 0, 0);   /* seen a little from above, so the ribbons show their width */
    group.userData.rz = rot ? rot[2] : 0;
    scene.add(group);

    function size() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      if (!isRing) {
        var halfW = Math.tan(camera.fov * Math.PI / 360) * camera.position.z * camera.aspect;
        shapes.forEach(function (s) { s.span = halfW * 1.15; });          /* the ribbons run a bit past both edges */
        back.uniforms.uSpan.value = front.uniforms.uSpan.value = halfW;
      }
    }
    size();
    var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(canvas);

    var raf = 0, t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000 * SPEED + (opts.start != null ? opts.start : 4);
      tubes.forEach(function (tb) { tb.build(t); });
      back.uniforms.uT.value = front.uniforms.uT.value = t;
      if (isRing) group.rotation.z = group.userData.rz + 0.06 * Math.sin(t * 0.11);   /* sways around its base angle */
      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return { group: group, stop: function () { cancelAnimationFrame(raf); if (ro) ro.disconnect(); renderer.dispose(); tubes.forEach(function (tb) { tb.geo.dispose(); }); back.dispose(); front.dispose(); } };
  }

  global.UltranovaGlass = { mount: mount };
})(window);
