import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  query, where
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
const adminSettingsPage = $("adminSettingsPage");
const authStatus = $("authStatus");
const logoutBtn = $("logoutBtn");

let isAdmin = false;
let stopAdminOrdersListener = null;
let stopAdminPackagesListener = null;

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
$("toggleAdminPassword")?.addEventListener("click",()=>{const field=$("adminPassword");if(!field)return;field.type=field.type==="password"?"text":"password";$("toggleAdminPassword").textContent=field.type==="password"?"👁":"🙈";});
$("adminForgotPassword")?.addEventListener("click",async()=>{const email=$("adminEmail")?.value.trim();if(!email){showMessage(loginMessage,"আগে Admin Gmail লিখুন।");return;}try{await sendPasswordResetEmail(auth,email);showMessage(loginMessage,"Password Reset Link Admin Gmail-এ পাঠানো হয়েছে।",true);}catch(error){showMessage(loginMessage,"Reset Link পাঠানো যায়নি: "+error.message);}});

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
      await setPersistence(auth, $("adminRememberMe")?.checked ? browserLocalPersistence : browserSessionPersistence);
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
    document.querySelector(".gio-admin-bottom-nav")?.setAttribute("hidden", "");
    if ($("adminHomeNav")) $("adminHomeNav").hidden = true;
    if ($("adminBellNav")) $("adminBellNav").hidden = true;
    document.querySelector(".gio-admin-help")?.setAttribute("hidden", "");
    if (loginPage) { loginPage.hidden = false; loginPage.classList.add("active"); }
    if (adminPage) { adminPage.hidden = true; adminPage.classList.remove("active"); }
    if (adminSettingsPage) { adminSettingsPage.hidden = true; adminSettingsPage.classList.remove("active"); }
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
  document.querySelector(".gio-admin-bottom-nav")?.removeAttribute("hidden");
  if ($("adminHomeNav")) $("adminHomeNav").hidden = false;
  if ($("adminBellNav")) $("adminBellNav").hidden = false;
  document.querySelector(".gio-admin-help")?.removeAttribute("hidden");

  if (loginPage) { loginPage.hidden = true; loginPage.classList.remove("active"); }
  if (adminPage) { adminPage.hidden = false; adminPage.classList.add("active"); }
  if (adminSettingsPage) { adminSettingsPage.hidden = true; adminSettingsPage.classList.remove("active"); }
  if (logoutBtn) logoutBtn.hidden = false;
  if (authStatus) authStatus.textContent = "অ্যাডমিন হিসেবে লগইন আছেন";
  const adminDisplayName = $("adminDisplayName");
  if (adminDisplayName) adminDisplayName.textContent = user.displayName || user.email || "Admin";

  await loadAdminOrders();
  await loadCustomerManagement();
  await loadDashboardStats();
  await loadPaymentSettings();
  await loadAdminPackages();
  await loadSupportContact();
});

