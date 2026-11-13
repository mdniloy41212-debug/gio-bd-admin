import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

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
  setDoc,
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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
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
    if (loginPage) { loginPage.hidden = false; loginPage.classList.add("active"); }
    if (adminPage) { adminPage.hidden = true; adminPage.classList.remove("active"); }
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

  if (loginPage) { loginPage.hidden = true; loginPage.classList.remove("active"); }
  if (adminPage) { adminPage.hidden = false; adminPage.classList.add("active"); }
  if (logoutBtn) logoutBtn.hidden = false;
  if (authStatus) authStatus.textContent = "অ্যাডমিন হিসেবে লগইন আছেন";

  await loadAdminOrders();
  await loadDashboardStats();
  await loadPaymentSettings();
  await loadAdminPackages();
  await loadSupportContact();
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });
}


async function loadAdminOrders() {
  if (!isAdmin) return;
  const activeBox = $("adminOrders");
  const historyBox = $("adminOrderHistory");
  const archivedBox = $("adminArchivedOrders");
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const active = [], history = [], archived = [];
    snapshot.forEach(item => {
      const data = item.data();
      const row = { id: item.id, data };
      if (data.isArchived === true) archived.push(row);
      else if (["Approved", "Completed", "Rejected", "Cancelled"].includes(data.status)) history.push(row);
      else active.push(row);
    });
    const renderRows = (box, rows, empty, canChange, canArchive) => {
      if (!box) return;
      box.replaceChildren();
      if (!rows.length) { box.textContent = empty; return; }
      const term = $("orderSearch")?.value.trim().toLowerCase() || "";
      const chosenStatus = $("orderStatusFilter")?.value || "all";
      rows = rows.filter(({id, data}) => {
        const searchable = [id, data.customerName, data.customerEmail, data.customerPhone, data.imoId, data.transactionId, data.packageName].join(" ").toLowerCase();
        return (!term || searchable.includes(term)) && (chosenStatus === "all" || data.status === chosenStatus || (chosenStatus === "Archived" && data.isArchived === true));
      });
      rows.sort((x,y) => (y.data.createdAt?.toMillis?.() || 0) - (x.data.createdAt?.toMillis?.() || 0));
      rows.forEach(({id, data}) => {
        const card = document.createElement("article");
        card.className = "order-card";
        const details = document.createElement("p");
        details.textContent = "অর্ডার: " + id + " | কাস্টমার: " + (data.customerName || "নেই") +
          " | ইমেইল: " + (data.customerEmail || "নেই") + " | ফোন: " + (data.customerPhone || "নেই") +
          " | IMO ID: " + (data.imoId || "নেই") + " | প্যাকেজ: " + (data.packageName || "নেই") +
          " | মূল্য: ৳" + (data.price ?? "নেই") + " | পেমেন্ট: " + (data.paymentMethod || "নেই") +
          " | Transaction ID: " + (data.transactionId || "নেই") + " | অবস্থা: " + (data.status || "Pending");
        card.appendChild(details);
        if (data.paymentScreenshotUrl) {
          const link = document.createElement("a");
          link.href = data.paymentScreenshotUrl; link.target = "_blank";
          link.rel = "noopener noreferrer"; link.textContent = "পেমেন্ট স্ক্রিনশট দেখুন";
          card.appendChild(link);
        }
        if (canChange) ["Pending","Processing","Approved","Completed","Rejected","Cancelled"].forEach(status =>
          card.appendChild(makeButton(status, () => updateOrderStatus(id, status))));
        if (canArchive) card.appendChild(makeButton("Delete / Archive", () => archiveOrder(id)));
        if (box === archivedBox) card.appendChild(makeButton("Restore", () => restoreOrder(id)));
        box.appendChild(card);
      });
    };
    renderRows(activeBox, active, "কোনো Pending বা Processing অর্ডার নেই।", true, true);
    renderRows(historyBox, history, "এখনো কোনো Order History নেই।", false, true);
    renderRows(archivedBox, archived, "Deleted / Archived অর্ডার নেই।", false, false);
  } catch (error) {
    console.error("Orders error:", error);
    [activeBox, historyBox, archivedBox].filter(Boolean).forEach(box => box.textContent = "অর্ডার লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।");
  }
}

async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;
  try {
    await updateDoc(doc(db, "orders", orderId), { status, isArchived: false, updatedAt: serverTimestamp() });
    await loadAdminOrders(); await loadDashboardStats();
  } catch (error) { console.error("Update order error:", error); alert("অর্ডারের অবস্থা পরিবর্তন করা যায়নি।"); }
}

