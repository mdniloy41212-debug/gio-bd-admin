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
adminBottomNav.innerHTML = '<button type="button" data-admin-tab="manage">🎁<span>Offers</span></button><button type="button" data-admin-tab="inbox">📥<span>Inbox</span></button><button type="button" data-admin-tab="profile">👤<span>Profile</span></button>';
adminBottomNav.hidden = true;
document.body.appendChild(adminBottomNav);
const adminProfilePage = document.createElement("section");
adminProfilePage.id = "adminProfilePage"; adminProfilePage.className = "page"; adminProfilePage.hidden = true;
adminProfilePage.innerHTML = '<h2>GIO BD Owner</h2><p>Welcome to GIO BD Owner.</p><p id="gioOwnerProfileEmail">Admin account</p><a href="mailto:mdniloy41212@gmail.com">Gmail Support</a><section class="owner-monitor-limits"><h3>⚠️ স্বয়ংক্রিয় APK পর্যবেক্ষণের সীমাবদ্ধতা</h3><p>এই পর্যবেক্ষণ ফিচারটি রিপোর্ট দিতে পারে, কিন্তু নিচের কাজগুলো নিজে থেকে করে না:</p><ul><li>কোডের সমস্যা নিজে ঠিক করে না।</li><li>নিজে থেকে কোড পরিবর্তন বা নতুন APK বিল্ড করে না।</li><li>নিজে থেকে APK GitHub Release বা সার্ভারে আপলোড/প্রকাশ করে না।</li><li>Firebase সেটিংস বা অ্যাপের ডেটা পরিবর্তন করে না।</li><li>আপনার অনুমতি ছাড়া GitHub-এ কোড আপলোড বা commit করে না।</li><li>ফোনে APK ডাউনলোড করে ইনস্টল করে না।</li></ul><div class="owner-monitor-can">✅ যা করতে পারে: GitHub Actions build-এর অবস্থা, build error, APK artifact এবং GitHub Release আছে কি না—তা পরীক্ষা করে রিপোর্ট দেয়।</div></section>';
main?.appendChild(adminProfilePage);
const adminNavStyle = document.createElement("style");
adminNavStyle.textContent = '.gio-admin-bottom-nav{position:fixed;z-index:1100;left:8px;right:8px;bottom:8px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:8px;border:1px solid #70ddff55;border-radius:18px;background:#0c1738f2;backdrop-filter:blur(14px);box-shadow:0 12px 32px #0009}.gio-admin-bottom-nav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:7px 2px;min-height:52px;font-size:18px;background:linear-gradient(145deg,#174a83,#34206e)}.gio-admin-bottom-nav button span{font-size:10px}body{padding-bottom:90px}.gio-admin-help{position:fixed;right:14px;bottom:98px;z-index:1099;border:2px solid #9ef7ff;border-radius:40px;padding:13px 17px;background:linear-gradient(135deg,#00a6c7,#6534c9);font-weight:800;box-shadow:0 0 22px #00cfff88;animation:gioOwnerBounce 1.8s infinite}.gio-admin-help-panel{position:fixed;right:14px;bottom:155px;z-index:1100;width:min(260px,calc(100vw - 28px));padding:14px;border-radius:16px;background:#101735f5;border:1px solid #78eaff66}.gio-admin-help-panel a{display:block;padding:11px;margin:7px 0;border-radius:10px;color:white;text-decoration:none;background:#176fba;text-align:center}@keyframes gioOwnerBounce{50%{transform:translateY(-8px)}}';
adminNavStyle.textContent += '#adminOrderAlert{display:none!important}';
adminNavStyle.textContent += '.gio-chat-list{display:flex;flex-direction:column;gap:12px;max-height:62vh;overflow-y:auto;padding:12px 8px;background:rgba(4,14,35,.38);border:1px solid #70dfff33;border-radius:18px;scroll-behavior:smooth}.gio-chat-row{display:flex;flex-direction:column;max-width:86%;min-width:0}.gio-chat-row-incoming{align-self:flex-start;align-items:flex-start}.gio-chat-row-outgoing{align-self:flex-end;align-items:flex-end}.gio-chat-sender{font-size:11px;color:#b9eaff;margin:0 8px 4px}.gio-chat-bubble{padding:10px 13px;border-radius:17px;max-width:100%;overflow-wrap:anywhere;box-shadow:0 5px 14px #0004}.gio-chat-row-incoming .gio-chat-bubble{background:linear-gradient(145deg,#243c61,#172943);border:1px solid #80caff55;border-top-left-radius:5px;color:#fff}.gio-chat-row-outgoing .gio-chat-bubble{background:linear-gradient(145deg,#075f91,#164e87);border:1px solid #77e8ff66;border-top-right-radius:5px;color:#fff}.gio-chat-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.gio-chat-time{font-size:10px;color:#9fb4d0;margin:4px 7px}.gio-chat-row textarea{display:block;width:min(76vw,320px);margin-top:8px}.gio-chat-row>button{margin-top:5px}.gio-chat-bubble audio{width:100%;max-width:260px}.gio-chat-bubble .voice-message-duration{display:block;font-size:11px;color:#d4f4ff}');


