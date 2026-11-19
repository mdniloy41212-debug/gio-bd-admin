import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy,
  onSnapshot, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const config = {
  apiKey: "AIzaSyDZ3tIrZxqYuiYP8fnoNoDcLR6W7wbEt30",
  authDomain: "gio-bd.firebaseapp.com",
  projectId: "gio-bd",
  storageBucket: "gio-bd.firebasestorage.app",
  messagingSenderId: "727420404239",
  appId: "1:727420404239:web:914e2903eb648db782d97a"
};

const app = getApps().length ? getApps()[0] : initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const OwnerMicrophonePermission = registerPlugin("MicrophonePermission");
window.gioRequestMicPermission = async () => {
  if (!Capacitor.isNativePlatform()) return true;
  const result = await OwnerMicrophonePermission.request();
  return result?.granted === true;
};

const main = document.querySelector("main");
const adminBottomNav = document.createElement("nav");
adminBottomNav.className = "gio-admin-bottom-nav";
adminBottomNav.innerHTML = '<button type="button" data-admin-tab="home">⌂<span>Home</span></button><button type="button" data-admin-tab="inbox">▤<span>Inbox</span></button><button type="button" data-admin-tab="orders">📦<span>Orders</span></button><button type="button" data-admin-tab="offers">◇<span>Package</span></button><button type="button" data-admin-tab="settings">⚙<span>Settings</span></button>';
adminBottomNav.hidden = true;
adminBottomNav.style.setProperty("pointer-events","auto","important");
adminBottomNav.style.setProperty("touch-action","manipulation","important");
document.body.appendChild(adminBottomNav);
const ownerActionBar=document.createElement("div");
ownerActionBar.className="gio-owner-action-bar";
ownerActionBar.innerHTML='<button type="button" id="gioOwnerBackButton" aria-label="Back">← <span>Back</span></button><strong id="gioOwnerCurrentPage">GIO BD</strong><button type="button" id="gioOwnerRefreshButton" aria-label="Refresh">↻ <span>Refresh</span></button>';
ownerActionBar.hidden=true;
document.body.insertBefore(ownerActionBar, main);
let ownerTabHistory=[];
let currentOwnerTab="home";
function refreshOwnerPage(){
 try{sessionStorage.setItem("gioOwnerLastTab",currentOwnerTab);}catch(e){}
 window.location.reload();
}
document.getElementById("gioOwnerRefreshButton").addEventListener("click",refreshOwnerPage);
let ownerPullStartY=0;
document.addEventListener("touchstart",event=>{if(window.scrollY===0)ownerPullStartY=event.touches?.[0]?.clientY||0;},{passive:true});
document.addEventListener("touchend",event=>{
 const endY=event.changedTouches?.[0]?.clientY||0;
 if(ownerPullStartY>0&&endY-ownerPullStartY>85&&window.scrollY===0&&auth.currentUser)refreshOwnerPage();
 ownerPullStartY=0;
},{passive:true});
document.getElementById("gioOwnerBackButton").addEventListener("click",()=>{
 const previous=ownerTabHistory.pop()||"home";
 showAdminTab(previous,false);
});
const adminOrdersPage = document.createElement("section");
adminOrdersPage.id="adminOrdersPage";adminOrdersPage.className="page";adminOrdersPage.hidden=true;
adminOrdersPage.innerHTML='<h2>📦 Customer Orders</h2><p class="muted">কাস্টমারের জমা দেওয়া অর্ডার এখানে দেখা যাবে। Approve, Reject ও Complete করতে Settings খুলুন।</p><div id="ownerOrderList" class="gio-owner-order-list">অর্ডার লোড হচ্ছে...</div>';
main?.appendChild(adminOrdersPage);
const adminProfilePage = document.createElement("section");
adminProfilePage.id = "adminProfilePage"; adminProfilePage.className = "page"; adminProfilePage.hidden = true;
adminProfilePage.innerHTML = '<div class="owner-profile-detail"><div class="admin-profile-avatar gio-owner-avatar"><img id="ownerProfileAvatar" alt="Profile"><span id="ownerProfileInitial">G</span><b class="gio-owner-v-badge">✓</b></div><h2 id="ownerProfileDisplayName">GIO BD</h2><div class="owner-official-verified">🔵 OFFICIAL VERIFIED</div><p id="gioOwnerProfileEmail">Admin account</p><form id="ownerProfileEditForm"><label for="ownerProfileNameInput">নাম পরিবর্তন</label><input id="ownerProfileNameInput" type="text" maxlength="40" placeholder="আপনার নাম"><label for="ownerProfilePhotoInput">প্রোফাইল ছবি পরিবর্তন</label><input id="ownerProfilePhotoInput" type="file" accept="image/*"><button type="submit">প্রোফাইল সংরক্ষণ করুন</button><p id="ownerProfileSaveMessage" role="status"></p></form><a href="mailto:mdniloy41212@gmail.com">Gmail Support</a><button id="ownerProfileBack" type="button">← Home</button><button id="ownerProfileLogout" class="owner-profile-logout" type="button">Logout</button><p id="ownerProfileLogoutMessage" role="status"></p></div>';
main?.appendChild(adminProfilePage);
const adminNavStyle = document.createElement("style");
adminNavStyle.textContent += ".gio-owner-action-bar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:9px 12px!important;min-height:52px!important}.gio-owner-action-bar button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;min-height:38px!important;padding:7px 10px!important;color:#fff!important;background:linear-gradient(135deg,#075aa0,#283c9b)!important;border:1px solid #65dfff!important;border-radius:10px!important;font-weight:800!important}.gio-owner-action-bar button:disabled{opacity:.45!important}.gio-owner-action-bar[hidden],.gio-admin-bottom-nav[hidden]{display:none!important}";
adminNavStyle.textContent = '.gio-admin-bottom-nav{position:fixed;z-index:1100;left:8px;right:8px;bottom:8px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:8px;border:1px solid #70ddff55;border-radius:18px;background:#0c1738f2;backdrop-filter:blur(14px);box-shadow:0 12px 32px #0009}.gio-admin-bottom-nav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:7px 2px;min-height:52px;font-size:18px;background:linear-gradient(145deg,#174a83,#34206e)}.gio-admin-bottom-nav button span{font-size:9px;white-space:nowrap}body{padding-bottom:100px}.gio-admin-help{position:fixed;right:14px;bottom:98px;z-index:1099;border:2px solid #9ef7ff;border-radius:40px;padding:13px 17px;background:linear-gradient(135deg,#00a6c7,#6534c9);font-weight:800;box-shadow:0 0 22px #00cfff88;animation:gioOwnerBounce 1.8s infinite}.gio-admin-help-panel{position:fixed;right:14px;bottom:155px;z-index:1100;width:min(260px,calc(100vw - 28px));padding:14px;border-radius:16px;background:#101735f5;border:1px solid #78eaff66}.gio-admin-help-panel a{display:block;padding:11px;margin:7px 0;border-radius:10px;color:white;text-decoration:none;background:#176fba;text-align:center}@keyframes gioOwnerBounce{50%{transform:translateY(-8px)}}';
adminNavStyle.textContent += '#adminOrderAlert{display:none!important}.gio-admin-bottom-nav[hidden],.gio-admin-help[hidden]{display:none!important}';
adminNavStyle.textContent += '.gio-chat-list{display:flex;flex-direction:column;gap:12px;max-height:62vh;overflow-y:auto;padding:12px 8px;background:rgba(4,14,35,.38);border:1px solid #70dfff33;border-radius:18px;scroll-behavior:smooth}.gio-chat-row{display:flex;flex-direction:column;max-width:86%;min-width:0}.gio-chat-row-incoming{align-self:flex-start;align-items:flex-start}.gio-chat-row-outgoing{align-self:flex-end;align-items:flex-end}.gio-chat-sender{font-size:11px;color:#b9eaff;margin:0 8px 4px}.gio-chat-bubble{padding:10px 13px;border-radius:17px;max-width:100%;overflow-wrap:anywhere;box-shadow:0 5px 14px #0004}.gio-chat-row-incoming .gio-chat-bubble{background:linear-gradient(145deg,#243c61,#172943);border:1px solid #80caff55;border-top-left-radius:5px;color:#fff}.gio-chat-row-outgoing .gio-chat-bubble{background:linear-gradient(145deg,#075f91,#164e87);border:1px solid #77e8ff66;border-top-right-radius:5px;color:#fff}.gio-chat-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.gio-chat-time{font-size:10px;color:#9fb4d0;margin:4px 7px}.gio-chat-row textarea{display:block;width:min(76vw,320px);margin-top:8px}.gio-chat-row>button{margin-top:5px}.gio-chat-bubble audio{width:100%;max-width:260px}.gio-chat-bubble .voice-message-duration{display:block;font-size:11px;color:#d4f4ff}';