async function archiveOrder(orderId) {
  if (!isAdmin || !confirm("অর্ডারটি সামনের তালিকা থেকে সরিয়ে Archive-এ রাখবেন?")) return;
  try {
    await updateDoc(doc(db, "orders", orderId), { isArchived: true, archivedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await loadAdminOrders(); await loadDashboardStats();
  } catch (error) { console.error("Archive order error:", error); alert("অর্ডার Archive করা যায়নি।"); }
}

async function restoreOrder(orderId) {
  if (!isAdmin) return;
  try {
    await updateDoc(doc(db, "orders", orderId), { isArchived: false, restoredAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await loadAdminOrders(); await loadDashboardStats();
  } catch (error) { console.error("Restore order error:", error); alert("অর্ডার ফিরিয়ে আনা যায়নি।"); }
}


async function loadDashboardStats() {
  const container = $("dashboardStats");
  if (!container || !isAdmin) return;
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const counts = { total:snapshot.size, Pending:0, Processing:0, Approved:0, Completed:0, Rejected:0, Cancelled:0, archived:0 };
    let sales = 0;
    snapshot.forEach(item => {
      const data=item.data(), status=data.status || "Pending";
      if (data.isArchived === true) counts.archived++;
      else if (counts[status] !== undefined) counts[status]++;
      if (status === "Completed") sales += Number(data.price) || 0;
    });
    container.replaceChildren();
    [["মোট অর্ডার",counts.total],["Pending",counts.Pending],["Processing",counts.Processing],
     ["Approved",counts.Approved],["Completed",counts.Completed],
     ["Rejected / Cancelled",counts.Rejected+counts.Cancelled],["Archived",counts.archived],
     ["Total Sales (Completed)","৳"+sales.toLocaleString("en-BD")]].forEach(([label,value]) => {
       const card=document.createElement("div"); card.className="order-card dashboard-stat-card";
       const title=document.createElement("strong"); title.textContent=label;
       const number=document.createElement("p"); number.textContent=String(value);
       card.append(title,number); container.appendChild(card);
     });
    const balance=$("imoBalanceInfo");
    if(balance) balance.textContent="IMO Wallet Balance সরাসরি দেখাতে IMO-এর অনুমোদিত API প্রয়োজন। আসল ব্যালেন্স দেখতে IMO Reseller Account খুলুন।";
  } catch(error) { console.error("Dashboard error:",error); container.textContent="পরিসংখ্যান লোড করা যায়নি।"; }
}

async function loadPaymentSettings() {
  if (!isAdmin) return;

  try {
    const result = await getDoc(doc(db, "settings", "paymentMethods"));
    const data = result.exists() ? result.data() : {};

    ["bkash", "nagad", "rocket"].forEach(method => {
      const number = $(method + "Number");
      const enabled = $(method + "Enabled");

      if (number) number.value = data[method]?.number || "";
      if (enabled) enabled.checked = data[method]?.enabled !== false;
    });
  } catch (error) {
    console.error("Payment settings load:", error);
    showMessage($("paymentMessage"), "পেমেন্ট সেটিংস লোড হয়নি।");
  }
}

const paymentSettingsForm = $("paymentSettingsForm");

if (paymentSettingsForm) {
  paymentSettingsForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;

    const settings = {};

    ["bkash", "nagad", "rocket"].forEach(method => {
      settings[method] = {
        number: $(method + "Number")?.value.trim() || "",
        enabled: Boolean($(method + "Enabled")?.checked)
      };
    });

    try {
      await setDoc(doc(db, "settings", "paymentMethods"), {
        ...settings,
        updatedAt: serverTimestamp()
      });

      showMessage($("paymentMessage"), "পেমেন্ট নম্বর সংরক্ষণ হয়েছে।", true);
    } catch (error) {
      console.error("Payment save:", error);
      showMessage($("paymentMessage"), "সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।");
    }
  });
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

$("orderSearch")?.addEventListener("input", loadAdminOrders);
$("orderStatusFilter")?.addEventListener("change", loadAdminOrders);

const year = $("year");
if (year) year.textContent = new Date().getFullYear();


// Admin-controlled customer WhatsApp support contact
async function loadSupportContact() {
  if (!isAdmin) return;
  try {
    const snap = await getDoc(doc(db, "settings", "supportContact"));
    const data = snap.exists() ? snap.data() : {};
    const input = $("whatsappNumber");
    if (input) input.value = data.whatsappNumber || "";
  } catch (error) {
    console.error("Support contact load:", error);
    showMessage($("supportContactMessage"), "WhatsApp সেটিংস লোড হয়নি।");
  }
}

const supportContactForm = $("supportContactForm");
if (supportContactForm) {
  supportContactForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;
    const whatsappNumber = $("whatsappNumber")?.value.trim() || "";
    if (!/^[+0-9() -]{8,20}$/.test(whatsappNumber)) {
      showMessage($("supportContactMessage"), "সঠিক WhatsApp নম্বর দিন।");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "supportContact"), {
        whatsappNumber,
        updatedAt: serverTimestamp()
      });
      showMessage($("supportContactMessage"), "WhatsApp নম্বর সংরক্ষণ হয়েছে।", true);
    } catch (error) {
      console.error("Support contact save:", error);
      showMessage($("supportContactMessage"), "নম্বর সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।");
    }
  });
}