.owner-monitor-limits{margin:22px 0 18px;padding:16px;border:1px solid rgba(255,190,90,.5);border-radius:16px;background:linear-gradient(145deg,rgba(75,43,24,.72),rgba(34,24,58,.9));box-shadow:0 10px 26px rgba(0,0,0,.22)}.owner-monitor-limits h3{color:#ffd27a;margin:0 0 9px}.owner-monitor-limits p{color:#eee1d2;margin:0 0 10px}.owner-monitor-limits ul{padding-left:22px;margin:8px 0 14px}.owner-monitor-limits li{padding:5px 0;color:#fff;overflow-wrap:anywhere}.owner-monitor-can{padding:11px;border-radius:10px;background:rgba(14,105,77,.28);border:1px solid rgba(89,220,165,.35);color:#c9ffe7;font-weight:600}
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
 if(tab==="manage"&&settings){settings.hidden=false;settings.classList.add("active");document.getElementById("adminPackages")?.scrollIntoView({behavior:"smooth",block:"start"});}
 
 if(tab==="profile"){adminProfilePage.hidden=false;adminProfilePage.classList.add("active");const email=document.getElementById("gioOwnerProfileEmail");if(email)email.textContent=auth.currentUser?.email||"Admin account";}
 if(tab==="inbox"){const trigger=document.getElementById("adminInboxButton");if(trigger&&!trigger.hidden)trigger.click();else if(dash){dash.hidden=false;dash.classList.add("active");}}
}
adminBottomNav.addEventListener("click",event=>{const button=event.target.closest("[data-admin-tab]");if(button)showAdminTab(button.dataset.adminTab);});
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
  sendButton.hidden = true;
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
    sendButton.hidden = true;
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


function renderMessages() {
  const list = document.getElementById("adminInboxList");
  const button = document.getElementById("adminInboxButton");
  if (!list || !button) return;
  const unread = currentMessages.filter(item => item.data().senderRole === "customer" && !readNotificationIds.has(item.id)).length + currentPendingOrders.length;
  button.innerHTML = "📥 Inbox" + (unread ? ' <span class="notification-count">' + unread + "</span>" : "");
  const visible = [...currentMessages].sort((a,b) =>
    (a.data().createdAt?.toMillis?.() || 0) - (b.data().createdAt?.toMillis?.() || 0)
  );
  list.replaceChildren();
  if (activeInboxTab === "customer" && currentPendingOrders.length) {
    const heading = document.createElement("h3");
    heading.textContent = "🛎️ Pending / Processing Orders (" + currentPendingOrders.length + ")";
    list.appendChild(heading);
    currentPendingOrders.forEach(item => {
      const data = item.data();
      const card = document.createElement("article");
      card.className = "order-card notification-card";
      const title = document.createElement("strong");
      title.textContent = "নতুন অর্ডার: " + (data.packageName || "Diamond Order");
      const details = document.createElement("p");
      details.textContent = "Order ID: " + item.id + " | কাস্টমার: " + (data.customerName || "নেই") + " | মূল্য: ৳" + (data.price ?? "—") + " | IMO ID: " + (data.imoId || "—") + " | Transaction ID: " + (data.transactionId || "—");
      const status = document.createElement("p");
      status.className = "notification-status";
      status.textContent = data.status || "Pending";
      card.append(title, details, status);
      list.appendChild(card);
    });
  }
  if (!visible.length && !(activeInboxTab === "customer" && currentPendingOrders.length)) {
    list.textContent = activeInboxTab === "customer" ? "কাস্টমারের কোনো মেসেজ নেই।" : "আপনার পাঠানো কোনো মেসেজ নেই।";
    return;
  }
  visible.forEach(item => {
    const data = item.data();
    const card = document.createElement("article");
    card.className = "gio-chat-row " + (data.senderRole === "admin" ? "gio-chat-row-outgoing" : "gio-chat-row-incoming");
    const heading = document.createElement("strong");
    heading.className = "gio-chat-sender";
    heading.textContent = data.senderRole === "admin" ? "আপনি" : (data.senderName || data.senderEmail || "কাস্টমার");
    const status = document.createElement("span");
    status.className = "notification-status";
    status.textContent = data.senderRole === "customer" && !readNotificationIds.has(item.id) ? "নতুন" : "";
    const bubble = document.createElement("div");
    bubble.className = "gio-chat-bubble";
    const message = document.createElement("p");
    message.className = "gio-chat-text";
    message.textContent = data.text || "";
    const time = document.createElement("small");
    const date = data.createdAt?.toDate?.();
    time.textContent = date ? date.toLocaleString("bn-BD") : "সময়: সদ্য";
    card.append(heading, status, bubble);
    bubble.append(message);
    appendVoicePlayer(bubble, data);
    time.className = "gio-chat-time";
    card.append(time);
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
  section.innerHTML = '<h2>💬 Inbox Chat</h2><p class="muted">কাস্টমারের মেসেজ বাঁ পাশে, আপনার পাঠানো মেসেজ ডান পাশে।</p><div id="adminInboxList" class="gio-chat-list">মেসেজ লোড হচ্ছে...</div><button id="adminInboxBack" type="button">ড্যাশবোর্ডে ফিরুন</button>';
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
    if (button) button.hidden = true;
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
    await refreshOwnerWhatsApp();
    readNotificationIds = readStorage(user.uid);
    if (button) button.hidden = false;
    const list = document.getElementById("adminInboxList");
    if (!list) return;

    stopOrdersListening = onSnapshot(collection(db, "orders"), snapshot => {
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
