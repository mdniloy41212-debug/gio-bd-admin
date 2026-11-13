import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, where, orderBy,
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
if (main && !document.getElementById("adminInboxPage")) {
  const button = document.createElement("button");
  button.id = "adminInboxButton";
  button.textContent = "কাস্টমার ইনবক্স";
  button.hidden = true;
  const adminPage = document.getElementById("adminPage");
  if (adminPage) adminPage.insertBefore(button, adminPage.firstChild);

  const section = document.createElement("section");
  section.id = "adminInboxPage";
  section.className = "page";
  section.innerHTML = '<h2>কাস্টমার ইনবক্স</h2><div id="adminInboxList">মেসেজ লোড হচ্ছে...</div><button id="adminInboxBack">ড্যাশবোর্ডে ফিরুন</button>';
  main.appendChild(section);

  button.addEventListener("click", () => {
    adminPage.classList.remove("active");
    adminPage.hidden = true;
    section.hidden = false;
    section.classList.add("active");
  });
  document.getElementById("adminInboxBack").addEventListener("click", () => {
    section.classList.remove("active");
    section.hidden = true;
    adminPage.hidden = false;
    adminPage.classList.add("active");
  });
}

let stopListening;
onAuthStateChanged(auth, async user => {
  const button = document.getElementById("adminInboxButton");
  if (stopListening) stopListening();
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
    if (button) button.hidden = false;
    const list = document.getElementById("adminInboxList");
    if (!list) return;
    const q = query(collection(db, "supportMessages"), orderBy("createdAt", "asc"));
    stopListening = onSnapshot(q, snapshot => {
      list.replaceChildren();
      if (snapshot.empty) {
        list.textContent = "এখনো কোনো মেসেজ আসেনি।";
        return;
      }
      snapshot.forEach(item => {
        const data = item.data();
        const card = document.createElement("article");
        card.className = "order-card";
        const heading = document.createElement("h3");
        heading.textContent = data.senderName || data.senderEmail || data.userUid || "কাস্টমার";
        const message = document.createElement("p");
        message.textContent = data.text || "";
        const reply = document.createElement("textarea");
        reply.placeholder = "কাস্টমারকে উত্তর লিখুন";
        const send = document.createElement("button");
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
        card.append(heading, message, reply, send);
        list.appendChild(card);
      });
    }, error => {
      list.textContent = "ইনবক্স লোড হয়নি: " + error.message;
    });
  } catch (error) {
    console.error("Admin inbox:", error);
  }
});
