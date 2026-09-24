(() => {
  "use strict";
  const canvas = document.getElementById("ascii-space");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const chars = ".,:-=+*#%@";
  const particles = [];
  const field = [];
  const halo = [];
  const foreground = [];
  const turn = Math.PI * 2;
  // All orbital layers use the same positive angular direction and depth law.
  const orbitAngle = p => p.a + phase * p.speed / Math.pow(p.r, 1.5);
  let w, h, cx, cy, radius, mobile, frame = 0, last = 0, phase = 0;
  let pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;
  // Stable samples avoid flickering or regenerating the field on resize.
  let seed = 73;
  function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  for (let i = 0; i < 2600; i++) {
    particles.push({ r: 1.25 + Math.pow(random(), 1.6) * 4.7, a: random() * turn, b: random(), speed: 1 });
  }
  for (let i = 0; i < 650; i++) {
    field.push({ x: random(), y: random(), depth: random(), speed: .4 + random(), a: random() * Math.PI * 2, glyph: Math.floor(random() * chars.length) });
  }
  for (let i = 0; i < 570; i++) {
    halo.push({ r: 1.035 + Math.pow(random(), 1.8) * .34, a: random() * turn, speed: .8 + random() * .35, b: random(), wobble: random() * turn, glyph: 3 + Math.floor(random() * 7) });
  }
  for (let i = 0; i < 1050; i++) {
    foreground.push({ r: 1.18 + Math.pow(random(), 1.5) * 2.25, a: random() * turn, speed: .85 + random() * .3, b: random(), height: (random() - .5) * .16, wobble: random() * turn, glyph: 3 + Math.floor(random() * 7) });
  }
  function resize() {
    w = document.documentElement.clientWidth;
    h = innerHeight;
    mobile = w <= 700;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * (mobile ? .55 : .74);
    cy = mobile ? 220 : h * .38;
    radius = mobile ? Math.min(w * .105, 48) : Math.min(w * .061, 92);
    render();
  }
  function glyph(x, y, brightness, index) {
    if (x < -10 || x > w + 10 || y < -10 || y > h + 10) return;
    ctx.fillStyle = `rgba(225,225,225,${Math.max(0, Math.min(1, brightness))})`;
    ctx.fillText(chars[Math.min(9, Math.max(0, index))], x, y);
  }
  function render() {
    ctx.fillStyle = "#080808"; ctx.fillRect(0, 0, w, h);
    ctx.font = `${mobile ? 7 : 9}px Consolas, monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.save();
    ctx.translate(driftX, driftY);
    // Free particles travel throughout the viewport, beyond the accretion disk.
    const count = Math.min(field.length, Math.floor(w * h / (mobile ? 1700 : 2200)));
    for (let i = 0; i < count; i++) {
      const p = field[i];
      const u = ((p.x + phase * .028 * p.speed) % 1 + 1) % 1;
      const v = ((p.y - phase * .017 * p.speed) % 1 + 1) % 1;
      const edge = Math.min(1, u * 14, (1 - u) * 14, v * 14, (1 - v) * 14);
      const x = u * w + Math.sin(phase * .55 + p.a) * (12 + p.depth * 25);
      const y = v * h + Math.cos(phase * .4 + p.a) * (8 + p.depth * 18);
      glyph(x - driftX * p.depth * .6, y - driftY * p.depth * .6, edge * (.09 + p.depth * .24), p.glyph);
    }
    // Thin tilted accretion disk, masked by the circular shadow.
    const rotation = -.17, c = Math.cos(rotation), s = Math.sin(rotation);
    for (const p of particles) {
      const a = orbitAngle(p);
      const r = p.r * radius;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * .27;
      const filament = .64 + .36 * Math.sin(a * 3 + p.r * 3.4);
      const glow = Math.pow(1 - (p.r - 1.25) / 4.7, 1.5);
      const bright = (.12 + .75 * glow) * filament * (.35 + p.b * .65);
      glyph(cx + x * c - y * s, cy + x * s + y * c, bright, Math.floor(glow * 6 + p.b * 3));
    }
    ctx.fillStyle = "#080808";
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    // Irregular orbits replace concentric rows. Positive screen-space sine
    // preserves the disk's direction on both the upper and lower arcs.
    for (const p of halo) {
      const a = orbitAngle(p);
      const r = radius * (p.r + Math.sin(a * 2 + p.wobble) * .016);
      const upper = Math.max(0, -Math.sin(a));
      const falloff = 1 - (p.r - 1.035) / .4;
      const brightness = (.12 + upper * .65) * falloff * (.4 + p.b * .6);
      glyph(cx + Math.cos(a) * r, cy + Math.sin(a) * r, brightness, p.glyph);
    }
    // Only the near half passes in front of the shadow. Each particle follows
    // an actual disk orbit, with individual height and continuous turbulence.
    for (const p of foreground) {
      const a = orbitAngle(p);
      const depth = Math.sin(a);
      if (depth <= 0) continue;
      const r = radius * (p.r + Math.sin(a * 3 + p.wobble) * .035);
      const x = Math.cos(a) * r;
      const y = depth * r * .27 + radius * (p.height + Math.sin(a * 2 + p.wobble) * .025);
      const fade = Math.min(1, depth * 6) * Math.pow(1 - (p.r - 1.18) / 2.5, .8);
      glyph(cx + x * c - y * s, cy + x * s + y * c, fade * (.22 + p.b * .53), p.glyph);
    }
    ctx.restore();
  }
  function tick(time) {
    frame = 0;
    if (document.hidden || motion.matches) return;
    if (time - last >= (mobile ? 40 : 32)) {
      const dt = Math.min(time - last, 100);
      phase += dt * .00032;
      const ease = 1 - Math.exp(-dt / 180);
      driftX += ((mobile ? 0 : pointerX * 28) - driftX) * ease;
      driftY += ((mobile ? 0 : pointerY * 18) - driftY) * ease;
      last = time; render();
    }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    if (!document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    else if (motion.matches) { driftX = 0; driftY = 0; render(); }
  }
  addEventListener("pointermove", event => {
    if (mobile || motion.matches || event.pointerType === "touch") return;
    pointerX = (event.clientX / w - .5) * 2;
    pointerY = (event.clientY / h - .5) * 2;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; });
  addEventListener("blur", () => { pointerX = 0; pointerY = 0; });
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", schedule);
  resize(); schedule();
})();
