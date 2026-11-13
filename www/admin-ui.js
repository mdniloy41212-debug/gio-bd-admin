/* Admin-only visual navigation; business logic remains in admin-script.js and inbox.js */
(() => {
 const $=id=>document.getElementById(id);
 const adminPage=$("adminPage"),settingsPage=$("adminSettingsPage");
 const inboxPage=$("adminInboxPage");
 const nav=document.querySelector(".admin-bottom-nav");
 const profileMenu=$("adminProfileMenu");
 function activate(name){
   if(!adminPage||adminPage.hidden)return;
   [adminPage,settingsPage,inboxPage].filter(Boolean).forEach(p=>{p.hidden=true;p.classList.remove("active")});
   const target=name==="settings"?settingsPage:name==="messages"?inboxPage:adminPage;
   if(target){target.hidden=false;target.classList.add("active")}
   nav?.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
   profileMenu?.classList.remove("open");
   window.scrollTo({top:0,behavior:"smooth"});
   if(name==="messages") $("adminInboxButton")?.click();
 }
 document.addEventListener("click",e=>{
   const b=e.target.closest("[data-view]");
   if(b){e.preventDefault();if(b.dataset.view==="messages"){ $("adminInboxButton")?.click(); }
   else if(b.dataset.view==="settings"){ $("adminSettingsButton")?.click(); setTimeout(()=>{const d=[...document.querySelectorAll("#adminSettingsPage details")].find(x=>x.querySelector("summary")?.textContent.includes("পেমেন্ট"));if(d)d.open=true;},80);}
   else if(b.dataset.view==="management"){ $("adminSettingsButton")?.click(); setTimeout(()=>{const d=[...document.querySelectorAll("#adminSettingsPage details")].find(x=>x.querySelector("summary")?.textContent.includes("প্যাকেজ"));if(d)d.open=true;},80);}
   else if(b.dataset.view==="profile"){profileMenu?.classList.toggle("open");}
   else activate("home");}
   if(e.target.closest("#adminProfileTrigger")) profileMenu?.classList.toggle("open");
   else if(profileMenu&&!e.target.closest("#adminProfileMenu"))profileMenu.classList.remove("open");
 });
 $("adminInboxBack")?.addEventListener("click",()=>activate("home"));
 $("adminSettingsBack")?.addEventListener("click",()=>activate("home"));
 $("socialMainButton")?.addEventListener("click",()=>{
   const menu=$("socialOptions");const open=menu?.classList.toggle("open");
   $("socialMainButton")?.setAttribute("aria-expanded",String(Boolean(open)));
 });
 $("adminWhatsappLink")?.addEventListener("click",e=>{
   e.preventDefault();
   const raw=$("whatsappNumber")?.value.trim()||"";
   const phone=raw.replace(/[^0-9]/g,"");
   if(!phone){alert("আগে Settings থেকে WhatsApp নম্বর সংরক্ষণ করুন।");return;}
   window.open("https://wa.me/"+phone,"_blank","noopener");
 });
 $("orderSearch")?.addEventListener("input",()=>{if(adminPage&&!adminPage.hidden){}});
 const observer=new MutationObserver(()=>{
   const loggedIn=adminPage&&!adminPage.hidden&&adminPage.classList.contains("active");
   if(nav)nav.hidden=!loggedIn;
   const social=$("adminFloatingSocial");if(social)social.hidden=!loggedIn;
 });
 if(adminPage)observer.observe(adminPage,{attributes:true,attributeFilter:["hidden","class"]});
})();
