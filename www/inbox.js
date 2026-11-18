import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, where,
  onSnapshot, doc, getDoc, getDocs, setDoc, serverTimestamp, updateDoc, deleteDoc
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

const main = document.querySelector("main");
const adminBottomNav = document.createElement("nav");
adminBottomNav.className = "gio-admin-bottom-nav";
adminBottomNav.innerHTML = '<button type="button" data-admin-tab="settings">⚙️<span>Settings</span></button><button type="button" data-admin-tab="inbox">📥<span>Inbox</span></button><button type="button" data-admin-tab="home">🏠<span>Home</span></button><button type="button" data-admin-tab="orders">🧾<span>Order</span></button><button type="button" data-admin-tab="offers">💎<span>Package</span></button>';
adminBottomNav.hidden = true;
document.body.appendChild(adminBottomNav);
const adminProfilePage = document.createElement("section");
adminProfilePage.id = "adminProfilePage"; adminProfilePage.className = "page"; adminProfilePage.hidden = true;
adminProfilePage.innerHTML = '<div class="gio-owner-profile-shell"><section class="gio-owner-profile" aria-label="Verified GIO BD Owner"><div class="gio-owner-profile-top"><button type="button" id="gioOwnerProfileMore" aria-label="Official details">⋮</button><div class="gio-owner-frame-wrap"><img class="gio-owner-frame" src="assets/owner-profile-frame.webp" alt="Official profile frame"><span class="gio-frame-official">official</span><img id="gioOwnerDetailPhoto" class="gio-owner-frame-photo" alt="Owner profile photo" hidden><span class="gio-frame-brand">GIO BD</span><span class="gio-profile-verified" role="img" aria-label="Verified">✓</span></div><img class="gio-primary-reseller-badge" src="assets/primary-reseller.webp" alt="Primary Reseller"><strong class="gio-owner-fixed-name">GIO BD</strong><span class="gio-owner-verified-label">✓ Verified Owner</span></div></section><div id="gioOwnerOfficialPanel" class="gio-owner-official-panel" hidden>GIO BD Official</div><button type="button" id="gioOwnerProfileShare">↗ Share Profile</button><button type="button" id="gioOwnerProfileSettingsOpen">⚙️ Settings</button><button type="button" id="gioOwnerSwitchAccount">⇄ Switch Account</button><section id="gioOwnerProfileSettings" class="gio-owner-profile-settings" hidden><h3>Settings</h3><div class="order-card"><label for="gioOwnerProfilePhotoInput">📷 Profile Photo পরিবর্তন</label><input id="gioOwnerProfilePhotoInput" type="file" accept="image/*"></div><label><input type="checkbox" id="gioOwnerHidePhoto"> Profile Photo Hide</label><label><input type="checkbox" id="gioOwnerHideOnline"> Online Status Hide</label><label><input type="checkbox" id="gioOwnerDisableSeen"> Seen / Read Receipt Off</label><div class="order-card"><strong>Help & Support</strong><a href="mailto:mdniloy41212@gmail.com">Gmail Support</a><a id="gioOwnerProfileWhatsApp" href="#" target="_blank" rel="noopener">WhatsApp Support</a><a href="https://www.facebook.com/profile.php?id=61582121766890" target="_blank" rel="noopener">Facebook Page</a></div><button type="button" id="gioOwnerProfileLogout">🚪 Logout</button></section><button type="button" id="gioOwnerProfileBack">← Back</button></div>';
main?.appendChild(adminProfilePage);