adminNavStyle.textContent += ".owner-monitor-limits{margin:22px 0 18px;padding:16px;border:1px solid rgba(255,190,90,.5);border-radius:16px;background:linear-gradient(145deg,rgba(75,43,24,.72),rgba(34,24,58,.9));box-shadow:0 10px 26px rgba(0,0,0,.22)}.owner-monitor-limits h3{color:#ffd27a;margin:0 0 9px}.owner-monitor-limits p{color:#eee1d2;margin:0 0 10px}.owner-monitor-limits ul{padding-left:22px;margin:8px 0 14px}.owner-monitor-limits li{padding:5px 0;color:#fff;overflow-wrap:anywhere}.owner-monitor-can{padding:11px;border-radius:10px;background:rgba(14,105,77,.28);border:1px solid rgba(89,220,165,.35);color:#c9ffe7;font-weight:600}";
adminNavStyle.textContent += ".gio-customer-chat-item{display:flex;align-items:center;gap:12px;width:100%;padding:13px;margin:6px 0;text-align:left;border:1px solid #79dfff44;border-radius:15px;background:linear-gradient(135deg,#172c50,#10203c);color:#fff}.gio-customer-chat-avatar{width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;border-radius:50%;font-size:20px;font-weight:800;background:linear-gradient(135deg,#05a9d4,#6843c8)}.gio-customer-chat-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}.gio-customer-chat-info strong,.gio-customer-chat-info small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gio-customer-chat-info small{color:#b6cce4}.gio-customer-chat-meta{display:flex;flex-direction:column;align-items:center;gap:5px;color:#9db8d2}.gio-customer-unread{min-width:20px;padding:2px 6px;border-radius:20px;background:#00a8d2;color:white;text-align:center}.gio-chat-thread-header{display:flex;align-items:center;gap:12px;padding:8px 0 12px}.gio-chat-thread-header strong{font-size:16px}.gio-chat-thread{display:flex;flex-direction:column;gap:10px;max-height:48vh;overflow-y:auto;padding:10px;background:#08152a88;border-radius:15px}.gio-chat-composer{display:flex;flex-direction:column;gap:8px;padding-top:12px}.gio-chat-composer textarea{width:100%;min-height:64px}.gio-chat-composer audio{max-width:100%}";
adminNavStyle.textContent += '.gio-admin-bottom-nav{grid-template-columns:repeat(5,minmax(0,1fr))!important}.gio-owner-action-bar{position:sticky;top:0;z-index:1080;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;margin:0 0 12px;border:1px solid #70ddff55;border-radius:14px;background:#091631f5;backdrop-filter:blur(12px);box-shadow:0 6px 18px #0007}.gio-owner-action-bar[hidden]{display:none!important}.gio-owner-action-bar strong{font-size:13px;color:#d9f8ff;text-align:center;flex:1}.gio-owner-action-bar button{min-width:76px;padding:8px 10px;margin:0;border-radius:10px;background:linear-gradient(135deg,#135c91,#482b83);font-size:13px}.gio-owner-action-bar button:disabled{opacity:.45}';
adminNavStyle.textContent += ".gio-admin-bottom-nav button{touch-action:manipulation!important;pointer-events:auto!important;position:relative!important;z-index:1!important}.gio-admin-bottom-nav button.active{outline:2px solid #ffe36a!important;box-shadow:0 0 14px #ffe36a88,inset 0 0 10px #ffe36a33!important;filter:brightness(1.2)!important}";
document.head.appendChild(adminNavStyle);
const adminHelp = document.createElement("button"); adminHelp.type="button"; adminHelp.className="gio-admin-help"; adminHelp.textContent="☎ Help";
const adminHelpPanel = document.createElement("div"); adminHelpPanel.className="gio-admin-help-panel"; adminHelpPanel.hidden=true;
adminHelpPanel.innerHTML='<strong>GIO BD Owner Support</strong><a id="gioOwnerWhatsApp" href="#" target="_blank" rel="noopener">WhatsApp</a><a href="https://www.facebook.com/profile.php?id=61582121766890" target="_blank" rel="noopener">Facebook Page</a><a href="mailto:mdniloy41212@gmail.com">Gmail</a>';
adminHelp.hidden = true;
document.body.append(adminHelp,adminHelpPanel);
adminHelp.addEventListener("click",()=>{adminHelpPanel.hidden=!adminHelpPanel.hidden;});
async function refreshOwnerWhatsApp(){try{const snap=await getDoc(doc(db,"settings","supportContact"));const num=snap.exists()?String(snap.data().whatsappNumber||"").replace(/\\D/g,""):"";const link=document.getElementById("gioOwnerWhatsApp");if(link)link.href=num?"https://wa.me/"+num:"#";}catch(e){console.warn("WhatsApp contact unavailable",e);}}
refreshOwnerWhatsApp();
function showAdminTab(tab,remember=true){
 if(!auth.currentUser)return;
 adminBottomNav.hidden=false;
 adminBottomNav.removeAttribute("hidden");
 adminBottomNav.style.setProperty("display","grid","important");
 adminBottomNav.style.setProperty("visibility","visible","important");
 adminBottomNav.style.setProperty("opacity","1","important");
 adminBottomNav.style.setProperty("pointer-events","auto","important");
 adminBottomNav.style.setProperty("z-index","2147483000","important");
 if(remember&&tab!==currentOwnerTab)ownerTabHistory.push(currentOwnerTab);
 currentOwnerTab=tab;
 const pageNames={home:"GIO BD",orders:"Order",offers:"Package",inbox:"Inbox",settings:"Settings",profile:"Profile"};
 const pageTitle=document.getElementById("gioOwnerCurrentPage");if(pageTitle)pageTitle.textContent=pageNames[tab]||"GIO BD OWNER";
 const backButton=document.getElementById("gioOwnerBackButton");if(backButton)backButton.disabled=ownerTabHistory.length===0;
 const login=document.getElementById("loginPage"), dash=document.getElementById("adminPage"), settings=document.getElementById("adminSettingsPage"), offers=document.getElementById("adminOffersPage"), inbox=document.getElementById("adminInboxPage");
 [login,dash,settings,offers,inbox,adminOrdersPage,adminProfilePage].filter(Boolean).forEach(p=>{p.classList.remove("active");p.hidden=true;});
 if(tab==="home"&&dash){dash.hidden=false;dash.classList.add("active");}
 // Orders opens the real order-management panel (filters, approve/reject,
 // completed/rejected history and archive controls), not a read-only duplicate.
 if(tab==="orders"&&settings){
  settings.hidden=false;settings.classList.add("active");
  requestAnimationFrame(()=>{document.getElementById("adminOrders")?.scrollIntoView({behavior:"smooth",block:"start"});});
 }
 if((tab==="settings"||tab==="manage")&&settings){
  settings.hidden=false;settings.classList.add("active");
  requestAnimationFrame(()=>settings.scrollTo?.({top:0,behavior:"smooth"}));
 }
 if(tab==="offers"&&offers){offers.hidden=false;offers.classList.add("active");}
 if(tab==="profile"){adminProfilePage.hidden=false;adminProfilePage.classList.add("active");const email=document.getElementById("gioOwnerProfileEmail");if(email)email.textContent=auth.currentUser?.email||"Admin account";loadOwnerProfile();}
 if(tab==="inbox"&&inbox){inbox.hidden=false;inbox.classList.add("active");markIncomingAsRead();}
 adminBottomNav.querySelectorAll("[data-admin-tab]").forEach(button=>{const active=button.dataset.adminTab===tab;button.classList.toggle("active",active);if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");});
}
adminBottomNav.addEventListener("click",event=>{const path=typeof event.composedPath==="function"?event.composedPath():[];const button=path.find(node=>node instanceof HTMLButtonElement&&node.matches("button[data-admin-tab]"))||(event.target instanceof Element?event.target.closest("button[data-admin-tab]"):null);if(!button||!adminBottomNav.contains(button))return;event.preventDefault();event.stopPropagation();showAdminTab(button.dataset.adminTab);},true);
let ownerOrderDocs=[];
function renderOwnerOrders(){
 const box=document.getElementById("ownerOrderList");if(!box)return;box.replaceChildren();
 if(!ownerOrderDocs.length){box.textContent="এখনো কোনো অর্ডার পাওয়া যায়নি।";return;}
 ownerOrderDocs.forEach(({id,data})=>{
  const card=document.createElement("article");card.className="order-card";
  const title=document.createElement("h3");title.textContent=data.packageName||"Diamond Order";
  const details=document.createElement("p");details.textContent="Order ID: "+id+" | কাস্টমার: "+(data.customerName||"নেই")+" | Gmail: "+(data.customerEmail||"নেই")+" | Diamond: "+(data.diamondQuantity||"—")+" | মূল্য: ৳"+(data.price??"—")+" | Payment: "+(data.paymentMethod||"—")+" | Status: "+(data.status||"Pending");
  card.append(title,details);box.appendChild(card);
 });
}
const ownerProfileButton=document.getElementById("ownerProfileButton");
if(ownerProfileButton){ownerProfileButton.type="button";ownerProfileButton.style.position="relative";ownerProfileButton.style.zIndex="5";ownerProfileButton.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();showAdminTab("profile");});}
const ownerHomeFooter=document.querySelector(".gio-owner-footer");
const ownerHomeDashboard=document.getElementById("adminPage");
if(ownerHomeFooter&&ownerHomeDashboard&&!ownerHomeDashboard.contains(ownerHomeFooter)){
  const stats=document.getElementById("dashboardStats");
  if(stats)stats.after(ownerHomeFooter);else ownerHomeDashboard.appendChild(ownerHomeFooter);
}
const ownerHomeAdStyle=document.createElement("style");
ownerHomeAdStyle.textContent=`
  #adminPage{height:calc(100dvh - 174px)!important;min-height:0!important;max-height:calc(100dvh - 174px)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;gap:8px!important;box-sizing:border-box!important}
  #adminPage .owner-home-top{display:block!important;flex:0 0 auto!important;width:100%!important;margin:0 0 8px!important;padding:0!important}
  #adminPage #ownerProfileButton{display:flex!important;position:absolute!important;z-index:5!important;top:8px!important;left:8px!important;width:46px!important;min-width:46px!important;height:46px!important;min-height:46px!important;padding:0!important;overflow:hidden!important;opacity:.96}
  #adminPage #ownerProfileButton strong{display:none!important}
  #adminPage .owner-ad-banner{width:100%!important;min-height:150px!important;margin:0!important;box-sizing:border-box!important}
  #adminPage .owner-ad-copy{width:100%!important}
  #adminPage #dashboardStats{flex:1 1 auto!important;min-height:0!important;align-content:center!important;overflow:hidden!important;margin:0!important}
  #adminPage .gio-owner-footer{flex:0 0 auto!important;margin:8px 0 0!important;padding:10px 7px!important;border:1px solid #65eaff!important;border-radius:15px!important;background:linear-gradient(105deg,#071a43,#124b85 45%,#42166e)!important;box-shadow:0 0 18px #23dfff99,inset 0 1px 0 #ffffff55!important;text-align:center!important}
  #adminPage .gio-owner-footer p{font-size:13px!important;letter-spacing:1px!important;color:#80f4ff!important}
  #adminPage .gio-owner-footer strong{font-size:clamp(17px,5vw,22px)!important;font-weight:1000!important;letter-spacing:1px!important;color:#ffe36a!important;text-shadow:0 0 12px #ffe36a,0 2px 0 #6b3a14!important}
  body:has(#adminPage.active){overflow:hidden!important}
  body:has(#adminPage.active) main{overflow:hidden!important}
`;
document.head.appendChild(ownerHomeAdStyle);
const ownerAdSlides=[
  ["LIVE AD • GIO BD","DIAMOND RECHARGE"],
  ["দ্রুত • নিরাপদ • নির্ভরযোগ্য","GIO BD PREMIUM"],
  ["আপনার বিশ্বস্ত রিচার্জ বাজার","SHINE BRIGHTER"]
];
let ownerAdSlideIndex=0;
const rotateOwnerAd=()=>{
  const copy=document.querySelector("#ownerAdBanner .owner-ad-copy");
  if(!copy)return;
  const title=copy.querySelector("strong"),subtitle=copy.querySelector("small");
  const slide=ownerAdSlides[ownerAdSlideIndex%ownerAdSlides.length];
  if(title)title.textContent=slide[0];
  if(subtitle)subtitle.textContent=slide[1];
  ownerAdSlideIndex++;
};
rotateOwnerAd();
if(!window.__gioOwnerHomeAdTimer)window.__gioOwnerHomeAdTimer=window.setInterval(rotateOwnerAd,5000);

