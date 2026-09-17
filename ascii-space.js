(() => {
  "use strict";

  const canvas = document.getElementById("ascii-space");
  const ctx = canvas.getContext("2d", { alpha: false });

  const glyphs = ["·",".",":","-","=","+","*","x","X","#","@"];
  const particles = [];
  const stars = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w=0,h=0,dpr=1;
  let centerX=0,centerY=0;
  let mouseX=0,mouseY=0;
  let lastTime=performance.now();
  let lastFrame=0;

  let diskTilt=.48;
  let diskRotation=-.18;
  let horizon=52;
  let maxRadius=700;

  const rand=(a,b)=>a+Math.random()*(b-a);

  function mobile(){
    return w < 650;
  }

  function resetParticle(p, initial=false){
    // More samples toward the inner half of the disk, where the spiral
    // should visually read as a coherent accretion flow.
    const u=Math.random();
    const inner=horizon*1.12;
    const radialExponent=mobile()?1.16:.72;
    p.r=inner+(maxRadius-inner)*Math.pow(u,radialExponent);
    p.a=rand(0,Math.PI*2);
    p.phase=rand(0,Math.PI*2);
    p.lane=rand(-1,1);
    p.depth=rand(.35,1);
    p.speed=rand(.045,.145)*(Math.random()<.08?1.7:1);
    p.glyph=Math.floor(rand(0,glyphs.length-.01));
    p.brightness=rand(.20,.88);
    p.life=initial?rand(0,.9):0;
  }

  function resize(){
    dpr=Math.min(devicePixelRatio||1,mobile()?1.15:1.35);
    w=innerWidth;
    h=innerHeight;

    canvas.width=Math.floor(w*dpr);
    canvas.height=Math.floor(h*dpr);
    canvas.style.width=w+"px";
    canvas.style.height=h+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);

    if(mobile()){
      // Mobile composition is deliberately different from desktop:
      // keep the hole fully visible, flatter, and recognisable as a disk
      // instead of a bright circular cluster.
      centerX=w*.755;
      centerY=h*.265;
      diskTilt=.36;
      diskRotation=-.16;
      horizon=Math.max(33,Math.min(w,h)*.096);
      maxRadius=Math.max(w,h)*.82;
    }else{
      centerX=w*.705;
      centerY=h*.405;
      diskTilt=.46;
      diskRotation=-.19;
      horizon=Math.min(w,h)*.070;
      maxRadius=Math.max(w,h)*.72;
    }

    // Keep phones substantially cheaper than desktop.
    const target=mobile()
      ? Math.min(2050,Math.max(1150,Math.floor(w*h/255)))
      : Math.min(3900,Math.max(1900,Math.floor(w*h/450)));

    particles.length=0;
    for(let i=0;i<target;i++){
      const p={};
      resetParticle(p,true);
      particles.push(p);
    }

    stars.length=0;
    const starCount=Math.floor(w*h/(mobile()?35000:28500));
    for(let i=0;i<starCount;i++){
      stars.push({
        x:Math.random()*w,
        y:Math.random()*h,
        alpha:rand(.035,.17),
        char:glyphs[Math.floor(rand(0,5))]
      });
    }
  }

  function project(radius,angle,lane=0){
    // All streams share one disk plane. A small lane warp creates separate
    // filaments without making the black hole and disk look unrelated.
    const warp=1+Math.sin(angle*2.2+lane*2.6)*.026;
    const rr=radius*warp;
    const localTilt=diskTilt+lane*.025;

    let x=Math.cos(angle)*rr;
    let y=Math.sin(angle)*rr*localTilt;

    // Thin spiral filament displacement, strongest farther from the core.
    const filament=Math.sin(angle*3.15+lane*5.5)*Math.min(10,rr*.012);
    y+=filament;

    const c=Math.cos(diskRotation),s=Math.sin(diskRotation);
    return {
      x:centerX+x*c-y*s,
      y:centerY+x*s+y*c
    };
  }

  function drawCore(cx,cy){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(diskRotation);

    // A black shadow, not a grey circular halo: it visually merges the
    // event horizon with the inner edge of the same projected disk.
    ctx.shadowColor="rgba(0,0,0,.95)";
    ctx.shadowBlur=Math.max(8,horizon*.22);
    ctx.fillStyle="#000";
    ctx.beginPath();
    ctx.ellipse(0,0,horizon*1.08,horizon*.73,0,0,Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  function draw(time){
    const now=time||performance.now();
    const fpsGap=mobile()?40:32; // ~25 FPS phone, ~30 FPS desktop

    if(now-lastFrame<fpsGap){
      requestAnimationFrame(draw);
      return;
    }

    lastFrame=now;
    const dt=Math.min(.05,(now-lastTime)/1000||.033);
    lastTime=now;

    ctx.fillStyle="#020304";
    ctx.fillRect(0,0,w,h);

    // Very sparse background field. The visible structure should be the disk,
    // not a uniform cloud of random characters.
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font=`${mobile()?6:7}px ui-monospace, SFMono-Regular, Consolas, monospace`;

    for(const star of stars){
      ctx.fillStyle=`rgba(218,220,211,${star.alpha})`;
      ctx.fillText(star.char,star.x,star.y);
    }

    const cx=centerX+mouseX*(mobile()?4:14);
    const cy=centerY+mouseY*(mobile()?3:8);

    // Projected particles. Inner streams become brighter and denser, so the
    // event horizon grows naturally out of the disk instead of being encircled
    // by an unrelated grey ring.
    ctx.font=`${mobile()?6:Math.max(6,Math.min(8,w/185))}px ui-monospace, SFMono-Regular, Consolas, monospace`;

    for(const p of particles){
      if(!reduced){
        const angular=p.speed*dt*(1+180/(p.r+70));
        p.a+=angular;
        p.r-=dt*(.18+3.5/(p.depth+.25));
        p.life+=dt*.035;
      }

      if(p.r<horizon*1.08||p.r>maxRadius||p.life>1.65){
        resetParticle(p);
      }

      const point=project(p.r,p.a,p.lane);
      const rx=point.x+(cx-centerX);
      const ry=point.y+(cy-centerY);

      if(rx<-24||rx>w+24||ry<-24||ry>h+24)continue;

      const innerGlow=Math.exp(-Math.pow((p.r-horizon*1.55)/(horizon*.72),2));
      const outerFade=Math.max(.04,1-p.r/maxRadius);
      const alpha=Math.min(
        .97,
        (
          (mobile()?.11:.08) +
          p.brightness*(mobile()?.53:.48) +
          innerGlow*(mobile()?.56:.42)
        )*Math.pow(outerFade,.58)
      );

      const glyphIndex=Math.min(
        glyphs.length-1,
        Math.floor(p.glyph+innerGlow*2.6)
      );

      const shade=Math.floor(176+p.depth*28+innerGlow*49);
      ctx.fillStyle=`rgba(${shade},${shade},${Math.max(164,shade-11)},${alpha})`;
      ctx.fillText(glyphs[glyphIndex],rx,ry);
    }

    function renderMobileSpiralLanes(pass){
      if(!mobile()) return;
      ctx.font="6px ui-monospace, SFMono-Regular, Consolas, monospace";

      for(let lane=0;lane<2;lane++){
        const samples=158;
        const laneOffset=lane===0?-0.18:0.22;

        for(let i=0;i<samples;i++){
          const t=i/(samples-1);
          const angle=
            t*Math.PI*2.68 +
            lane*Math.PI*.92 +
            now*.00023;

          // Radius winds inward instead of forming a closed ring.
          const radius=
            horizon*(4.0 - 2.32*t) +
            Math.sin(angle*2.1+lane)*horizon*.08;

          // Intentional gaps keep it filamentary.
          const visibility=
            Math.sin(angle*3.15 + lane*1.7) +
            Math.sin(angle*7.2 - lane)*.28;
          if(visibility < -.62) continue;

          // Use the same flattened disk geometry for depth splitting, and
          // leave a dead zone around the mid-plane to avoid crooked overlap.
          const depthY=Math.sin(angle)*(diskTilt + laneOffset*.05);
          if(pass==="back" && depthY > -0.06) continue;
          if(pass==="front" && depthY < 0.06) continue;

          const point=project(radius,angle,laneOffset);
          const rx=point.x+(cx-centerX);
          const ry=point.y+(cy-centerY);

          if(rx<-12||rx>w+12||ry<-12||ry>h+12) continue;

          const frontBoost=Math.max(0,depthY)*1.8;
          const alpha=.12 + t*.24 + Math.max(0,visibility)*.08 + frontBoost*.05;
          const shade=Math.floor(170 + t*56 + frontBoost*16);
          const char=glyphs[3 + ((i + lane*2) % 7)];

          ctx.fillStyle=`rgba(${shade},${shade},${Math.max(158,shade-10)},${Math.min(.72,alpha)})`;
          ctx.fillText(char,rx,ry);
        }
      }
    }

    function renderMobileInnerStream(pass){
      if(!mobile()) return;
      ctx.font="6px ui-monospace, SFMono-Regular, Consolas, monospace";
      const laneCount=116;

      for(let i=0;i<laneCount;i++){
        const angle=(i/laneCount)*Math.PI*2 + now*.00018;
        const gate=
          Math.sin(angle*2.7+0.7) +
          Math.sin(angle*5.1-0.35)*.42;

        // Leave gaps so this remains a hot inner stream rather than a ring.
        if(gate < -.28) continue;

        const depthY=Math.sin(angle)*diskTilt;
        if(pass==="back" && depthY > -0.06) continue;
        if(pass==="front" && depthY < 0.06) continue;

        const ripple=1.40 + .10*Math.sin(angle*3.4+1.1);
        const radius=horizon*ripple;
        const point=project(radius,angle,.05*Math.sin(angle*1.8));
        const rx=point.x+(cx-centerX);
        const ry=point.y+(cy-centerY);

        const frontBoost=Math.max(0,depthY)*1.9;
        const alpha=.16 + frontBoost*.18 + (gate+.28)*.075;
        const shade=Math.floor(198 + frontBoost*32);
        const char=glyphs[Math.min(glyphs.length-1,6+(i%5))];

        ctx.fillStyle=`rgba(${shade},${shade},${shade-8},${Math.min(.78,alpha)})`;
        ctx.fillText(char,rx,ry);
      }
    }

    // Behind-the-hole part of the mobile disk.
    renderMobileSpiralLanes("back");
    renderMobileInnerStream("back");

    // The core masks the innermost particles and therefore shares exactly the
    // same center and projected orientation as the accretion flow.
    drawCore(cx,cy);

    // In-front part of the mobile disk.
    renderMobileSpiralLanes("front");
    renderMobileInnerStream("front");

    requestAnimationFrame(draw);
  }

  addEventListener("resize",resize,{passive:true});

  addEventListener("pointermove",event=>{
    if(mobile())return;
    mouseX=(event.clientX/Math.max(1,w)-.5)*2;
    mouseY=(event.clientY/Math.max(1,h)-.5)*2;
  },{passive:true});

  resize();
  requestAnimationFrame(draw);
})();