const settingsButton = $("adminSettingsButton");
const settingsBackButton = $("adminSettingsBack");
if (settingsButton) {
  settingsButton.addEventListener("click", () => {
    if (!isAdmin) return;
    adminPage?.classList.remove("active");
    if (adminPage) adminPage.hidden = true;
    if (adminSettingsPage) {
      adminSettingsPage.hidden = false;
      adminSettingsPage.classList.add("active");
    }
  });
}
if (settingsBackButton) {
  settingsBackButton.addEventListener("click", () => {
    if (!isAdmin) return;
    adminSettingsPage?.classList.remove("active");
    if (adminSettingsPage) adminSettingsPage.hidden = true;
    if (adminPage) {
      adminPage.hidden = false;
      adminPage.classList.add("active");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });
}


function loadAdminOrders() {
  if (!isAdmin) return;
  if (stopAdminOrdersListener) stopAdminOrdersListener();
  const activeBox = $("adminOrders");
  const historyBox = $("adminOrderHistory");
  const archivedBox = $("adminArchivedOrders");
  const rejectedBox = $("adminRejectedOrders");

  stopAdminOrdersListener = onSnapshot(collection(db, "orders"), snapshot => {
    const active = [], history = [], rejected = [], archived = [];
    snapshot.forEach(item => {
      const data = item.data();
      const row = { id: item.id, data };
      if (data.isArchived === true) archived.push(row);
      else if (data.status === "Rejected") rejected.push(row);
      else if (["Approved", "Completed", "Cancelled"].includes(data.status)) history.push(row);
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
          " | IMO ID: " + (data.imoId || "নেই") + " | প্যাকেজ: " + (data.packageName || "নেই") + " | Diamond: " + (Number(data.diamondQuantity) || Number(String(data.packageName || "").match(/[0-9]+/)?.[0]) || "নেই") +
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
    renderRows(historyBox, history, "এখনো কোনো Approved / Completed অর্ডার নেই।", true, true);
    renderRows(rejectedBox, rejected, "Rejected অর্ডার নেই।", false, true);
    renderRows(archivedBox, archived, "Deleted / Archived অর্ডার নেই।", false, false);
    loadDashboardStats();
  }, error => {
    console.error("Live orders listener:", error);
    [activeBox, historyBox, rejectedBox, archivedBox].filter(Boolean).forEach(box => box.textContent = "অর্ডার লোড করা যায়নি: " + error.message);
  });
}

async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;
  try {
    await runTransaction(db, async transaction => {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("অর্ডারটি পাওয়া যায়নি।");
      const order = orderSnap.data();
      const shouldDeduct = ["Approved", "Completed"].includes(status)
        && ["Pending", "Processing"].includes(order.status || "Pending")
        && order.stockDeducted !== true;
      if (shouldDeduct) {
        const quantity = Number(order.diamondQuantity)
          || Number(String(order.packageName || "").match(/[0-9]+/)?.[0]) || 0;
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("এই অর্ডারের Diamond quantity পাওয়া যায়নি। প্যাকেজের পরিমাণ ঠিক করুন।");
        }
        const stockRef = doc(db, "settings", "diamondStock");
        const stockSnap = await transaction.get(stockRef);
        const currentStock = Number(stockSnap.exists() ? stockSnap.data().quantity : 0);
        if (currentStock < quantity) throw new Error("পর্যাপ্ত Diamond Stock নেই। বর্তমান স্টক: " + currentStock);
        transaction.set(stockRef, {
          quantity: currentStock - quantity,
          updatedAt: serverTimestamp()
        }, { merge: true });
        transaction.update(orderRef, {
          status, stockDeducted: true, stockDeductedQuantity: quantity,
          stockDeductedAt: serverTimestamp(), isArchived: false, updatedAt: serverTimestamp()
        });
      } else {
        transaction.update(orderRef, { status, isArchived: false, updatedAt: serverTimestamp() });
      }
    });
    await loadDashboardStats();
  } catch (error) {
    console.error("Update order error:", error);
    alert("অর্ডারের অবস্থা পরিবর্তন করা যায়নি: " + (error.message || "অজানা সমস্যা"));
  }
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



let customerProfilesCache = [];
async function loadCustomerManagement() {
  const box = $("adminCustomerList");
  if (!box || !isAdmin) return;
  box.textContent = "কাস্টমার লোড হচ্ছে...";
  try {
    const snap = await getDocs(collection(db, "customerProfiles"));
    customerProfilesCache = snap.docs.map(item => ({ uid: item.id, data: item.data() }));
    renderCustomerManagement();
  } catch (error) {
    console.error("Customer management:", error);
    box.textContent = "কাস্টমার লোড হয়নি। customerProfiles-এর Firestore Rules পরীক্ষা করুন।";
  }
}
function renderCustomerManagement() {
  const box = $("adminCustomerList");
  if (!box) return;
  const term = ($("customerManagementSearch")?.value || "").trim().toLowerCase();
  const rows = customerProfilesCache.filter(({uid,data}) =>
    [uid,data.displayName,data.name,data.email,data.phone,data.mobile].join(" ").toLowerCase().includes(term)
  );
  box.replaceChildren();
  if (!rows.length) { box.textContent = "কোনো কাস্টমার পাওয়া যায়নি।"; return; }
  rows.forEach(({uid,data}) => {
    const card = document.createElement("article");
    card.className = "order-card";
    const title = document.createElement("strong");
    title.textContent = data.displayName || data.name || "নাম দেওয়া হয়নি";
    const info = document.createElement("p");
    info.textContent = "ইমেইল: " + (data.email || "—") + " | ফোন: " + (data.phone || data.mobile || "—") + " | Customer ID: " + uid;
    const history = makeButton("এই কাস্টমারের অর্ডার দেখুন", async () => {
      if (!isAdmin) return;
      try {
        const orders = await getDocs(collection(db,"orders"));
        const email = String(data.email || "").toLowerCase();
        const phone = String(data.phone || data.mobile || "");
        const details = orders.docs.filter(order => {
          const d=order.data();
          return [d.customerUid,d.userUid,d.uid].some(value => String(value || "") === uid)
            || (email && [d.customerEmail,d.email].some(value => String(value || "").toLowerCase() === email))
            || (phone && [d.customerPhone,d.phone].some(value => String(value || "") === phone))
            || String(d.userId || "") === uid;
        }).map(order => {
          const d=order.data(); return order.id + " — " + (d.packageName || "Diamond") + " — " + (d.status || "Pending");
        });
        alert(details.length ? details.join("\n") : "এই কাস্টমারের কোনো অর্ডার পাওয়া যায়নি।");
      } catch(error) { alert("অর্ডার দেখা যায়নি: " + error.message); }
    });
    card.append(title,info,history);
    box.appendChild(card);
  });
}
$("customerManagementSearch")?.addEventListener("input", renderCustomerManagement);

async function loadDashboardStats() {
  const container = $("dashboardStats");
  if (!container || !isAdmin) return;
  try {
    const [ordersSnapshot, stockSnapshot] = await Promise.all([getDocs(collection(db, "orders")), getDoc(doc(db, "settings", "diamondStock"))]);
    let sales = 0, pending = 0;
    ordersSnapshot.forEach(item => { const data=item.data(); if(data.status === "Completed") sales += Number(data.price)||0; if(!data.isArchived && (data.status||"Pending")==="Pending") pending++; });
    const stock = Number(stockSnapshot.exists() ? stockSnapshot.data().quantity : 0);
    const stats = [["মোট বিক্রয়", "৳"+sales.toLocaleString("en-BD"), "💰"],["Diamond Balance",stock.toLocaleString("en-BD"),"💎"],["Total Orders",ordersSnapshot.size.toLocaleString("en-BD"),"📦"],["Pending Orders",pending.toLocaleString("en-BD"),"⏳"]];
    container.replaceChildren();
    stats.forEach(([label,value,icon])=>{const card=document.createElement("div");card.className="order-card dashboard-stat-card";const title=document.createElement("strong");title.textContent=icon+" "+label;const number=document.createElement("p");number.textContent=value;card.append(title,number);container.appendChild(card);});
    const stockInput=$("diamondStockQuantity"); if(stockInput && document.activeElement!==stockInput) stockInput.value=String(stock);
  } catch(error) { console.error("Dashboard error:",error); container.textContent="ড্যাশবোর্ডের তথ্য লোড করা যায়নি।"; }
}
const diamondStockForm = $("diamondStockForm");
if (diamondStockForm) {
  diamondStockForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;
    const quantity = Number($("diamondStockQuantity")?.value);
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      showMessage($("diamondStockMessage"), "০ বা তার বেশি পূর্ণসংখ্যা Diamond Stock দিন।");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "diamondStock"), {
        quantity,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || ""
      });
      showMessage($("diamondStockMessage"), "Diamond Stock সংরক্ষণ হয়েছে।", true);
      await loadDashboardStats();
    } catch (error) {
      console.error("Stock save error:", error);
      showMessage($("diamondStockMessage"), "Stock সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।");
    }
  });
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