const ownerProfileUiStyle=document.createElement("style");ownerProfileUiStyle.textContent=`
#adminProfilePage{overflow-y:auto!important}.gio-owner-profile-shell{display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 4px 90px}
.gio-owner-profile-top{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;padding:14px;border-radius:22px;background:linear-gradient(145deg,#173b68,#31205c);border:1px solid #ffe08a77}
#gioOwnerProfileMore{position:absolute;right:10px;top:8px;width:38px;height:38px;border-radius:50%;font-size:24px}
.gio-owner-profile-shell>.gio-owner-profile{width:100%;margin:0}.gio-owner-profile-shell .gio-owner-profile{display:flex;flex-direction:column;align-items:center}
.gio-owner-official-panel{width:100%;padding:15px;text-align:center;border-radius:13px;background:#fff;color:#182746;font-weight:900}
.gio-owner-profile-shell>button{width:100%;padding:12px}.gio-owner-profile-settings{width:100%}.gio-owner-profile-settings label{display:flex;gap:8px;align-items:center;margin:12px 0}
#gioOwnerOfficialPanel[hidden],#gioOwnerProfileSettings[hidden]{display:none!important}
`;document.head.appendChild(ownerProfileUiStyle);
document.getElementById("gioOwnerProfileMore")?.addEventListener("click",()=>{const panel=document.getElementById("gioOwnerOfficialPanel");panel.hidden=!panel.hidden;});
for(const [id,key] of [["gioOwnerHidePhoto","gioOwnerHidePhoto"],["gioOwnerHideOnline","gioOwnerHideOnline"],["gioOwnerDisableSeen","gioOwnerDisableSeen"]]){const el=document.getElementById(id);if(el)el.checked=localStorage.getItem(key)==="true";}
document.getElementById("gioOwnerProfileSettingsOpen")?.addEventListener("click",()=>{const panel=document.getElementById("gioOwnerProfileSettings");panel.hidden=!panel.hidden;});
document.getElementById("gioOwnerProfileShare")?.addEventListener("click",async()=>{const shareText="GIO BD Official — Verified Owner";try{if(navigator.share)await navigator.share({title:"GIO BD Official",text:shareText});else{await navigator.clipboard.writeText(shareText);alert("GIO BD Official কপি হয়েছে।");}}catch(error){if(error.name!=="AbortError")alert("Share করা যায়নি।");}});
document.getElementById("gioOwnerSwitchAccount")?.addEventListener("click",async()=>{if(!confirm("অন্য অনুমোদিত Owner Account দিয়ে লগইন করবেন?"))return;await (await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js")).signOut(auth);document.getElementById("loginNav")?.click();});
document.getElementById("gioOwnerProfileBack")?.addEventListener("click",()=>showAdminTab("home"));
document.getElementById("gioOwnerHidePhoto")?.addEventListener("change",e=>localStorage.setItem("gioOwnerHidePhoto",String(e.target.checked)));
document.getElementById("gioOwnerHideOnline")?.addEventListener("change",e=>localStorage.setItem("gioOwnerHideOnline",String(e.target.checked)));
document.getElementById("gioOwnerDisableSeen")?.addEventListener("change",e=>localStorage.setItem("gioOwnerDisableSeen",String(e.target.checked)));

const adminContactPage = document.createElement("section");
adminContactPage.id = "adminContactPage"; adminContactPage.className = "page"; adminContactPage.hidden = true;
adminContactPage.innerHTML = '<h2>👥 Agent Contact</h2><div class="order-card"><strong>মোট এজেন্ট</strong><p id="gioOwnerTotalCustomers">লোড হচ্ছে…</p><strong>🟢 অনলাইন এজেন্ট</strong><p id="gioOwnerOnlineCustomers">যাচাই হচ্ছে…</p></div><input id="gioOwnerContactSearch" type="search" placeholder="Agent ID, নাম বা Gmail দিয়ে খুঁজুন"><div id="gioOwnerContactList">এজেন্ট তালিকা লোড হচ্ছে…</div><section id="gioOwnerUserChat" class="order-card gio-owner-chat-screen" hidden><header class="gio-owner-chat-header"><div id="gioOwnerChatAvatar" class="gio-owner-chat-avatar">U</div><div class="gio-owner-chat-heading"><strong id="gioOwnerChatTitle">Customer</strong><small>Customer Chat</small></div><button type="button" id="gioOwnerChatRefresh" aria-label="Refresh chat">↻</button><button type="button" id="gioOwnerCustomerMore" aria-label="Customer profile">⋮</button><button type="button" id="gioOwnerChatSettings" aria-label="Owner settings">⚙</button></header><div id="gioOwnerCustomerProfilePanel" class="gio-owner-customer-profile" hidden></div><div id="gioOwnerChatSettingsPanel" class="gio-owner-chat-settings" hidden>GIO BD Agent Official</div><div id="gioOwnerUserChatMessages"></div><textarea id="gioOwnerChatText" placeholder="Type"></textarea><button type="button" id="gioOwnerChatSend">Send</button><p id="gioOwnerChatSendStatus" aria-live="polite"></p><div id="gioOwnerChatVoiceStatus" class="voice-status"></div><button type="button" id="gioOwnerChatClose">চ্যাট বন্ধ করুন</button></section>';
main?.appendChild(adminContactPage);
let stopOwnerContacts = null;
let stopOwnerChat = null;
let activeContactUid = null;
 let activeContactProfile = {};
function isContactOnline(data){const last=data.lastSeenAt?.toDate?.()?.getTime?.()||0;return data.isOnline===true&&last>0&&(Date.now()-last)<120000;}
function attachOwnerMessageDelete(card,item) {
 let holdTimer=null;
 const cancelHold=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}};
 card.addEventListener("pointerdown",()=>{cancelHold();holdTimer=setTimeout(()=>{
  if(card.querySelector(".gio-owner-message-delete"))return;
  const button=document.createElement("button");button.type="button";button.className="gio-owner-message-delete";button.textContent="Delete";
  button.addEventListener("click",async event=>{event.stopPropagation();button.disabled=true;try{await deleteDoc(doc(db,"supportMessages",item.id));}catch(error){button.disabled=false;button.textContent="Delete failed";}});
  card.appendChild(button);
 },2000);});
 ["pointerup","pointercancel","pointerleave"].forEach(name=>card.addEventListener(name,cancelHold));
}
function openOwnerUserChat(uid, profile) {
 activeContactUid = uid;
  activeContactProfile = profile || {};
 const panel = document.getElementById("gioOwnerUserChat");
  const refreshButton=panel?.querySelector("#gioOwnerChatRefresh"); if(refreshButton)refreshButton.onclick=()=>{if(activeContactUid)openOwnerUserChat(activeContactUid,activeContactProfile);};
 const voiceStatus=document.getElementById("gioOwnerChatVoiceStatus");
 const oldVoice=document.getElementById("gioOwnerChatVoiceButton");oldVoice?.remove();
 const voice=createOwnerContactVoice(uid,voiceStatus);voice.id="gioOwnerChatVoiceButton";voiceStatus?.insertAdjacentElement("afterend",voice);
 if (!panel) return;
 panel.hidden = false;
 const customerName=profile.displayName||profile.name||profile.email||"কাস্টমার";
 const contactPhoto=profile.hideProfilePhoto===true?"":(profile.avatar||profile.photoURL||"");
 document.getElementById("gioOwnerChatTitle").textContent=customerName;
 const avatar=document.getElementById("gioOwnerChatAvatar");
 avatar.textContent=String(customerName).trim().charAt(0).toUpperCase()||"U";
 if(contactPhoto){const image=document.createElement("img");image.src=contactPhoto;image.alt="";avatar.replaceChildren(image);}
 const profilePanel=document.getElementById("gioOwnerCustomerProfilePanel");
 const moreButton=document.getElementById("gioOwnerCustomerMore");
 const settingsButton=document.getElementById("gioOwnerChatSettings");
 const settingsPanel=document.getElementById("gioOwnerChatSettingsPanel");
 moreButton.onclick=()=>{profilePanel.hidden=!profilePanel.hidden;settingsPanel.hidden=true;};
 settingsButton.onclick=()=>{settingsPanel.hidden=!settingsPanel.hidden;profilePanel.hidden=true;};
 profilePanel.replaceChildren();
 const profilePhoto=document.createElement("div");profilePhoto.className="gio-owner-profile-large-avatar";
 if(contactPhoto){const image=document.createElement("img");image.src=contactPhoto;image.alt="";profilePhoto.appendChild(image);}else profilePhoto.textContent=String(customerName).charAt(0).toUpperCase();
 const profileName=document.createElement("strong");profileName.textContent=customerName;
 const numericId=(String(profile.profileId||"").match(/[0-9]+/g)||[]).join("");
 const profileId=document.createElement("small");profileId.textContent=numericId||"Numeric ID এখনো তৈরি হয়নি";
 profilePanel.append(profilePhoto,profileName,profileId);
 const messages = document.getElementById("gioOwnerUserChatMessages");
 if(!panel.dataset.pullRefreshBound){let touchStartY=0;panel.addEventListener("touchstart",event=>{touchStartY=event.touches?.[0]?.clientY||0;},{passive:true});panel.addEventListener("touchend",event=>{const endY=event.changedTouches?.[0]?.clientY||0;if(endY-touchStartY>85&&messages?.scrollTop<=0&&activeContactUid)openOwnerUserChat(activeContactUid,activeContactProfile);},{passive:true});panel.dataset.pullRefreshBound="1";}
 messages.textContent = "চ্যাট লোড হচ্ছে…";
 if (stopOwnerChat) stopOwnerChat();
 const q = query(collection(db,"supportMessages"),where("userUid","==",uid));
 stopOwnerChat = onSnapshot(q,snap=>{
  messages.replaceChildren();
  const rows=snap.docs.slice().sort((a,b)=>(a.data().createdAt?.toMillis?.()||0)-(b.data().createdAt?.toMillis?.()||0));
  let previousDay="";
  rows.forEach(item=>{
   const d=item.data();
   const messageDate=d.createdAt?.toDate?.();
   const dayKey=messageDate?[messageDate.getFullYear(),messageDate.getMonth(),messageDate.getDate()].join("-"):"";
   if(dayKey&&dayKey!==previousDay){const divider=document.createElement("div");divider.className="gio-owner-chat-date-divider";divider.textContent=messageDate.toLocaleDateString("bn-BD",{day:"numeric",month:"long",year:"numeric"});messages.appendChild(divider);previousDay=dayKey;}
   if(d.senderRole!=="admin"&&!d.readAt){
    updateDoc(doc(db,"supportMessages",item.id),{readAt:serverTimestamp()})
      .catch(error=>console.warn("Owner chat read receipt could not be saved:",error));
   }
   const card=document.createElement("article");
   card.className="gio-owner-chat-message "+(d.senderRole==="admin"?"gio-owner-chat-outgoing":"gio-owner-chat-incoming");
   const who=document.createElement("strong");
   who.className="gio-owner-chat-sender";
   who.textContent=d.senderRole==="admin"?"GIO BD Owner":"Agent";
   const body=document.createElement("p");body.className="gio-owner-chat-text";body.textContent=d.text||"";
   const time=document.createElement("small");time.className="gio-owner-chat-time";time.textContent=d.createdAt?.toDate?.().toLocaleTimeString("bn-BD",{hour:"numeric",minute:"2-digit"})||"";
   card.append(who,body);appendVoicePlayer(card,d);
   if(d.senderRole==="admin"){
    const receipt=document.createElement("small");receipt.className="gio-owner-chat-receipt"+(d.readAt?" is-seen":"");
    receipt.textContent=d.readAt?"Seen ✓✓":"Sent ✓";card.append(receipt);
   }
   card.append(time);attachOwnerMessageDelete(card,item);messages.appendChild(card);
  });
  if(!rows.length) messages.textContent="এখনো কোনো মেসেজ নেই।";
  messages.scrollTop=messages.scrollHeight;
 },err=>messages.textContent="চ্যাট লোড হয়নি: "+err.message);
}
function createOwnerContactVoice(uid,status){
 return createVoiceRecorder(async(audioData,audioMimeType,audioDuration)=>{
  await addDoc(collection(db,"supportMessages"),{userUid:uid,senderRole:"admin",senderName:"GIO BD Owner",text:"🎤 ভয়েস মেসেজ",audioData,audioMimeType,audioDuration,audioDurationLimit:15,createdAt:serverTimestamp()});
 },status);
}
async function loadOwnerContacts(){
 const list=document.getElementById("gioOwnerContactList");
 const total=document.getElementById("gioOwnerTotalCustomers");
 const online=document.getElementById("gioOwnerOnlineCustomers");
 if(!list)return;
 if(stopOwnerContacts)stopOwnerContacts();
 list.textContent="কাস্টমার তালিকা লোড হচ্ছে…";
 try{
  stopOwnerContacts=onSnapshot(collection(db,"customerProfiles"),snap=>{
   const users=snap.docs.map(item=>({id:item.id,data:item.data()}));
   if(total)total.textContent=String(users.length);
   const onlineCount=users.filter(u=>u.data.hideOnlineStatus!==true&&isContactOnline(u.data)).length;
   if(online)online.textContent=String(onlineCount);
   list.replaceChildren();
   if(!users.length){list.textContent="এখনো কোনো কাস্টমার প্রোফাইল নেই।";return;}
   const term=String(document.getElementById("gioOwnerContactSearch")?.value||"").trim().toLowerCase();
   users.sort((a,b)=>String(a.data.displayName||a.data.email||"").localeCompare(String(b.data.displayName||b.data.email||"")));
   users.filter(({id,data})=>!term||[id,data.profileId,data.displayName,data.email].some(value=>String(value||"").toLowerCase().includes(term))).forEach(({id,data})=>{
    const card=document.createElement("article");card.className="gio-contact-user-card";
    const avatar=document.createElement("div");avatar.className="gio-contact-avatar";
    const contactPhoto=data.hideProfilePhoto===true?"":(data.avatar||data.photoURL||"");
    if(contactPhoto){const img=document.createElement("img");img.src=contactPhoto;img.alt="";avatar.appendChild(img);}
    else avatar.textContent=String(data.displayName||data.name||data.email||"U").charAt(0).toUpperCase();
    const contactOnline=data.hideOnlineStatus!==true&&isContactOnline(data);
    if(contactOnline){const dot=document.createElement("i");dot.className="gio-contact-online-dot";dot.title="Online";avatar.appendChild(dot);}
    const info=document.createElement("div");info.className="gio-contact-user-info";
    const name=document.createElement("strong");name.textContent=data.displayName||data.name||data.email||"GIO BD User";
    const email=document.createElement("small");email.textContent=data.email||"ইমেইল পাওয়া যায়নি";
    const profileId=document.createElement("small");profileId.textContent="Agent Profile ID: "+(data.profileId||"এখনো তৈরি হয়নি");
    const state=document.createElement("small");state.textContent=data.hideOnlineStatus===true?"Online Status Hidden":(contactOnline?"Online":"Offline");
    info.append(name,email,profileId,state);
    const chat=document.createElement("button");chat.type="button";chat.textContent="Chat";chat.addEventListener("click",()=>openOwnerUserChat(id,data));
    card.append(avatar,info,chat);list.appendChild(card);
   });
  },err=>{list.textContent="কাস্টমার তালিকা পড়া যায়নি: "+err.message;});
 }catch(error){console.error("Owner contacts:",error);list.textContent="কাস্টমার তালিকা পড়া যায়নি: "+error.message;}
}

const adminNavStyle = document.createElement("style");
adminNavStyle.textContent = '.gio-admin-bottom-nav{position:fixed;z-index:1100;left:8px;right:8px;bottom:8px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:8px;border:1px solid #70ddff55;border-radius:18px;background:#0c1738f2;backdrop-filter:blur(14px);box-shadow:0 12px 32px #0009}.gio-admin-bottom-nav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:7px 2px;min-height:52px;font-size:18px;background:linear-gradient(145deg,#174a83,#34206e)}.gio-admin-bottom-nav button span{font-size:10px}body{padding-bottom:90px}.gio-admin-help{position:fixed;right:14px;bottom:98px;z-index:1099;border:2px solid #9ef7ff;border-radius:40px;padding:13px 17px;background:linear-gradient(135deg,#00a6c7,#6534c9);font-weight:800;box-shadow:0 0 22px #00cfff88;animation:gioOwnerBounce 1.8s infinite}.gio-admin-help-panel{position:fixed;right:14px;bottom:155px;z-index:1100;width:min(260px,calc(100vw - 28px));padding:14px;border-radius:16px;background:#101735f5;border:1px solid #78eaff66}.gio-admin-help-panel a{display:block;padding:11px;margin:7px 0;border-radius:10px;color:white;text-decoration:none;background:#176fba;text-align:center}@keyframes gioOwnerBounce{50%{transform:translateY(-8px)}}';
adminNavStyle.textContent += '.gio-owner-page-back{display:inline-flex;align-items:center;margin:4px 0 14px;padding:10px 15px;border:1px solid #70ddff66;border-radius:12px;background:linear-gradient(135deg,#174a83,#34206e);color:#fff;font-weight:700}.gio-admin-bottom-nav button.is-active{outline:2px solid #ffd66b;background:linear-gradient(145deg,#72521a,#5a327f);box-shadow:0 0 14px #ffd66b55}.admin-order-alert{display:block;width:100%;margin:0 0 12px;padding:13px;border:1px solid #ffcf6a88;border-radius:13px;background:linear-gradient(110deg,#9a4b13,#6234a8);font-weight:800}.notification-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;margin-left:6px;padding:0 6px;border-radius:20px;background:#ff3158;color:#fff;font-size:11px;font-weight:900}.notification-count[hidden]{display:none!important}';
document.head.appendChild(adminNavStyle);

const ownerProfileShortcut=document.getElementById("gioOwnerProfileShortcut");
const ownerHomeAdSlot=document.querySelector(".gio-owner-ad-slot");
const loginAdTemplate=document.querySelector("#loginPage .gio-five-second-ad");
if(ownerHomeAdSlot&&loginAdTemplate){
 const homeAd=loginAdTemplate.cloneNode(true);
 homeAd.classList.add("gio-home-ad");
 homeAd.setAttribute("aria-label","GIO BD animated advertisement, shown for five seconds with a two-second pause");
 const adCount=homeAd.querySelector(".gio-ad-count");
 if(adCount)adCount.textContent="5 SEC • GIO BD";
 ownerHomeAdSlot.replaceChildren(homeAd);
}

ownerProfileShortcut?.addEventListener("click",()=>{showAdminTab("profile");const photo=document.getElementById("gioOwnerDetailPhoto");try{const saved=localStorage.getItem("gioOwnerProfilePhoto");if(saved&&photo){photo.src=saved;photo.hidden=false;}}catch(error){console.warn("Owner detail photo restore failed",error);}});
const ownerPhotoInput=document.getElementById("gioOwnerProfilePhotoInput");
const ownerFramePhoto=document.getElementById("gioOwnerDetailPhoto");
try{const savedPhoto=localStorage.getItem("gioOwnerProfilePhoto");if(savedPhoto&&ownerFramePhoto){ownerFramePhoto.src=savedPhoto;ownerFramePhoto.hidden=false;}}catch(error){console.warn("Owner profile photo restore failed",error);}
async function compressOwnerProfilePhoto(file){
 return new Promise((resolve,reject)=>{
  if(!file||!file.type.startsWith("image/"))return reject(new Error("শুধু ছবি নির্বাচন করুন।"));
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error("ছবি পড়া যায়নি।"));
  reader.onload=()=>{
   const image=new Image();
   image.onerror=()=>reject(new Error("ছবি খোলা যায়নি।"));
   image.onload=()=>{
    const canvas=document.createElement("canvas");
    const scale=Math.min(1,480/Math.max(image.width,image.height));
    canvas.width=Math.max(1,Math.round(image.width*scale));
    canvas.height=Math.max(1,Math.round(image.height*scale));
    const context=canvas.getContext("2d");
    if(!context)return reject(new Error("ছবি প্রস্তুত করা যায়নি।"));
    context.drawImage(image,0,0,canvas.width,canvas.height);
    resolve(canvas.toDataURL("image/jpeg",0.72));
   };
   image.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}
ownerPhotoInput?.addEventListener("change",async()=>{
 const file=ownerPhotoInput.files?.[0];if(!file||!ownerFramePhoto)return;
 try{
  const user=auth.currentUser;
  if(!user)throw new Error("আগে অনুমোদিত Owner Account দিয়ে লগইন করুন।");
  const authSnap=await getDoc(doc(db,"users","admin"));
  const authData=authSnap.exists()?authSnap.data():{};
  const role=String(authData.role||"").trim().toLowerCase();
  if(authData.uid!==user.uid||!["admin","owner"].includes(role))throw new Error("এই অ্যাকাউন্টে Owner Profile পরিবর্তনের অনুমতি নেই।");
  const photo=await compressOwnerProfilePhoto(file);
  await setDoc(doc(db,"settings","ownerProfile"),{displayName:"GIO BD",name:"GIO BD",photoURL:photo,avatar:photo,updatedAt:serverTimestamp()},{merge:true});
  localStorage.setItem("gioOwnerProfilePhoto",photo);
  ownerFramePhoto.src=photo;ownerFramePhoto.hidden=false;
  const inboxPhoto=document.getElementById("gioInboxOwnerPhoto");
  if(inboxPhoto){inboxPhoto.src=photo;inboxPhoto.hidden=false;}
 }catch(error){alert("Profile Photo সংরক্ষণ হয়নি: "+error.message);}
 finally{ownerPhotoInput.value="";}
});

const contactStyle=document.createElement("style");contactStyle.textContent=".gio-contact-user-card{display:flex;align-items:center;gap:11px;padding:12px;margin:9px 0;border:1px solid #71dfff44;border-radius:15px;background:#101a3dcc}.gio-contact-avatar{position:relative;flex:0 0 48px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#1b80a7,#51318d);font-size:20px;font-weight:800}.gio-contact-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}.gio-contact-online-dot{position:absolute;width:13px;height:13px;right:-1px;bottom:0;border:2px solid #101a3d;border-radius:50%;background:#21df70;box-shadow:0 0 9px #21df70}.gio-contact-user-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.gio-contact-user-info small{font-size:11px;overflow-wrap:anywhere;color:#b9d8f5}.gio-contact-user-card button{padding:9px 12px}.gio-owner-page-back{position:relative}";document.head.appendChild(contactStyle);
 
const ownerChatStyle=document.createElement("style");
ownerChatStyle.textContent=`
 #gioOwnerUserChatMessages{display:flex;flex-direction:column;align-items:stretch;gap:8px;max-height:42vh;overflow-y:auto;padding:8px;margin:8px 0;border:1px solid #78dfff33;border-radius:13px;background:#07152c}
 .gio-owner-chat-message{display:flex;flex-direction:column;width:max-content;max-width:84%;padding:8px 11px;border-radius:13px;box-sizing:border-box;overflow-wrap:anywhere}
 .gio-owner-chat-outgoing{align-self:flex-end;text-align:right;background:#123f70;border:1px solid #3bb8ff88}
 .gio-owner-chat-incoming{align-self:flex-start;text-align:left;background:#25234c;border:1px solid #a58cff66}
 .gio-owner-chat-sender{font-size:11px;color:#d5eaff}
 .gio-owner-chat-text{white-space:pre-wrap;margin:3px 0;font-size:14px}
 .gio-owner-chat-time,.gio-owner-chat-receipt{font-size:9px;opacity:.85}
 .gio-owner-chat-receipt{color:#d6eaff}.gio-owner-chat-receipt.is-seen{color:#45dcff;font-weight:800}
 .gio-owner-chat-screen{position:fixed!important;inset:0!important;z-index:3000!important;margin:0!important;width:100%!important;max-width:none!important;max-height:100dvh!important;overflow:auto!important;border-radius:0!important;background:#08152c!important;padding:12px!important;box-sizing:border-box!important}
 .gio-owner-chat-header{display:flex;align-items:center;gap:10px;padding:8px 2px 12px;border-bottom:1px solid #ffffff22}.gio-owner-chat-avatar,.gio-owner-profile-large-avatar{width:44px;height:44px;flex:0 0 44px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#1877a8,#51318d);font-weight:800}.gio-owner-chat-avatar img,.gio-owner-profile-large-avatar img{width:100%;height:100%;object-fit:cover}.gio-owner-chat-heading{display:flex;flex:1;min-width:0;flex-direction:column}.gio-owner-chat-heading small{font-size:10px;opacity:.7}.gio-owner-chat-header button{min-width:38px;padding:7px;font-size:18px}.gio-owner-customer-profile,.gio-owner-chat-settings{padding:12px;margin:8px 0;border-radius:12px;background:#fff;color:#14213b;text-align:center}.gio-owner-customer-profile{display:flex;align-items:center;justify-content:center;gap:8px;flex-direction:column}.gio-owner-message-delete{align-self:flex-end;margin-top:5px;padding:4px 10px;border:1px solid #ff8b9b;border-radius:8px;background:#6b1d32;color:#fff;font-size:11px}.gio-owner-chat-date-divider{align-self:center;margin:12px auto 6px;padding:4px 11px;border-radius:20px;background:#ffffff18;color:#c9d8ec;font-size:10px;font-weight:700}
 #gioOwnerChatSendStatus{font-size:11px;min-height:15px;margin:3px 0;color:#bdeaff}
`;
document.head.appendChild(ownerChatStyle);

const adminHelp = document.createElement("button"); adminHelp.type="button"; adminHelp.className="gio-admin-help"; adminHelp.textContent="☎ Help";
const adminHelpPanel = document.createElement("div"); adminHelpPanel.className="gio-admin-help-panel"; adminHelpPanel.hidden=true;
adminHelpPanel.innerHTML='<strong>GIO BD Owner Support</strong><a id="gioOwnerWhatsApp" href="#" target="_blank" rel="noopener">WhatsApp</a><a href="https://www.facebook.com/profile.php?id=61582121766890" target="_blank" rel="noopener">Facebook Page</a><a href="mailto:mdniloy41212@gmail.com">Gmail</a>';
adminHelp.hidden = true;
document.body.append(adminHelp,adminHelpPanel);
adminHelp.addEventListener("click",()=>{adminHelpPanel.hidden=!adminHelpPanel.hidden;});
document.addEventListener("click",event=>{
  if(event.target?.id==="gioOwnerProfileLogout") document.getElementById("logoutBtn")?.click();
});
async function refreshOwnerWhatsApp(){try{const snap=await getDoc(doc(db,"settings","supportContact"));const num=snap.exists()?String(snap.data().whatsappNumber||"").replace(/\\D/g,""):"";const link=document.getElementById("gioOwnerWhatsApp");if(link)link.href=num?"https://wa.me/"+num:"#";const profileLink=document.getElementById("gioOwnerProfileWhatsApp");if(profileLink)profileLink.href=num?"https://wa.me/"+num:"#";}catch(e){console.warn("WhatsApp contact unavailable",e);}}
refreshOwnerWhatsApp();
function setOwnerAvatar(element, user) {
  if (!element) return;
  const photo = user?.photoURL;
  if (photo) {
    const img = document.createElement("img");
    img.src = photo;
    img.alt = "Owner profile photo";
    img.referrerPolicy = "no-referrer";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block";
    element.replaceChildren(img);
  } else {
    element.textContent = user ? (user.displayName || user.email || "O").charAt(0).toUpperCase() : "👤";
  }
}

const ownerPageHistory = [];
let activeOwnerTab = "home";
function goBackOwnerPage() {
 const previous = ownerPageHistory.pop();
 showAdminTab(previous || "home", { fromBack: true });
}
window.addEventListener("popstate", () => goBackOwnerPage());
function showAdminTab(tab, options = {}){
 const login=document.getElementById("loginPage"), dash=document.getElementById("adminPage"), settings=document.getElementById("adminSettingsPage"), inbox=document.getElementById("adminInboxPage"), contacts=adminContactPage;
 adminBottomNav.querySelectorAll("[data-admin-tab]").forEach(button=>button.classList.toggle("is-active",button.dataset.adminTab===tab));
 [login,dash,settings,inbox,adminProfilePage,contacts].filter(Boolean).forEach(p=>{p.classList.remove("active");p.hidden=true;});
 if(tab==="home"&&dash){dash.hidden=false;dash.classList.add("active");}
 if(tab==="orders"&&dash){dash.hidden=false;dash.classList.add("active");document.getElementById("adminOrders")?.scrollIntoView({behavior:"smooth",block:"start"});}
 if(tab==="offers"&&settings){settings.hidden=false;settings.classList.add("active");document.getElementById("adminPackages")?.scrollIntoView({behavior:"smooth",block:"start"});}
 if(tab==="support"){const trigger=document.getElementById("adminInboxButton");if(trigger&&!trigger.hidden)trigger.click();else if(dash){dash.hidden=false;dash.classList.add("active");}}
 if(tab==="manage"&&settings){settings.hidden=false;settings.classList.add("active");document.getElementById("adminPackages")?.scrollIntoView({behavior:"smooth",block:"start"});}
 if(tab==="settings"&&settings){settings.hidden=false;settings.classList.add("active");}
 if(tab==="profile"){adminProfilePage.hidden=false;adminProfilePage.classList.add("active");const email=document.getElementById("gioOwnerProfileEmail");if(email)email.textContent=auth.currentUser?.email||"Admin account";}
 if(tab==="contact"){contacts.hidden=false;contacts.classList.add("active");loadOwnerContacts();}
 if(tab==="inbox"){contacts.hidden=false;contacts.classList.add("active");loadOwnerContacts();}
 if (!options.fromBack && activeOwnerTab !== tab) {
   ownerPageHistory.push(activeOwnerTab);
   try { history.pushState({ gioOwnerTab: tab }, "", "#owner-" + tab); } catch {}
 }
 activeOwnerTab = tab;
 const orderOnly=[dash?.querySelector(".order-filters"),dash?.querySelector("#adminOrders"),...(dash?[...dash.querySelectorAll("h2,h3")].filter(el=>/ড্যাশবোর্ড|Pending \/ Processing Orders/.test(el.textContent||"")):[])].filter(Boolean);
 orderOnly.forEach(el=>{el.hidden=tab!=="orders";});
 if(orderAlertButton)orderAlertButton.hidden=tab!=="orders";
 const visiblePage = [dash, settings, inbox, adminProfilePage, contacts].find(page => page && !page.hidden && page.classList.contains("active"));
 if (visiblePage && visiblePage.id !== "adminPage" && !visiblePage.querySelector(".gio-owner-page-back")) {
   const back = document.createElement("button");
   back.type = "button";
   back.className = "gio-owner-page-back";
   back.textContent = "← ফিরে যান";
   back.addEventListener("click", goBackOwnerPage);
   visiblePage.prepend(back);
 }
}
document.getElementById("gioOwnerChatSend")?.addEventListener("click",async()=>{
 const input=document.getElementById("gioOwnerChatText"),button=document.getElementById("gioOwnerChatSend"),status=document.getElementById("gioOwnerChatSendStatus");
 if(!activeContactUid||!input?.value.trim())return;
 const textValue=input.value.trim();button.disabled=true;if(status)status.textContent="মেসেজ পাঠানো হচ্ছে…";
 try{
  await addDoc(collection(db,"supportMessages"),{userUid:activeContactUid,senderRole:"admin",senderName:"GIO BD Owner",text:textValue,createdAt:serverTimestamp()});
  input.value="";if(status)status.textContent="মেসেজ পাঠানো হয়েছে ✓";
 }catch(e){console.error("Owner chat send failed:",e);if(status)status.textContent="মেসেজ পাঠানো যায়নি: "+(e.code||e.message);}
 finally{button.disabled=false;}
});
document.getElementById("gioOwnerChatText")?.addEventListener("keydown",event=>{
 if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();document.getElementById("gioOwnerChatSend")?.click();}
});

document.getElementById("gioOwnerChatClose")?.addEventListener("click",()=>{document.getElementById("gioOwnerUserChat").hidden=true;if(stopOwnerChat)stopOwnerChat();activeContactUid=null;});
adminBottomNav.addEventListener("click",event=>{const button=event.target.closest("[data-admin-tab]");if(button)showAdminTab(button.dataset.adminTab);});
document.querySelector("header nav")?.addEventListener("click",event=>{const button=event.target.closest("[data-admin-tab]");if(button)showAdminTab(button.dataset.adminTab);});
let stopOrderAlertsListening = null;
let unreadOrderIds = new Set();
let orderAlertIds = new Set();
const orderAlertButton = document.createElement("button");
orderAlertButton.type = "button";
orderAlertButton.id = "adminOrderAlertButton";
orderAlertButton.className = "admin-order-alert";
orderAlertButton.hidden = true;
orderAlertButton.innerHTML = '🛎️ New Orders <span id="adminOrderAlertBadge" class="notification-count" hidden>0</span>';
document.getElementById("adminPage")?.insertBefore(orderAlertButton, document.getElementById("adminPage").firstChild);
const orderReadKey = uid => "gioAdminReadOrders:" + uid;
function renderOrderAlertBadge() {
  const badge = document.getElementById("adminOrderAlertBadge");
  if (!badge) return;
  const count = unreadOrderIds.size;
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.hidden = count === 0;
  orderAlertButton.setAttribute("aria-label", count + " unread new orders");
}
orderAlertButton.addEventListener("click", () => {
  if (currentAdminUid) {
    try { localStorage.setItem(orderReadKey(currentAdminUid), JSON.stringify([...orderAlertIds])); } catch {}
  }
  unreadOrderIds.clear();
  renderOrderAlertBadge();
  const inbox = document.getElementById("adminInboxPage");
  const settings = document.getElementById("adminSettingsPage");
  if (inbox) { inbox.hidden = true; inbox.classList.remove("active"); }
  if (settings) { settings.hidden = true; settings.classList.remove("active"); }
  const dash = document.getElementById("adminPage");
  if (dash) { dash.hidden = false; dash.classList.add("active"); }
  document.getElementById("adminOrders")?.scrollIntoView({behavior:"smooth",block:"start"});
});
function startOrderAlerts(uid) {
  if (stopOrderAlertsListening) stopOrderAlertsListening();
  let read = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(orderReadKey(uid)) || "[]");
    if (Array.isArray(saved)) read = new Set(saved);
  } catch {}
  stopOrderAlertsListening = onSnapshot(collection(db,"orders"), snapshot => {
    orderAlertIds = new Set(snapshot.docs.map(item => item.id));
    unreadOrderIds = new Set(snapshot.docs.filter(item => {
      const d=item.data();
      return !read.has(item.id) && !d.isArchived && ["Pending","Processing",undefined].includes(d.status);
    }).map(item => item.id));
    renderOrderAlertBadge();
  }, error => console.warn("Order alerts unavailable:",error));
}

