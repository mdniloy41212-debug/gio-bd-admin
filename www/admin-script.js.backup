import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZ3tIrZxqYuiYP8fnoNoDcLR6W7wbEt30",
  authDomain: "gio-bd.firebaseapp.com",
  projectId: "gio-bd",
  storageBucket: "gio-bd.firebasestorage.app",
  messagingSenderId: "727420404239",
  appId: "1:727420404239:web:914e2903eb648db782d97a",
  measurementId: "G-B3J9DTP6M9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const adminPage = $("adminPage");
const loginPage = $("loginPage");
const authStatus = $("authStatus");
const logoutBtn = $("logoutBtn");

let isAdmin = false;

async function checkAdmin(user) {
  if (!user) return false;

  try {
    const adminDoc = await getDoc(doc(db, "users", "admin"));

    if (!adminDoc.exists()) return false;

    const data = adminDoc.data();

    return (
      data.uid === user.uid &&
      String(data.role || "").toLowerCase() === "admin"
    );
  } catch (error) {
    console.error("Admin check:", error);
    return false;
  }
}

function showMessage(element, message, success = false) {
  if (!element) return;
  element.textContent = message;
  element.style.color = success ? "green" : "red";
}

function makeButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

await setPersistence(auth, browserLocalPersistence);

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("adminEmail")?.value.trim();
    const password = $("adminPassword")?.value;

    if (!email || !password) {
      showMessage(loginMessage, "ইমেইল ও পাসওয়ার্ড দিন।");
      return;
    }

    showMessage(loginMessage, "লগইন হচ্ছে...", true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      showMessage(loginMessage, "লগইন হয়নি। ইমেইল ও পাসওয়ার্ড পরীক্ষা করুন।");
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  isAdmin = false;

  if (!user) {
    if (loginPage) loginPage.hidden = false;
    if (adminPage) adminPage.hidden = true;
    if (logoutBtn) logoutBtn.hidden = true;
    if (authStatus) authStatus.textContent = "আপনি লগইন করেননি";
    return;
  }

  const allowed = await checkAdmin(user);

  if (!allowed) {
    showMessage(loginMessage, "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।");
    await signOut(auth);
    return;
  }

  isAdmin = true;

  if (loginPage) loginPage.hidden = true;
  if (adminPage) adminPage.hidden = false;
  if (logoutBtn) logoutBtn.hidden = false;
  if (authStatus) authStatus.textContent = "অ্যাডমিন হিসেবে লগইন আছেন";

  await loadAdminOrders();
  await loadAdminPackages();
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });
}

async function loadAdminOrders() {
  const container = $("adminOrders");
  if (!container || !isAdmin) return;

  container.textContent = "অর্ডার লোড হচ্ছে...";

  try {
    const snapshot = await getDocs(collection(db, "orders"));
    container.replaceChildren();

    if (snapshot.empty) {
      container.textContent = "এখনো কোনো অর্ডার নেই।";
      return;
    }

    snapshot.forEach((item) => {
      const data = item.data();
      const card = document.createElement("div");
      card.className = "order-card";

      const details = document.createElement("p");
      details.textContent =
        "অর্ডার: " + item.id +
        " | কাস্টমার: " + (data.customerName || "নেই") +
        " | ইমেইল: " + (data.customerEmail || "নেই") +
        " | ফোন: " + (data.customerPhone || "নেই") +
        " | IMO ID: " + (data.imoId || "নেই") +
        " | প্যাকেজ: " + (data.packageName || "নেই") +
        " | মূল্য: ৳" + (data.price ?? "নেই") +
        " | পেমেন্ট: " + (data.paymentMethod || "নেই") +
        " | Transaction ID: " + (data.transactionId || "নেই") +
        " | অবস্থা: " + (data.status || "Pending");

      card.appendChild(details);

      card.appendChild(makeButton("Approve", () =>
        updateOrderStatus(item.id, "Approved")
      ));

      card.appendChild(makeButton("Reject", () =>
        updateOrderStatus(item.id, "Rejected")
      ));

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Orders error:", error);
    container.textContent = "অর্ডার লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।";
  }
}

async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;

  try {
    await updateDoc(doc(db, "orders", orderId), { status });
    await loadAdminOrders();
  } catch (error) {
    console.error("Update order error:", error);
    alert("অর্ডারের অবস্থা পরিবর্তন করা যায়নি।");
  }
}

async function loadAdminPackages() {
  const container = $("adminPackages");
  if (!container || !isAdmin) return;

  container.textContent = "প্যাকেজ লোড হচ্ছে...";

  try {
    const snapshot = await getDocs(collection(db, "packages"));
    container.replaceChildren();

    if (snapshot.empty) {
      container.textContent = "এখনো কোনো প্যাকেজ যোগ করা হয়নি।";
      return;
    }

    snapshot.forEach((item) => {
      const data = item.data();
      const card = document.createElement("div");
      card.className = "order-card";

      const details = document.createElement("p");
      details.textContent =
        (data.name || "নাম নেই") + " - ৳" + (data.price ?? "নেই");

      card.appendChild(details);
      card.appendChild(makeButton("Delete", async () => {
        if (!confirm("এই প্যাকেজটি মুছে ফেলবেন?")) return;

        try {
          await deleteDoc(doc(db, "packages", item.id));
          await loadAdminPackages();
        } catch (error) {
          console.error("Delete package error:", error);
          alert("প্যাকেজ মুছে ফেলা যায়নি।");
        }
      }));

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Packages error:", error);
    container.textContent = "প্যাকেজ লোড করা যায়নি।";
  }
}

const packageForm = $("packageForm");

if (packageForm) {
  packageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isAdmin) return;

    const name = $("newPackageName")?.value.trim();
    const price = Number($("newPackagePrice")?.value);
    const message = $("packageMessage");

    if (!name || !Number.isFinite(price) || price <= 0) {
      showMessage(message, "সঠিক প্যাকেজের নাম ও মূল্য দিন।");
      return;
    }

    try {
      await addDoc(collection(db, "packages"), {
        name,
        price,
        active: true,
        createdAt: serverTimestamp()
      });

      packageForm.reset();
      showMessage(message, "প্যাকেজ সফলভাবে যোগ হয়েছে।", true);
      await loadAdminPackages();
    } catch (error) {
      console.error("Add package error:", error);
      showMessage(message, "প্যাকেজ যোগ করা যায়নি।");
    }
  });
}

const year = $("year");
if (year) year.textContent = new Date().getFullYear();