function loadAdminPackages() {
  const container=$("adminPackages"); if(!container||!isAdmin)return;
  if(stopAdminPackagesListener) stopAdminPackagesListener();
  container.textContent="প্যাকেজ লোড হচ্ছে...";
  stopAdminPackagesListener=onSnapshot(collection(db,"packages"),snapshot=>{
    container.replaceChildren(); if(snapshot.empty){container.textContent="এখনো কোনো প্যাকেজ যোগ করা হয়নি।";return;}
    snapshot.forEach(item=>{const data=item.data();const card=document.createElement("div");card.className="order-card";const details=document.createElement("p");details.textContent=(data.name||"নাম নেই")+" ("+(Number(data.diamondQuantity)||Number(String(data.name||"").match(/[0-9]+/)?.[0])||"পরিমাণ নেই")+" Diamond) - ৳"+(data.price??"নেই")+" | "+(data.active===false?"বন্ধ":"চালু");card.appendChild(details);
      card.appendChild(makeButton("Edit",async()=>{const name=prompt("প্যাকেজের নাম:",data.name||"");if(name===null)return;const q=prompt("Diamond পরিমাণ:",String(data.diamondQuantity||""));if(q===null)return;const p=prompt("প্যাকেজের মূল্য:",String(data.price??""));if(p===null)return;const quantity=Number(q),price=Number(p);if(!name.trim()||!Number.isSafeInteger(quantity)||quantity<=0||!Number.isFinite(price)||price<=0){alert("সঠিক নাম, Diamond পরিমাণ ও মূল্য দিন।");return;}try{await updateDoc(doc(db,"packages",item.id),{name:name.trim(),diamondQuantity:quantity,price,updatedAt:serverTimestamp()});}catch(error){alert("প্যাকেজ আপডেট হয়নি: "+error.message);}}));
      card.appendChild(makeButton(data.active===false?"Enable":"Disable",async()=>{try{await updateDoc(doc(db,"packages",item.id),{active:data.active===false,updatedAt:serverTimestamp()});}catch(error){alert("প্যাকেজের অবস্থা বদলানো যায়নি: "+error.message);}}));
      card.appendChild(makeButton("Delete",async()=>{if(!confirm("প্যাকেজটি মুছে ফেলবেন? পুরোনো অর্ডার থাকবে।"))return;try{await deleteDoc(doc(db,"packages",item.id));}catch(error){alert("প্যাকেজ মুছে ফেলা যায়নি: "+error.message);}}));container.appendChild(card);
    });
  },error=>{console.error("Packages listener:",error);container.textContent="প্যাকেজ লোড করা যায়নি: "+error.message;});
}
const packageForm = $("packageForm");

if (packageForm) {
  packageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isAdmin) return;

    const name = $("newPackageName")?.value.trim();
    const diamondQuantity = Number($("newPackageQuantity")?.value) || Number(String(name || "").match(/[0-9]+/)?.[0]) || 0;
    const price = Number($("newPackagePrice")?.value);
    const message = $("packageMessage");

    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(diamondQuantity) || diamondQuantity <= 0) {
      showMessage(message, "সঠিক প্যাকেজের নাম ও মূল্য দিন।");
      return;
    }

    try {
      await addDoc(collection(db, "packages"), {
        name,
        diamondQuantity,
        price,
        active: true,
        createdAt: serverTimestamp()
      });

      packageForm.reset();
      showMessage(message, "প্যাকেজ সফলভাবে যোগ হয়েছে।", true);
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