let stopListening;
let currentMessages = [];
let currentAdminUid = null;
let readNotificationIds = new Set();
let activeInboxTab = "customer";

function createVoiceRecorder(onReady, statusElement) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "voice-record-button";
  button.textContent = "🎙️ ভয়েস রেকর্ড";
  let recorder = null;
  let stream = null;
  let chunks = [];
  let timer = null;
  let startedAt = 0;
  let busy = false;

  button.addEventListener("click", async () => {
    if (busy) return;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      button.textContent = "অডিও তৈরি হচ্ছে...";
      button.disabled = true;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      statusElement.textContent = "এই ডিভাইসে ভয়েস রেকর্ডিং সমর্থিত নয়।";
      return;
    }
    try {
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
        stream?.getTracks().forEach(track => track.stop());
        stream = null;
        busy = true;
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
          const duration = Math.min(15, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
          await onReady(dataUrl, blob.type || recorder.mimeType || "audio/webm", duration);
          statusElement.textContent = "ভয়েস মেসেজ পাঠানো হয়েছে।";
        } catch (error) {
          statusElement.textContent = "ভয়েস মেসেজ পাঠানো যায়নি: " + error.message;
        } finally {
          busy = false;
          button.disabled = false;
          button.textContent = "🎙️ আবার রেকর্ড";
          recorder = null;
          chunks = [];
        }
      };
      startedAt = Date.now();
      recorder.start();
      button.textContent = "⏹️ রেকর্ড বন্ধ করুন";
      statusElement.textContent = "রেকর্ড হচ্ছে... সর্বোচ্চ ১৫ সেকেন্ড।";
      timer = setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, 15000);
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
      statusElement.textContent = "মাইক্রোফোন চালু হয়নি: " + error.message;
    }
  });
  return button;
}