document.getElementById("ownerProfileBack")?.addEventListener("click",()=>showAdminTab("home"));
let ownerProfileData={displayName:"GIO BD",photoData:""};
async function loadOwnerProfile(){
 try{const snap=await getDoc(doc(db,"settings","ownerProfile"));if(snap.exists())ownerProfileData={...ownerProfileData,...snap.data()};}catch(e){console.warn("Profile settings unavailable",e);}
 const name=ownerProfileData.displayName||"GIO BD",photo=ownerProfileData.photoData||"";
 ["ownerHomeName","ownerProfileDisplayName"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=name;});
 ["ownerHomeInitial","ownerProfileInitial"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=(name.trim()[0]||"G").toUpperCase();});
 ["ownerHomeAvatar","ownerProfileAvatar"].forEach(id=>{const el=document.getElementById(id);if(el){el.src=photo;el.hidden=!photo;}});
 const nameInput=document.getElementById("ownerProfileNameInput");if(nameInput&&document.activeElement!==nameInput)nameInput.value=name;
}
document.getElementById("ownerProfileEditForm")?.addEventListener("submit",async event=>{
 event.preventDefault();if(!auth.currentUser)return;
 const message=document.getElementById("ownerProfileSaveMessage"),name=(document.getElementById("ownerProfileNameInput")?.value||"").trim();
 if(!name){if(message)message.textContent="নাম লিখুন।";return;}
 const file=document.getElementById("ownerProfilePhotoInput")?.files?.[0];
 try{
  let photoData=ownerProfileData.photoData||"";
  if(file){if(!file.type.startsWith("image/"))throw new Error("শুধু ছবি নির্বাচন করুন।");
   photoData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error("ছবি পড়া যায়নি"));reader.onload=()=>{const img=new Image();img.onload=()=>{const canvas=document.createElement("canvas"),scale=Math.min(1,320/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",.78));};img.onerror=()=>reject(new Error("ছবি খোলা যায়নি"));img.src=reader.result;};reader.readAsDataURL(file);});
  }
  await setDoc(doc(db,"settings","ownerProfile"),{displayName:name,photoData,updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid},{merge:true});
  ownerProfileData={displayName:name,photoData};await loadOwnerProfile();if(message)message.textContent="প্রোফাইল সংরক্ষণ হয়েছে।";
 }catch(error){if(message)message.textContent="সংরক্ষণ হয়নি: "+(error.message||"আবার চেষ্টা করুন");}
});
document.getElementById("ownerRunAdButton")?.addEventListener("click",()=>{
 const banner=document.getElementById("ownerAdBanner"),duration=Number(document.getElementById("ownerAdDuration")?.value||10);
 if(!banner)return;banner.classList.add("ad-running");const button=document.getElementById("ownerRunAdButton");if(button)button.textContent="▶ AD RUNNING";
 window.clearTimeout(window.__gioAdTimer);window.__gioAdTimer=window.setTimeout(()=>{banner.classList.remove("ad-running");if(button)button.textContent="▶ Run Ad";},duration*1000);
});
document.getElementById("ownerProfileLogout")?.addEventListener("click",async()=>{
 const button=document.getElementById("ownerProfileLogout"),status=document.getElementById("ownerProfileLogoutMessage");
 if(button)button.disabled=true;
 try{await signOut(auth);}
 catch(error){if(status)status.textContent="Logout করা যায়নি: "+(error.message||"আবার চেষ্টা করুন।");if(button)button.disabled=false;}
});
// Advertisement runs only when Owner taps Run Ad; duration is selectable (5 or 10 seconds).
let stopListening;
let stopOrdersListening;
let currentPendingOrders = [];
let currentMessages = [];
let currentAdminUid = null;
let readNotificationIds = new Set();
let activeInboxTab = "customer";

function createVoiceRecorder(onReady, statusElement) {
  const wrap = document.createElement("div");
  wrap.className = "voice-composer";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "voice-record-button";
  button.textContent = "🎙️ ভয়েস রেকর্ড";
  const preview = document.createElement("audio");
  preview.className = "voice-message-preview";
  preview.controls = true;
  preview.hidden = true;
  preview.preload = "metadata";
  const sendButton = document.createElement("button");
  sendButton.type = "button";
  sendButton.textContent = "📤 ভয়েস Send";
  sendButton.hidden = false;
  sendButton.disabled = true;
  sendButton.className = "voice-send-button";
  sendButton.textContent = "➤ Voice Send";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "✖ বাতিল";
  cancelButton.hidden = true;
  wrap.append(button, preview, sendButton, cancelButton);

  let recorder = null;
  let stream = null;
  let chunks = [];
  let timer = null;
  let clock = null;
  let startedAt = 0;
  let pendingData = null;
  let pendingMime = "";
  let pendingDuration = 0;
  let previewUrl = null;
  let busy = false;

  function clearPending() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    pendingData = null;
    pendingMime = "";
    pendingDuration = 0;
    preview.removeAttribute("src");
    preview.hidden = true;
    sendButton.hidden = false;
    sendButton.disabled = true;
    cancelButton.hidden = true;
  }

  cancelButton.addEventListener("click", () => {
    clearPending();
    button.hidden = false;
    button.disabled = false;
    button.textContent = "🎙️ আবার রেকর্ড";
    if (statusElement) statusElement.textContent = "রেকর্ড বাতিল করা হয়েছে।";
  });

  sendButton.addEventListener("click", async () => {
    if (!pendingData || busy) return;
    busy = true;
    sendButton.disabled = true;
    cancelButton.disabled = true;
    if (statusElement) statusElement.textContent = "ভয়েস মেসেজ পাঠানো হচ্ছে...";
    try {
      await onReady(pendingData, pendingMime, pendingDuration);
      clearPending();
      button.hidden = false;
      button.disabled = false;
      button.textContent = "🎙️ আবার রেকর্ড";
      if (statusElement) statusElement.textContent = "ভয়েস মেসেজ পাঠানো হয়েছে।";
    } catch (error) {
      if (statusElement) statusElement.textContent = "ভয়েস মেসেজ পাঠানো যায়নি: " + (error.message || error);
      sendButton.disabled = false;
      cancelButton.disabled = false;
    } finally {
      busy = false;
    }
  });

  button.addEventListener("click", async () => {
    if (busy) return;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      button.disabled = true;
      button.textContent = "অডিও তৈরি হচ্ছে...";
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      if (statusElement) statusElement.textContent = "এই অ্যাপ/ব্রাউজারে ভয়েস রেকর্ডিং সমর্থিত নয়। HTTPS ও Microphone permission প্রয়োজন।";
      return;
    }
    try {
      const permissionGranted = await window.gioRequestMicPermission?.();
      if (permissionGranted === false) { const denied = new Error("ফোনের Microphone permission Allow করুন।"); denied.name = "NotAllowedError"; throw denied; }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = preferred.find(type => MediaRecorder.isTypeSupported(type));
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 })
        : new MediaRecorder(stream, { audioBitsPerSecond: 24000 });
      recorder.ondataavailable = event => {
        if (event.data && event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        clearTimeout(timer);
        clearInterval(clock);
        stream?.getTracks().forEach(track => track.stop());
        stream = null;
        const duration = Math.min(15, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          if (!blob.size) throw new Error("কোনো অডিও রেকর্ড হয়নি।");
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("অডিও পড়া যায়নি।"));
            reader.readAsDataURL(blob);
          });
          if (dataUrl.length > 180000) throw new Error("অডিও ফাইলটি বড় হয়েছে। আবার ছোট করে রেকর্ড করুন।");
          clearPending();
          pendingData = dataUrl;
          pendingMime = blob.type || recorder.mimeType || "audio/webm";
          pendingDuration = duration;
          previewUrl = URL.createObjectURL(blob);
          preview.src = previewUrl;
          preview.hidden = false;
          sendButton.hidden = false;
          sendButton.disabled = false;
          cancelButton.hidden = false;
          button.hidden = true;
          button.disabled = false;
          if (statusElement) statusElement.textContent = "ভয়েস রেকর্ড হয়েছে (" + duration + " সেকেন্ড)। Send করার আগে শুনে নিন।";
        } catch (error) {
          button.disabled = false;
          button.textContent = "🎙️ আবার রেকর্ড";
          if (statusElement) statusElement.textContent = "ভয়েস তৈরি হয়নি: " + error.message;
        } finally {
          recorder = null;
          chunks = [];
        }
      };
      startedAt = Date.now();
      recorder.start();
      button.textContent = "⏹️ রেকর্ড বন্ধ করুন";
      if (statusElement) statusElement.textContent = "রেকর্ড হচ্ছে: ০/১৫ সেকেন্ড";
      clock = setInterval(() => {
        const seconds = Math.min(15, Math.floor((Date.now() - startedAt) / 1000));
        if (statusElement) statusElement.textContent = "রেকর্ড হচ্ছে: " + seconds + "/১৫ সেকেন্ড";
      }, 250);
      timer = setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, 15000);
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
      button.disabled = false;
      button.textContent = "🎙️ ভয়েস রেকর্ড";
      if (statusElement) statusElement.textContent = error.name === "NotAllowedError"
        ? "Microphone permission বন্ধ আছে। ফোনের App permissions থেকে Microphone Allow করুন।"
        : "মাইক্রোফোন চালু হয়নি: " + (error.message || error);
    }
  });
  return wrap;
}

