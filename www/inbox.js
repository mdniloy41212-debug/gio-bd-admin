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
let stopListening;
let currentMessages = [];
let currentAdminUid = null;
let readNotificationIds = new Set();

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

  const unread = currentMessages.filter(item =>
    item.data().senderRole === "customer" && !readNotificationIds.has(item.id)
  ).length;
  button.textContent = unread ? "🔔 নোটিফিকেশন (" + unread + ")" : "🔔 নোটিফিকেশন";

  list.replaceChildren();
  if (!currentMessages.length) {
    list.textContent = "এখনো কোনো মেসেজ বা নোটিফিকেশন নেই।";
    return;
  }

  currentMessages.forEach(item => {
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
            userUid: data.userUid,
            senderRole: "admin",
            senderName: "GIO BD Admin",
            text: reply.value.trim(),
            createdAt: serverTimestamp()
          });
          reply.value = "";
        } catch (error) {
          alert("উত্তর পাঠানো যায়নি: " + error.message);
        } finally {
          send.disabled = false;
        }
      });
      card.append(reply, send);
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
  section.innerHTML = '<h2>নোটিফিকেশন ও মেসেজ হিস্টোরি</h2><p class="muted">কাস্টমারের নতুন মেসেজ এখানে দেখা যাবে। অ্যাপ খোলা থাকলে নতুন মেসেজ স্বয়ংক্রিয়ভাবে আপডেট হবে।</p><div id="adminInboxList">মেসেজ লোড হচ্ছে...</div><button id="adminInboxBack" type="button">ড্যাশবোর্ডে ফিরুন</button>';
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
    readNotificationIds = readStorage(user.uid);
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
