(() => {
  "use strict";

  const canvas = document.getElementById("ascii-space");
  const ctx = canvas.getContext("2d", { alpha: false });

  const chars = ["·",".",":","-","=","+","*","x","X","#","@"];
  const particles = [];
  const stars = [];
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR_CAP = 1.35;

  let w = 0, h = 0, dpr = 1;
  let centerX = 0, centerY = 0;
  let pointerX = 0, pointerY = 0;
  let last = performance.now();
  let lastFrame = 0;

  function rand(a,b){ return a + Math.random()*(b-a); }

  function resetParticle(p, initial=false){
    const sideBias = Math.random();
    p.r = rand(Math.min(w,h)*0.08, Math.max(w,h)*0.77);
    p.a = rand(0,Math.PI*2);
    p.z = rand(.28,1);
    p.speed = rand(.035,.18) * (Math.random()<.1 ? 1.8 : 1);
    p.tilt = rand(.25,.58);
    p.phase = rand(0,Math.PI*2);
    p.life = initial ? rand(0,1) : 0;
    p.char = Math.floor(rand(0,chars.length-1));
    p.bright = rand(.22,.9);
    p.drift = rand(-.0008,.0008);
  }

  function resize(){
    dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    canvas.style.width = w+"px";
    canvas.style.height = h+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);

    centerX = w * (w < 760 ? .66 : .69);
    centerY = h * .42;

    const density = Math.min(4200, Math.max(1800, Math.floor(w*h/430)));
    particles.length = 0;
    for(let i=0;i<density;i++){
      const p={}; resetParticle(p,true); particles.push(p);
    }

    stars.length = 0;
    const starCount = Math.floor(w*h/15000);
    for(let i=0;i<starCount;i++){
      stars.push({
        x:Math.random()*w,
        y:Math.random()*h,
        a:rand(.08,.34),
        c:chars[Math.floor(rand(0,6))]
      });
    }
  }

  function draw(t){
    const now = t || performance.now();
    if(now - lastFrame < 32){ requestAnimationFrame(draw); return; }
    lastFrame = now;
    const dt = Math.min(.034,(now-last)/1000 || .016);
    last = now;

    ctx.fillStyle = "#020304";
    ctx.fillRect(0,0,w,h);

    // Sparse static star field.
    ctx.font = "7px ui-monospace, SFMono-Regular, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for(const s of stars){
      ctx.fillStyle = `rgba(220,222,215,${s.a})`;
      ctx.fillText(s.c,s.x,s.y);
    }

    const px = pointerX * 15;
    const py = pointerY * 9;
    const cx = centerX + px;
    const cy = centerY + py;

    // Dark event horizon + weak halo.
    const horizon = Math.min(w,h) * .062;
    const grad = ctx.createRadialGradient(cx,cy,horizon*.2,cx,cy,horizon*2.8);
    grad.addColorStop(0,"rgba(0,0,0,1)");
    grad.addColorStop(.33,"rgba(0,0,0,1)");
    grad.addColorStop(.58,"rgba(8,9,9,.72)");
    grad.addColorStop(.74,"rgba(175,180,164,.055)");
    grad.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.arc(cx,cy,horizon*2.8,0,Math.PI*2);
    ctx.fill();

    // Tiny ASCII particles on elliptical spiral paths.
    ctx.font = `${Math.max(6,Math.min(8,w/170))}px ui-monospace, SFMono-Regular, Consolas, monospace`;

    for(const p of particles){
      if(!prefersReduced){
        const orbital = p.speed * dt * (1 + 140/(p.r+55));
        p.a += orbital + p.drift;
        p.r -= dt * (.2 + 3.2/(p.z+.2));
        p.life += dt*.05;
      }

      if(p.r < horizon*1.12 || p.r > Math.max(w,h)*.9 || p.life>1.5){
        resetParticle(p);
      }

      // Spiral perturbation creates the stretched "stream" look.
      const spiral = Math.sin(p.a*2.15 + p.phase) * Math.min(35,p.r*.07);
      const rr = p.r + spiral;
      const squeeze = p.tilt;
      const x = cx + Math.cos(p.a) * rr;
      const y = cy + Math.sin(p.a) * rr * squeeze;

      // Rotate the disk around its center.
      const rot = -.20;
      const dx=x-cx, dy=y-cy;
      const rx=cx + dx*Math.cos(rot)-dy*Math.sin(rot);
      const ry=cy + dx*Math.sin(rot)+dy*Math.cos(rot);

      if(rx<-20||rx>w+20||ry<-20||ry>h+20) continue;

      const nearHorizon = Math.exp(-Math.pow((p.r-horizon*1.75)/(horizon*1.15),2));
      const edgeFade = Math.min(1, p.r/(horizon*1.1)) * Math.max(.15,1-p.r/(Math.max(w,h)*.86));
      const alpha = Math.min(.96, (.19+p.bright*.62 + nearHorizon*.34) * edgeFade);
      const ci = Math.min(chars.length-1, Math.floor(p.char + nearHorizon*2.2));

      const shade = Math.floor(198 + 49*nearHorizon + 12*p.z);
      ctx.fillStyle = `rgba(${shade},${shade},${Math.max(175,shade-12)},${alpha})`;
      ctx.fillText(chars[ci],rx,ry);
    }

    // Hard black core on top.
    ctx.fillStyle="rgba(0,0,0,.96)";
    ctx.beginPath();
    ctx.ellipse(cx,cy,horizon*1.08,horizon*.78,-.2,0,Math.PI*2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  addEventListener("resize", resize, {passive:true});
  addEventListener("pointermove", e => {
    pointerX = (e.clientX/Math.max(1,w)-.5)*2;
    pointerY = (e.clientY/Math.max(1,h)-.5)*2;
  }, {passive:true});

  resize();
  requestAnimationFrame(draw);
})();