function appendVoicePlayer(card, data) {
  if (!data.audioData) return;
  const duration = document.createElement("small");
  duration.className = "voice-message-duration";
  duration.textContent = "🎙️ ভয়েস মেসেজ" + (Number(data.audioDuration) > 0 ? " • " + Number(data.audioDuration) + " সেকেন্ড" : "");
  const player = document.createElement("audio");
  player.controls = true;
  player.preload = "metadata";
  player.className = "voice-message-player";
  player.src = data.audioData;
  card.append(duration, player);
}


function readStorage(uid) {
  try {
    const value = JSON.parse(localStorage.getItem("gioAdminReadNotifications:" + uid) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function saveReadStorage() {
  if (!currentAdminUid) return;
  try {
    localStorage.setItem(
      "gioAdminReadNotifications:" + currentAdminUid,
      JSON.stringify([...readNotificationIds])
    );
  } catch (error) {
    console.warn("Could not save notification read state:", error);
  }
}

function markIncomingAsRead() {
  currentMessages.forEach(item => {
    if (item.data().senderRole === "customer") readNotificationIds.add(item.id);
  });
  saveReadStorage();
  renderMessages();
}


let activeCustomerUid = null;

function renderMessages() {
  const list = document.getElementById("adminInboxList");
  const button = document.getElementById("adminInboxButton");
  if (!list || !button) return;
  const unread = currentMessages.filter(item => item.data().directMessage !== true && item.data().senderRole === "customer" && !readNotificationIds.has(item.id)).length + currentPendingOrders.length;
  button.innerHTML = "📥 Inbox" + (unread ? ' <span class="notification-count">' + unread + "</span>" : "");

  const messages = [...currentMessages].sort((a,b) =>
    (a.data().createdAt?.toMillis?.() || 0) - (b.data().createdAt?.toMillis?.() || 0)
  );
  const customers = new Map();
  messages.forEach(item => {
    const data = item.data();
    if (data.directMessage === true || !data.userUid) return;
    if (!customers.has(data.userUid)) customers.set(data.userUid, { uid: data.userUid, name: data.senderRole === "customer" ? (data.senderName || data.senderEmail || "কাস্টমার") : (data.customerName || "কাস্টমার"), messages: [], lastAt: data.createdAt?.toMillis?.() || 0, unread: 0 });
    const entry = customers.get(data.userUid);
    entry.messages.push(item);
    entry.lastAt = Math.max(entry.lastAt, data.createdAt?.toMillis?.() || 0);
    if (data.senderRole === "customer" && !readNotificationIds.has(item.id)) entry.unread++;
    if (data.senderRole === "customer" && (data.senderName || data.senderEmail)) entry.name = data.senderName || data.senderEmail;
  });
  const sortedCustomers = [...customers.values()].sort((a,b)=>b.lastAt-a.lastAt);

  list.replaceChildren();
  if (!activeCustomerUid) {
    const heading=document.createElement("h3");
    heading.textContent="👥 কাস্টমার চ্যাট ("+sortedCustomers.length+")";
    list.appendChild(heading);
    if (currentPendingOrders.length) {
      const ordersHeading=document.createElement("h4");
      ordersHeading.textContent="🛎️ Pending / Processing Orders ("+currentPendingOrders.length+")";
      list.appendChild(ordersHeading);
      currentPendingOrders.forEach(item=>{
        const d=item.data(), card=document.createElement("article");
        card.className="order-card notification-card";
        const title=document.createElement("strong"); title.textContent="নতুন অর্ডার: "+(d.packageName||"Diamond Order");
        const detail=document.createElement("p"); detail.textContent="Order ID: "+item.id+" | কাস্টমার: "+(d.customerName||"নেই")+" | মূল্য: ৳"+(d.price??"—")+" | IMO ID: "+(d.imoId||"—")+" | Transaction ID: "+(d.transactionId||"—");
        const status=document.createElement("p"); status.className="notification-status"; status.textContent=d.status||"Pending";
        card.append(title,detail,status); list.appendChild(card);
      });
    }
    if (!sortedCustomers.length) {
      const empty=document.createElement("p"); empty.textContent="এখনো কোনো কাস্টমার মেসেজ করেনি।"; list.appendChild(empty);
      return;
    }
    sortedCustomers.forEach(customer=>{
      const last=customer.messages[customer.messages.length-1]?.data()||{};
      const row=document.createElement("button");
      row.type="button"; row.className="gio-customer-chat-item";
      const avatar=document.createElement("span"); avatar.className="gio-customer-chat-avatar"; avatar.textContent=(customer.name||"ক").trim().charAt(0).toUpperCase();
      const info=document.createElement("span"); info.className="gio-customer-chat-info";
      const name=document.createElement("strong"); name.textContent=customer.name;
      const preview=document.createElement("small"); preview.textContent=last.audioData?"🎙️ ভয়েস মেসেজ":(last.text||"মেসেজ");
      info.append(name,preview);
      const meta=document.createElement("span"); meta.className="gio-customer-chat-meta";
      const time=document.createElement("small"); const date=last.createdAt?.toDate?.(); time.textContent=date?date.toLocaleTimeString("bn-BD",{hour:"2-digit",minute:"2-digit"}):"";
      meta.appendChild(time);
      if(customer.unread){const badge=document.createElement("b");badge.className="gio-customer-unread";badge.textContent=String(customer.unread);meta.appendChild(badge);}
      row.append(avatar,info,meta);
      row.addEventListener("click",()=>{activeCustomerUid=customer.uid;customer.messages.forEach(m=>{if(m.data().senderRole==="customer")readNotificationIds.add(m.id);});saveReadStorage();renderMessages();});
      list.appendChild(row);
    });
    return;
  }

  const customer=customers.get(activeCustomerUid);
  if(!customer){activeCustomerUid=null;renderMessages();return;}
  const top=document.createElement("div");top.className="gio-chat-thread-header";
  const back=document.createElement("button");back.type="button";back.textContent="← সব কাস্টমার";
  back.addEventListener("click",()=>{activeCustomerUid=null;renderMessages();});
  const title=document.createElement("strong");title.textContent="👤 "+customer.name;
  top.append(back,title);list.appendChild(top);

  const thread=document.createElement("div");thread.className="gio-chat-thread";
  customer.messages.forEach(item=>{
    const data=item.data();
    const outgoing=data.senderRole==="admin";
    const row=document.createElement("article");row.className="gio-chat-row "+(outgoing?"gio-chat-row-outgoing":"gio-chat-row-incoming");
    const bubble=document.createElement("div");bubble.className="gio-chat-bubble";
    if(data.text){const message=document.createElement("p");message.className="gio-chat-text";message.textContent=data.text;bubble.appendChild(message);}
    appendVoicePlayer(bubble,data);
    const time=document.createElement("small");time.className="gio-chat-time";const date=data.createdAt?.toDate?.();time.textContent=date?date.toLocaleString("bn-BD"):"সময়: সদ্য";
    row.append(bubble,time);thread.appendChild(row);
  });
  list.appendChild(thread);
  const composer=document.createElement("div");composer.className="gio-chat-composer";
  const reply=document.createElement("textarea");reply.placeholder="মেসেজ লিখুন...";
  const send=document.createElement("button");send.type="button";send.textContent="📤 Send";
  send.addEventListener("click",async()=>{
    if(!reply.value.trim())return alert("মেসেজ লিখুন।");
    send.disabled=true;
    try{await addDoc(collection(db,"supportMessages"),{userUid:activeCustomerUid,senderRole:"admin",senderName:"GIO BD Admin",text:reply.value.trim(),createdAt:serverTimestamp()});reply.value="";}
    catch(error){alert("মেসেজ পাঠানো যায়নি: "+error.message);}
    finally{send.disabled=false;}
  });
  const voiceStatus=document.createElement("p");voiceStatus.className="voice-status";
  const voice=createVoiceRecorder(async(audioData,audioMimeType,audioDuration)=>{
    await addDoc(collection(db,"supportMessages"),{userUid:activeCustomerUid,senderRole:"admin",senderName:"GIO BD Admin",text:"🎤 ভয়েস মেসেজ",audioData,audioMimeType,audioDuration,audioDurationLimit:15,createdAt:serverTimestamp()});
  },voiceStatus);
  composer.append(reply,send,voice,voiceStatus);list.appendChild(composer);
  thread.scrollTop=thread.scrollHeight;
}

if (main && !document.getElementById("adminInboxPage")) {
  const button = document.createElement("button");
  button.id = "adminInboxButton";
  button.textContent = "🔔 নোটিফিকেশন";
  button.hidden = true;
  const adminPage = document.getElementById("adminPage");
  if (adminPage) adminPage.insertBefore(button, adminPage.firstChild);

  const section = document.createElement("section");
  section.id = "adminInboxPage";
  section.className = "page";
  section.hidden = true;
  section.innerHTML = '<h2>💬 Inbox</h2><p class="muted">কাস্টমারের তালিকা থেকে নাম চাপলে আলাদা Messenger-style chat খুলবে।</p><div id="adminInboxList" class="gio-chat-list">কাস্টমার লোড হচ্ছে...</div><button id="adminInboxBack" type="button">ড্যাশবোর্ডে ফিরুন</button>';
  main.appendChild(section);

  button.addEventListener("click", () => {
    adminPage.classList.remove("active");
    adminPage.hidden = true;
    section.hidden = false;
    section.classList.add("active");
    markIncomingAsRead();
  });
  document.getElementById("adminInboxBack").addEventListener("click", () => {
    section.classList.remove("active");
    section.hidden = true;
    adminPage.hidden = false;
    adminPage.classList.add("active");
  });
}

onAuthStateChanged(auth, async user => {
  const button = document.getElementById("adminInboxButton");
  if (stopListening) stopListening();
  if (stopOrdersListening) stopOrdersListening();
  currentPendingOrders = [];
  currentMessages = [];
  currentAdminUid = null;
  readNotificationIds = new Set();
  if (!user) {
    adminBottomNav.hidden = true;
    ownerActionBar.hidden = true;
    ownerTabHistory=[];currentOwnerTab="home";
    adminHelp.hidden = true;
    if (button) button.hidden = true;
    [document.getElementById("adminInboxPage"),document.getElementById("adminOffersPage"),adminOrdersPage,adminProfilePage].filter(Boolean).forEach(page=>{page.hidden=true;page.classList.remove("active");});
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", "admin"));
    const data = snap.exists() ? snap.data() : {};
    if (data.uid !== user.uid || !["admin", "owner"].includes(String(data.role || "").trim().toLowerCase())) {
      adminBottomNav.hidden = true;
      ownerActionBar.hidden = true;
      adminHelp.hidden = true;
      if (button) button.hidden = true;
      return;
    }

    currentAdminUid = user.uid;
    adminBottomNav.hidden = false;
    adminBottomNav.removeAttribute("hidden");
    adminBottomNav.style.setProperty("display","grid","important");
    adminBottomNav.style.setProperty("position","fixed","important");
    adminBottomNav.style.setProperty("left","8px","important");
    adminBottomNav.style.setProperty("right","8px","important");
    adminBottomNav.style.setProperty("bottom","max(8px, env(safe-area-inset-bottom))","important");
    adminBottomNav.style.setProperty("z-index","2147483000","important");
    adminBottomNav.style.setProperty("visibility","visible","important");
    adminBottomNav.style.setProperty("opacity","1","important");
    adminBottomNav.style.setProperty("grid-template-columns","repeat(5,minmax(0,1fr))","important");
    ownerActionBar.hidden = false;
    ownerTabHistory=[];
    let restoredTab="home";try{const saved=sessionStorage.getItem("gioOwnerLastTab");if(["home","orders","offers","inbox","settings","profile"].includes(saved))restoredTab=saved;sessionStorage.removeItem("gioOwnerLastTab");}catch(e){}
    currentOwnerTab="home";
    const pageTitle=document.getElementById("gioOwnerCurrentPage");if(pageTitle)pageTitle.textContent="GIO BD";
    loadOwnerProfile();
    const backButton=document.getElementById("gioOwnerBackButton");if(backButton)backButton.disabled=true;
    adminHelp.hidden = false;
    await refreshOwnerWhatsApp();
    readNotificationIds = readStorage(user.uid);
    if (button) button.hidden = false;
    showAdminTab(restoredTab,false);
    const list = document.getElementById("adminInboxList");
    if (!list) return;

    stopOrdersListening = onSnapshot(collection(db, "orders"), snapshot => {
      ownerOrderDocs=snapshot.docs.filter(item=>item.data().isArchived!==true).map(item=>({id:item.id,data:item.data()})).sort((a,b)=>(b.data.createdAt?.toMillis?.()||0)-(a.data.createdAt?.toMillis?.()||0));
      renderOwnerOrders();
      currentPendingOrders = snapshot.docs.filter(item => {
        const data = item.data();
        return ["Pending", "Processing"].includes(data.status || "Pending") && data.isArchived !== true;
      }).sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0));
      renderMessages();
    }, error => console.error("Pending orders inbox:", error));
    const q = query(collection(db, "supportMessages"), orderBy("createdAt", "asc"));
    stopListening = onSnapshot(q, snapshot => {
      currentMessages = snapshot.docs;
      const page = document.getElementById("adminInboxPage");
      if (page?.classList.contains("active")) markIncomingAsRead();
      else renderMessages();
    }, error => {
      list.textContent = "নোটিফিকেশন লোড হয়নি: " + error.message;
    });
  } catch (error) {
    console.error("Admin notifications:", error);
  }
});