function attachReactiveVoiceWaveform(player, canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const bars = 28;
  const drawIdle = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#8bcfff";
    for (let i = 0; i < bars; i++) {
      const h = 3;
      context.fillRect(i * (canvas.width / bars) + 1, (canvas.height - h) / 2, Math.max(1, canvas.width / bars - 3), h);
    }
  };
  drawIdle();
  let audioContext = null;
  let frame = 0;
  let analyser = null;
  let source = null;
  let bins = null;
  let disposed = false;
  const stopVisual = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    drawIdle();
  };
  player.addEventListener("play", async () => {
    if (disposed) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioContext) {
        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.72;
        bins = new Uint8Array(analyser.frequencyBinCount);
        source = audioContext.createMediaElementSource(player);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }
      if (audioContext.state === "suspended") await audioContext.resume();
      if (disposed || player.paused) return;
      const render = () => {
        if (disposed || player.paused || player.ended) {
          stopVisual();
          return;
        }
        analyser.getByteFrequencyData(bins);
        const peak = bins.reduce((sum, value) => sum + value, 0) / bins.length / 255;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const width = canvas.width / bars;
        for (let i = 0; i < bars; i++) {
          const sample = bins[Math.min(bins.length - 1, Math.floor(i * bins.length / bars))] / 255;
          const height = peak < 0.012 ? 2 : Math.max(2, sample * (canvas.height - 4));
          context.fillStyle = peak < 0.012 ? "#8bcfff" : "#55d7ff";
          context.fillRect(i * width + 1, (canvas.height - height) / 2, Math.max(1, width - 3), height);
        }
        frame = requestAnimationFrame(render);
      };
      stopVisual();
      frame = requestAnimationFrame(render);
    } catch (error) {
      console.warn("Voice waveform unavailable; audio playback remains available:", error);
    }
  });
  ["pause", "ended"].forEach(name => player.addEventListener(name, stopVisual));
  player.addEventListener("emptied", () => {
    disposed = true;
    stopVisual();
    if (audioContext && audioContext.state !== "closed") audioContext.close().catch(() => {});
  }, { once: true });
}

