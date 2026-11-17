(() => {
  if (window.__GIO_GLOBAL_UI__) return;
  window.__GIO_GLOBAL_UI__ = true;
  const style = document.createElement("style");
  style.textContent = `
    :root{--gio-nav-safe:calc(78px + env(safe-area-inset-bottom,0px))}
    body{padding-bottom:var(--gio-nav-safe)!important}
    .gio-bottom-nav,.gio-admin-bottom-nav{position:fixed!important;left:10px!important;right:10px!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;z-index:2147483000!important;transform:none!important}
    .gio-global-controls{position:fixed!important;top:calc(env(safe-area-inset-top,0px) + 8px)!important;left:10px!important;right:10px!important;z-index:2147483001!important;pointer-events:none!important}
    .gio-global-controls .gio-global-control{pointer-events:auto!important}
    main{padding-bottom:calc(var(--gio-nav-safe) + 18px)!important}
    .gio-page-refresh-indicator{position:fixed;z-index:2147483002;top:calc(env(safe-area-inset-top,0px) + 58px);left:50%;transform:translate(-50%,-16px);opacity:0;pointer-events:none;padding:7px 14px;border:1px solid #72e8ff88;border-radius:999px;background:#101c3df2;color:#fff;font:700 12px Arial,sans-serif;transition:opacity .15s,transform .15s}
    .gio-page-refresh-indicator.visible{opacity:1;transform:translate(-50%,0)}
    .gio-flash-ad,.gio-five-second-ad{animation:gioAdCycle12s 12s steps(1,end) infinite}
    @keyframes gioAdCycle12s{0%,83.32%{visibility:visible;opacity:1}83.33%,99.99%{visibility:hidden;opacity:0}}
    .gio-home,.gio-hero-card{isolation:isolate}
    .gio-home:before,#adminPage:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 18% 24%,#37cfff20,transparent 34%),radial-gradient(ellipse at 84% 70%,#a65cff20,transparent 38%);animation:gio3DGlow 8s ease-in-out infinite alternate}
    @keyframes gio3DGlow{from{filter:hue-rotate(0deg);transform:scale(1)}to{filter:hue-rotate(28deg);transform:scale(1.08)}}
    @media(prefers-reduced-motion:reduce){.gio-flash-ad,.gio-five-second-ad,.gio-home:before,#adminPage:before{animation:none}}
  `;
  document.head.appendChild(style);
  const indicator=document.createElement("div");
  indicator.className="gio-page-refresh-indicator";
  indicator.textContent="↻ রিফ্রেশ হচ্ছে…";
  indicator.setAttribute("role","status");
  document.body.appendChild(indicator);
  let startY=0, tracking=false, refreshing=false;
  const refresh=async()=>{
    if(refreshing)return;
    refreshing=true;
    indicator.classList.add("visible");
    try{
      window.dispatchEvent(new CustomEvent("gio:refresh",{detail:{source:"pull-to-refresh"}}));
      if(!navigator.onLine){indicator.textContent="ইন্টারনেট সংযোগের অপেক্ষায়…";return;}
      await new Promise(resolve=>setTimeout(resolve,350));
      window.location.reload();
    }catch(error){console.warn("GIO BD refresh failed",error);}
    finally{setTimeout(()=>{indicator.classList.remove("visible");indicator.textContent="↻ রিফ্রেশ হচ্ছে…";refreshing=false;},900);}
  };
  document.addEventListener("touchstart",event=>{
    if(window.scrollY<=2 && event.touches.length===1){startY=event.touches[0].clientY;tracking=true;}
    else tracking=false;
  },{passive:true});
  document.addEventListener("touchend",event=>{
    if(!tracking)return;
    const distance=event.changedTouches[0].clientY-startY;
    tracking=false;
    if(distance>90 && window.scrollY<=2) refresh();
  },{passive:true});
  window.addEventListener("online",()=>{indicator.textContent="ইন্টারনেট ফিরে এসেছে—ডেটা আপডেট হচ্ছে…";indicator.classList.add("visible");refresh();});
  window.addEventListener("offline",()=>{indicator.textContent="ইন্টারনেট সংযোগ নেই";indicator.classList.add("visible");});
  const back=document.getElementById("gioGlobalBack");
  back?.addEventListener("click",event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    if(window.history.length>1){window.history.back();return;}
    const active=document.querySelector("main .page.active");
    if(active && active.id!=="homePage" && active.id!=="loginPage"){
      document.querySelector('[data-page="homePage"],[data-admin-tab="home"]')?.click();
      if(!document.querySelector('[data-page="homePage"],[data-admin-tab="home"]')) location.hash="";
    }
  },true);
  document.getElementById("gioGlobalRefresh")?.addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();refresh();
  },true);
})();