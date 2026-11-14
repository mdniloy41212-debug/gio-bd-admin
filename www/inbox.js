import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy,
  onSnapshot, doc, getDoc, serverTimestamp
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
adminBottomNav.innerHTML = '<button type="button" data-admin-tab="home">🏠<span>Home</span></button><button type="button" data-admin-tab="orders">📦<span>Orders</span></button><button type="button" data-admin-tab="offers">💎<span>Packages</span></button><button type="button" data-admin-tab="support">💬<span>Support</span></button><button type="button" data-admin-tab="settings">⚙️<span>Settings</span></button>';
adminBottomNav.hidden = true;
document.body.appendChild(adminBottomNav);
const adminProfilePage = document.createElement("section");
adminProfilePage.id = "adminProfilePage"; adminProfilePage.className = "page"; adminProfilePage.hidden = true;
adminProfilePage.innerHTML = '<h2>👤 GIO BD Owner Profile</h2><p>Owner Account Information</p><p id="gioOwnerProfileEmail">Admin account</p><p id="gioOwnerProfileUid" style="overflow-wrap:anywhere"></p><a href="mailto:mdniloy41212@gmail.com">Gmail Support</a><button id="gioOwnerProfileBack" type="button">← Home</button>';
main?.appendChild(adminProfilePage);
document.getElementById("gioOwnerProfileBack")?.addEventListener("click", () => showAdminTab("home"));
const adminNavStyle = document.createElement("style");
adminNavStyle.textContent = '.gio-admin-bottom-nav{position:fixed;z-index:1100;left:8px;right:8px;bottom:8px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:8px;border:1px solid #70ddff55;border-radius:18px;background:#0c1738f2;backdrop-filter:blur(14px);box-shadow:0 12px 32px #0009}.gio-admin-bottom-nav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:7px 2px;min-height:52px;font-size:18px;background:linear-gradient(145deg,#174a83,#34206e)}.gio-admin-bottom-nav button span{font-size:10px}.gio-admin-profile{position:fixed!important;top:12px;right:64px;z-index:1200;width:46px;height:46px;min-height:46px;padding:0;border:1px solid #7deaff88;border-radius:50%;background:linear-gradient(145deg,#174a83,#34206e);box-shadow:0 0 18px #00cfff35;font-size:20px}.gio-admin-profile[hidden]{display:none!important}.gio-admin-bell{position:fixed!important;top:12px;right:12px;z-index:1200;width:46px;height:46px;min-height:46px;padding:0;border:1px solid #7deaff88;border-radius:15px;background:linear-gradient(145deg,#174a83,#34206e);box-shadow:0 0 18px #00cfff55;font-size:21px}.gio-admin-bell[hidden]{display:none!important}body{padding-bottom:90px}.gio-admin-help{position:fixed;right:14px;bottom:98px;z-index:1099;border:2px solid #9ef7ff;border-radius:40px;padding:13px 17px;background:linear-gradient(135deg,#00a6c7,#6534c9);font-weight:800;box-shadow:0 0 22px #00cfff88;animation:gioOwnerBounce 1.8s infinite}.gio-admin-help-panel{position:fixed;right:14px;bottom:155px;z-index:1100;width:min(260px,calc(100vw - 28px));padding:14px;border-radius:16px;background:#101735f5;border:1px solid #78eaff66}.gio-admin-help-panel a{display:block;padding:11px;margin:7px 0;border-radius:10px;color:white;text-decoration:none;background:#176fba;text-align:center}@keyframes gioOwnerBounce{50%{transform:translateY(-8px)}}';
adminNavStyle.textContent += '.admin-order-alert{display:block;width:100%;margin:0 0 12px;padding:13px;border:1px solid #ffcf6a88;border-radius:13px;background:linear-gradient(110deg,#9a4b13,#6234a8);font-weight:800}.notification-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;margin-left:6px;padding:0 6px;border-radius:20px;background:#ff3158;color:#fff;font-size:11px;font-weight:900}.notification-count[hidden]{display:none!important}';
document.head.appendChild(adminNavStyle);
const adminHelp = document.createElement("button"); adminHelp.type="button"; adminHelp.className="gio-admin-help"; adminHelp.textContent="☎ Help";
const adminHelpPanel = document.createElement("div"); adminHelpPanel.className="gio-admin-help-panel"; adminHelpPanel.hidden=true;
adminHelpPanel.innerHTML='<strong>GIO BD Owner Support</strong><a id="gioOwnerWhatsApp" href="#" target="_blank" rel="noopener">WhatsApp</a><a href="https://www.facebook.com/profile.php?id=61582121766890" target="_blank" rel="noopener">Facebook Page</a><a href="mailto:mdniloy41212@gmail.com">Gmail</a>';
adminHelp.hidden = true;
document.body.append(adminHelp,adminHelpPanel);
adminHelp.addEventListener("click",()=>{adminHelpPanel.hidden=!adminHelpPanel.hidden;});
async function refreshOwnerWhatsApp(){try{const snap=await getDoc(doc(db,"settings","supportContact"));const num=snap.exists()?String(snap.data().whatsappNumber||"").replace(/\\D/g,""):"";const link=document.getElementById("gioOwnerWhatsApp");if(link)link.href=num?"https://wa.me/"+num:"#";}catch(e){console.warn("WhatsApp contact unavailable",e);}}
refreshOwnerWhatsApp();
function showAdminTab(tab){
 const login=document.getElementById("loginPage"), dash=document.getElementById("adminPage"), settings=document.getElementById("adminSettingsPage"), inbox=document.getElementById("adminInboxPage");
 [login,dash,settings,inbox,adminProfilePage].filter(Boolean).forEach(p=>{p.classList.remove("active");p.hidden=true;});
 if(tab==="home"&&dash){dash.hidden=false;dash.classList.add("active");}
 if(tab==="orders"&&dash){dash.hidden=false;dash.classList.add("active");document.getElementById("adminOrders")?.scrollIntoView({behavior:"smooth",block:"start"});}
 if(tab==="offers"&&settings){settings.hidden=false;settings.classList.add("active");document.getElementById("adminPackages")?.scrollIntoView({behavior:"smooth",block:"start"});}
 if(tab==="support"){const trigger=document.getElementById("adminInboxButton");if(trigger&&!trigger.hidden)trigger.click();else if(dash){dash.hidden=false;dash.classList.add("active");}}
 if(tab==="manage"&&settings){settings.hidden=false;settings.classList.add("active");document.getElementById("adminPackages")?.scrollIntoView({behavior:"smooth",block:"start"});}
 if(tab==="settings"&&settings){settings.hidden=false;settings.classList.add("active");}
 if(tab==="profile"){adminProfilePage.hidden=false;adminProfilePage.classList.add("active");const email=document.getElementById("gioOwnerProfileEmail");if(email)email.textContent=auth.currentUser?.email||"Admin account";const uid=document.getElementById("gioOwnerProfileUid");if(uid)uid.textContent=auth.currentUser?.uid||"";}
 if(tab==="inbox"){const trigger=document.getElementById("adminInboxButton");if(trigger&&!trigger.hidden)trigger.click();else if(dash){dash.hidden=false;dash.classList.add("active");}}
}
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
orderAlertButton.innerHTML = '🔔 <span id="adminOrderAlertBadge" class="notification-count" hidden>0</span>';
document.getElementById("adminPage")?.insertBefore(orderAlertButton, document.getElementById("adminPage").firstChild);
const orderReadKey = uid => "gioAdminReadOrders:" + uid;
document.getElementById("adminBellNav")?.addEventListener("click", () => orderAlertButton.click());
document.getElementById("adminProfileNav")?.addEventListener("click", () => showAdminTab("profile"));
function renderOrderAlertBadge() {
  const badge = document.getElementById("adminOrderAlertBadge");
  if (!badge) return;
  const count = unreadOrderIds.size;
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.hidden = count === 0;
  const bell = document.getElementById("adminBellNav"); if (bell) bell.textContent = count ? "🔔 " + (count > 99 ? "99+" : count) : "🔔";
  orderAlertButton.setAttribute("aria-label", count + " unread new orders");
}
orderAlertButton.addEventListener("click", async () => {
  if ("Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch {} }
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
  let firstSnapshot = true;
  stopOrderAlertsListening = onSnapshot(collection(db,"orders"), snapshot => {
    const freshPending = snapshot.docs.filter(item => { const d=item.data(); return !firstSnapshot && !d.isArchived && (d.status || "Pending") === "Pending" && !orderAlertIds.has(item.id); });
    freshPending.forEach(item => { if ("Notification" in window && Notification.permission === "granted") new Notification("GIO BD: নতুন অর্ডার", { body:"নতুন অর্ডার এসেছে: " + item.id }); });
    firstSnapshot = false;
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
          await onReady(dataUrl, blob.type || recorder.mimeType || "audio/webm");
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

function appendVoicePlayer(card, data) {
  if (!data.audioData) return;
  const player = document.createElement("audio");
  player.controls = true;
  player.preload = "none";
  player.className = "voice-message-player";
  player.src = data.audioData;
  card.appendChild(player);
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
      const voiceButton = createVoiceRecorder(async (audioData, audioMimeType) => {
        if (!data.userUid) throw new Error("কাস্টমার UID পাওয়া যায়নি।");
        await addDoc(collection(db, "supportMessages"), {
          userUid: data.userUid, senderRole: "admin", senderName: "GIO BD Admin",
          text: "🎤 ভয়েস মেসেজ", audioData, audioMimeType, audioDurationLimit: 15,
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

onAuthStateChanged(auth, async user => {
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
    const data = snap.exists() ? snap.data() : {};
    if (data.uid !== user.uid || String(data.role || "").toLowerCase() !== "admin") {
      if (button) button.hidden = true;
      return;
    }

    currentAdminUid = user.uid;
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