function appendVoicePlayer(card, data) {
  if (!data.audioData) return;
  const duration = document.createElement("small");
  duration.className = "voice-message-duration";
  duration.textContent = "🎙️ ভয়েস মেসেজ" + (Number(data.audioDuration) > 0 ? " • " + Number(data.audioDuration) + " সেকেন্ড" : "");
  const canvas = document.createElement("canvas");
  canvas.className = "voice-message-waveform";
  canvas.width = 280;
  canvas.height = 34;
  canvas.style.cssText = "display:block;width:100%;max-width:280px;height:34px";
  canvas.setAttribute("aria-label", "শব্দ অনুযায়ী ভয়েস ওয়েভফর্ম");
  const player = document.createElement("audio");
  player.controls = true;
  player.preload = "metadata";
  player.className = "voice-message-player";
  player.src = data.audioData;
  card.append(duration, canvas, player);
  attachReactiveVoiceWaveform(player, canvas);
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


function renderMessages() {
  const list = document.getElementById("adminInboxList");
  const button = document.getElementById("adminInboxButton");
  if (!list || !button) return;
  const unread = currentMessages.filter(item => item.data().senderRole === "customer" && !readNotificationIds.has(item.id)).length;
  button.innerHTML = "📥 Inbox" + (unread ? ' <span class="notification-count">' + unread + "</span>" : "");
  const visible = currentMessages.filter(item => activeInboxTab === "customer"
    ? item.data().senderRole === "customer"
    : item.data().senderRole === "admin");
  list.replaceChildren();
  if (!visible.length) {
    list.textContent = activeInboxTab === "customer" ? "কাস্টমারের কোনো মেসেজ নেই।" : "আপনার পাঠানো কোনো মেসেজ নেই।";
    return;
  }
  visible.forEach(item => {
    const data = item.data();
    const card = document.createElement("article");
    card.className = "order-card notification-card";
    const heading = document.createElement("strong");
    heading.textContent = data.senderName || data.senderEmail || data.userUid || "কাস্টমার";
    const status = document.createElement("span");
    status.className = "notification-status";
    status.textContent = data.senderRole === "customer" && !readNotificationIds.has(item.id) ? "নতুন" : "";
    const message = document.createElement("p");
    message.textContent = data.text || "";
    const time = document.createElement("small");
    const date = data.createdAt?.toDate?.();
    time.textContent = date ? date.toLocaleString("bn-BD") : "সময়: সদ্য";
    card.append(heading, status, message, time);
    appendVoicePlayer(card, data);
    if (data.senderRole === "customer") {
      const reply = document.createElement("textarea");
      reply.placeholder = "কাস্টমারকে উত্তর লিখুন";
      const send = document.createElement("button");
      send.type = "button";
      send.textContent = "উত্তর পাঠান";
      send.addEventListener("click", async () => {
        if (!reply.value.trim()) return alert("উত্তর লিখুন।");
        if (!data.userUid) return alert("কাস্টমার UID পাওয়া যায়নি।");
        send.disabled = true;
        try {
          await addDoc(collection(db, "supportMessages"), {
            userUid: data.userUid, senderRole: "admin", senderName: "GIO BD Admin",
            text: reply.value.trim(), createdAt: serverTimestamp()
          });
          reply.value = "";
          activeInboxTab = "admin";
          renderMessages();
        } catch (error) { alert("উত্তর পাঠানো যায়নি: " + error.message); }
        finally { send.disabled = false; }
      });
      const voiceStatus = document.createElement("p");
      voiceStatus.className = "voice-status";
      const voiceButton = createVoiceRecorder(async (audioData, audioMimeType, audioDuration) => {
        if (!data.userUid) throw new Error("কাস্টমার UID পাওয়া যায়নি।");
        await addDoc(collection(db, "supportMessages"), {
          userUid: data.userUid, senderRole: "admin", senderName: "GIO BD Admin",
          text: "🎤 ভয়েস মেসেজ", audioData, audioMimeType, audioDuration, audioDurationLimit: 15,
          createdAt: serverTimestamp()
        });
        activeInboxTab = "admin";
      }, voiceStatus);
      card.append(reply, send, voiceButton, voiceStatus);
    }
    list.appendChild(card);
  });
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
  section.innerHTML = '<h2>Inbox</h2><p class="muted">কাস্টমারের মেসেজ ও আপনার পাঠানো মেসেজ আলাদা ট্যাবে থাকবে।</p><div class="inbox-tabs"><button type="button" id="customerMessagesTab">Customer Messages</button><button type="button" id="myMessagesTab">My Messages</button></div><div id="adminInboxList">মেসেজ লোড হচ্ছে...</div><button id="adminInboxBack" type="button">ড্যাশবোর্ডে ফিরুন</button>';
  main.appendChild(section);

  document.getElementById("customerMessagesTab").addEventListener("click", () => { activeInboxTab = "customer"; renderMessages(); });
  document.getElementById("myMessagesTab").addEventListener("click", () => { activeInboxTab = "admin"; renderMessages(); });
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

let inboxAuthRevision = 0;
onAuthStateChanged(auth, async user => {
  const revision = ++inboxAuthRevision;
  document.querySelectorAll(".admin-profile-avatar").forEach(element => setOwnerAvatar(element, user));
  const button = document.getElementById("adminInboxButton");
  if (stopListening) stopListening();
  currentMessages = [];
  currentAdminUid = null;
  readNotificationIds = new Set();
  if (!user) {
    if (button) button.hidden = true;
    orderAlertButton.hidden = true;
    if (stopOrderAlertsListening) stopOrderAlertsListening();
    unreadOrderIds.clear(); orderAlertIds.clear(); renderOrderAlertBadge();
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", "admin"));
    if (revision !== inboxAuthRevision) return;
    const data = snap.exists() ? snap.data() : {};
    const role = String(data.role || "").trim().toLowerCase();
    if (data.uid !== user.uid || !["admin", "owner"].includes(role)) {
      if (button) button.hidden = true;
      return;
    }

    currentAdminUid = user.uid;
    try{
      const ownerProfileSnap=await getDoc(doc(db,"settings","ownerProfile"));
      if(revision!==inboxAuthRevision)return;
      const ownerProfileData=ownerProfileSnap.exists()?ownerProfileSnap.data():{};
      const cloudPhoto=ownerProfileData.photoURL||ownerProfileData.avatar||"";
      if(cloudPhoto){
        localStorage.setItem("gioOwnerProfilePhoto",cloudPhoto);
        const detailPhoto=document.getElementById("gioOwnerDetailPhoto");
        if(detailPhoto){detailPhoto.src=cloudPhoto;detailPhoto.hidden=false;}
      }
    }catch(error){console.warn("Owner profile cloud sync unavailable:",error);}
    readNotificationIds = readStorage(user.uid);
    orderAlertButton.hidden = false;
    startOrderAlerts(user.uid);
    if (button) button.hidden = false;
    const list = document.getElementById("adminInboxList");
    if (!list) return;

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
