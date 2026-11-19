import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithCustomToken,
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
  serverTimestamp,
  runTransaction,
  query, where, onSnapshot
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
let authStateRevision = 0;
let ownerLiveUnsubscribers = [];
function stopOwnerLiveSync() { ownerLiveUnsubscribers.forEach(unsubscribe => { try { unsubscribe(); } catch (_) {} }); ownerLiveUnsubscribers = []; }
function startOwnerLiveSync() {
  if (!isAdmin) return;
  stopOwnerLiveSync();
  ownerLiveUnsubscribers.push(onSnapshot(collection(db, "orders"), () => { if (isAdmin) { loadAdminOrders(); loadDashboardStats(); } }, error => console.error("Live order sync failed:", error)));
  ownerLiveUnsubscribers.push(onSnapshot(doc(db, "settings", "diamondStock"), () => { if (isAdmin) loadDashboardStats(); }, error => console.error("Live Black Diamond stock sync failed:", error)));
  ownerLiveUnsubscribers.push(onSnapshot(doc(db, "settings", "paymentMethods"), snapshot => {
    if (!isAdmin || !snapshot.exists()) return;
    const data = snapshot.data();
    ["bkash", "nagad", "rocket"].forEach(method => {
      const number = $(method + "Number"), enabled = $(method + "Enabled");
      if (number && document.activeElement !== number) number.value = data[method]?.number || "";
      if (enabled && document.activeElement !== enabled) enabled.checked = data[method]?.enabled !== false;
    });
  }, error => console.error("Live payment settings sync failed:", error)));
}
window.addEventListener("online", () => { if (isAdmin) { loadAdminOrders(); loadCustomerManagement(); loadDashboardStats(); loadPaymentSettings(); loadAdminPackages(); loadYellowDiamondPackages(); loadSupportContact(); } });

async function checkAdmin(user) {
  if (!user) return false;

  // Owner app: retain the UID match and allow only explicitly assigned
  // admin/owner roles. Never grant access from email or password alone.
  const adminRef = doc(db, "users", "admin");
  let adminDoc;
  try {
    adminDoc = await getDoc(adminRef);
  } catch (error) {
    console.error("Owner permission document read failed:", error);
    throw new Error("অনুমতি যাচাই করা যায়নি (Firestore: " + (error.code || error.message) + ")। users/admin পড়ার Rules পরীক্ষা করুন।");
  }

  if (!adminDoc.exists()) {
    throw new Error("Firestore-এ users/admin ডকুমেন্ট পাওয়া যায়নি।");
  }

  const data = adminDoc.data();
  const role = String(data.role || "").trim().toLowerCase();
  if (data.uid !== user.uid) {
    console.error("Owner UID mismatch", { signedInUid: user.uid, storedUid: data.uid || null });
    throw new Error("লগইন করা অ্যাকাউন্টের UID users/admin-এর uid-এর সঙ্গে মিলছে না।");
  }
  if (!["admin", "owner"].includes(role)) {
    console.error("Owner role mismatch", { storedRole: data.role || null });
    throw new Error("users/admin-এর role অবশ্যই Admin অথবা Owner হতে হবে।");
  }
  return true;
}

function showMessage(element, message, success = false) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  element.setAttribute("role", "alert");
  element.style.display = "block";
  element.style.visibility = "visible";
  element.style.opacity = "1";
  element.style.padding = "12px";
  element.style.margin = "12px 0";
  element.style.borderRadius = "10px";
  element.style.whiteSpace = "pre-wrap";
  element.style.overflowWrap = "anywhere";
  element.style.background = success ? "#123d2b" : "#4a1720";
  element.style.border = success ? "1px solid #35c982" : "1px solid #ff6578";
  element.style.color = "#ffffff";
  element.style.fontWeight = "700";
}

function makeButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

// Start persistence setup without blocking the module from registering UI handlers.
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase Auth persistence setup failed:", error);
  return null; // Firebase Auth can still attempt sign-in with its default persistence.
});

const OWNER_AUTH_API_BASE_URL = "https://gio-bd-owner-auth.onrender.com";
const ownerEmailInput = $("adminEmail");
const ownerOtpInput = $("ownerOtpCode");
const ownerSendOtpButton = $("ownerSendOtpBtn");
const ownerVerifyOtpButton = $("ownerVerifyOtpBtn");
const ownerOtpVerifySection = $("ownerOtpVerifySection");
const ownerPasswordInput = $("ownerPassword");
const ownerPasswordLoginButton = $("ownerPasswordLoginBtn");

if (ownerPasswordLoginButton) {
  ownerPasswordLoginButton.addEventListener("click", async () => {
    const email = ownerEmailInput?.value.trim().toLowerCase();
    const password = ownerPasswordInput?.value || "";
    if (!email) {
      showMessage(loginMessage, "প্রথমে Owner Gmail লিখুন।");
      ownerEmailInput?.focus();
      return;
    }
    if (!password) {
      showMessage(loginMessage, "Owner Password লিখুন।");
      ownerPasswordInput?.focus();
      return;
    }
    ownerPasswordLoginButton.disabled = true;
    showMessage(loginMessage, "Gmail ও Password দিয়ে লগইন করা হচ্ছে...", true);
    try {
      await persistenceReady;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Owner password login error:", error);
      const messages = {
        "auth/invalid-credential": "Gmail অথবা Password সঠিক নয়।",
        "auth/user-not-found": "এই Gmail-এর Firebase অ্যাকাউন্ট পাওয়া যায়নি।",
        "auth/wrong-password": "Password সঠিক নয়।",
        "auth/too-many-requests": "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
        "auth/invalid-email": "সঠিক Gmail লিখুন।",
        "auth/network-request-failed": "ইন্টারনেট সংযোগ পরীক্ষা করুন।"
      };
      showMessage(loginMessage, messages[error.code] || ("Password দিয়ে লগইন করা যায়নি: " + (error.message || error.code || "অজানা সমস্যা")));
    } finally {
      ownerPasswordLoginButton.disabled = false;
    }
  });
}

async function ownerAuthRequest(path, payload) {
  const response = await fetch(OWNER_AUTH_API_BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(result.message || result.error || "অনুরোধটি সম্পন্ন হয়নি।");
  }
  return result;
}

if (ownerSendOtpButton && !window.__gioOtpSendHandlerAttached) {
  ownerSendOtpButton.addEventListener("click", async () => {
    const email = ownerEmailInput?.value.trim().toLowerCase();
    if (!email) {
      showMessage(loginMessage, "প্রথমে Owner Gmail লিখুন।");
      ownerEmailInput?.focus();
      return;
    }
    ownerSendOtpButton.disabled = true;
    showMessage(loginMessage, "আপনার Gmail-এ OTP পাঠানো হচ্ছে...", true);
    try {
      await ownerAuthRequest("/api/owner/send-otp", { email });
      if (ownerOtpVerifySection) ownerOtpVerifySection.hidden = false;
      showMessage(loginMessage, "OTP পাঠানো হয়েছে। Gmail Inbox/Spam পরীক্ষা করুন।", true);
      ownerOtpInput?.focus();
    } catch (error) {
      console.error("Owner send OTP error:", error);
      showMessage(loginMessage, error.message || "OTP পাঠানো যায়নি।");
    } finally {
      ownerSendOtpButton.disabled = false;
    }
  });
}

if (ownerVerifyOtpButton) {
  ownerVerifyOtpButton.addEventListener("click", async () => {
    const email = ownerEmailInput?.value.trim().toLowerCase();
    const otp = ownerOtpInput?.value.trim();
    if (!email) {
      showMessage(loginMessage, "অনুমোদিত Owner Gmail লিখুন।");
      ownerEmailInput?.focus();
      return;
    }
    if (!/^[0-9]{6}$/.test(otp || "")) {
      showMessage(loginMessage, "সঠিক ৬ সংখ্যার OTP লিখুন।");
      ownerOtpInput?.focus();
      return;
    }

    ownerVerifyOtpButton.disabled = true;
    showMessage(loginMessage, "OTP যাচাই করা হচ্ছে...", true);
    try {
      const verification = await ownerAuthRequest("/api/owner/verify-otp", { email, otp });
      if (!verification.verificationToken) throw new Error("OTP যাচাইয়ের টোকেন পাওয়া যায়নি।");
      const completed = await ownerAuthRequest("/api/owner/complete-login", {
        email,
        verificationToken: verification.verificationToken
      });
      if (!completed.customToken) throw new Error("Firebase Login Token পাওয়া যায়নি।");
      await persistenceReady;
      showMessage(loginMessage, "লগইন হচ্ছে; Owner অনুমতি যাচাই করা হচ্ছে...", true);
      await signInWithCustomToken(auth, completed.customToken);
    } catch (error) {
      console.error("Owner OTP login error:", error);
      showMessage(loginMessage, error.message || "OTP যাচাই করে লগইন করা যায়নি।");
    } finally {
      ownerVerifyOtpButton.disabled = false;
    }
  });
} else {
  console.error("Owner OTP verify button was not found in index.html");
}

onAuthStateChanged(auth, async (user) => {
  const revision = ++authStateRevision;
  isAdmin = false;

  if (!user) {
    stopOwnerLiveSync();
    document.querySelector(".gio-admin-bottom-nav")?.setAttribute("hidden", "");
    if ($("adminHomeNav")) $("adminHomeNav").hidden = true;
    document.querySelector(".gio-admin-help")?.setAttribute("hidden", "");
    if (loginPage) { loginPage.hidden = false; loginPage.classList.add("active"); }
    if (adminPage) { adminPage.hidden = true; adminPage.classList.remove("active"); }
    if (adminSettingsPage) { adminSettingsPage.hidden = true; adminSettingsPage.classList.remove("active"); }
    if (logoutBtn) logoutBtn.hidden = true;
    if (authStatus) authStatus.textContent = "আপনি লগইন করেননি";
    return;
  }

  let allowed = false;
  try {
    allowed = await checkAdmin(user);
    // Ignore a slow result if Firebase has already reported a newer auth state.
    if (revision !== authStateRevision) return;
  } catch (error) {
    if (revision !== authStateRevision) return;
    console.error("Owner authorization check failed:", error);
    const detail = error?.message || error?.code || "অজানা সমস্যা";
    showMessage(loginMessage, "Owner অনুমতি যাচাই ব্যর্থ: " + detail + "\nFirestore Rules, users/admin UID ও role পরীক্ষা করুন।");
    try {
      await signOut(auth);
    } catch (signOutError) {
      console.error("Sign-out after authorization failure also failed:", signOutError);
      showMessage(loginMessage, "Owner যাচাই ব্যর্থ: " + detail + "\nনিরাপত্তার কারণে সেশন বন্ধ করা যায়নি। অ্যাপ বন্ধ করে আবার খুলুন।");
    }
    return;
  }

  if (revision !== authStateRevision) return;
  if (!allowed) {
    showMessage(loginMessage, "এই অ্যাকাউন্টের Owner অনুমতি নেই। Firebase Authentication UID ও users/admin UID মিলিয়ে দেখুন।");
    await signOut(auth);
    return;
  }

  isAdmin = true;
  document.querySelector(".gio-admin-bottom-nav")?.removeAttribute("hidden");
  if ($("adminHomeNav")) $("adminHomeNav").hidden = false;
  document.querySelector(".gio-admin-help")?.removeAttribute("hidden");

  if (loginPage) { loginPage.hidden = true; loginPage.classList.remove("active"); }
  if (adminPage) { adminPage.hidden = false; adminPage.classList.add("active"); }
  if (adminSettingsPage) { adminSettingsPage.hidden = true; adminSettingsPage.classList.remove("active"); }
  if (logoutBtn) logoutBtn.hidden = false;
  if (authStatus) authStatus.textContent = "ওনার হিসেবে লগইন আছেন";
  const adminDisplayName = $("adminDisplayName");
  if (adminDisplayName) adminDisplayName.textContent = user.displayName || user.email || "Admin";

  await loadAdminOrders();
  await loadCustomerManagement();
  await loadDashboardStats();
  await loadPaymentSettings();
  await loadAdminPackages();
  await loadYellowDiamondPackages();
  await loadSupportContact();
  startOwnerLiveSync();
}, (error) => {
  console.error("Firebase Auth state listener failed:", error);
  showMessage(loginMessage, "Firebase লগইন অবস্থা যাচাই করা যায়নি: " + (error?.code || error?.message || "অজানা সমস্যা"));
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


async function loadAdminOrders() {
  if (!isAdmin) return;
  const activeBox = $("adminOrders");
  const historyBox = $("adminOrderHistory");
  const archivedBox = $("adminArchivedOrders");
  const rejectedBox = $("adminRejectedOrders");
  try {
    const snapshot = await getDocs(collection(db, "orders"));
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
        if (data.transactionId) {
          const copyTransactionId = makeButton("Transaction ID কপি", async () => {
            const value = String(data.transactionId);
            try {
              if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
              } else {
                const temporary = document.createElement("textarea");
                temporary.value = value;
                temporary.style.position = "fixed";
                temporary.style.opacity = "0";
                document.body.appendChild(temporary);
                temporary.select();
                const copied = document.execCommand("copy");
                temporary.remove();
                if (!copied) throw new Error("Copy command failed");
              }
              copyTransactionId.textContent = "কপি হয়েছে ✓";
              setTimeout(() => { copyTransactionId.textContent = "Transaction ID কপি"; }, 1800);
            } catch (error) {
              alert("Transaction ID কপি করা যায়নি। নিজে নির্বাচন করে কপি করুন।");
            }
          });
          card.appendChild(copyTransactionId);
        }
        if (data.paymentScreenshotUrl) {
          const link = document.createElement("a");
          link.href = data.paymentScreenshotUrl; link.target = "_blank";
          link.rel = "noopener noreferrer"; link.textContent = "পেমেন্ট স্ক্রিনশট দেখুন";
          card.appendChild(link);
        }
        if (canChange) {
          card.appendChild(makeButton("Approve", () => updateOrderStatus(id, "Completed")));
          card.appendChild(makeButton("Reject", () => updateOrderStatus(id, "Cancelled")));
        }
        if (canArchive) card.appendChild(makeButton("Delete / Archive", () => archiveOrder(id)));
        if (box === archivedBox) card.appendChild(makeButton("Restore", () => restoreOrder(id)));
        box.appendChild(card);
      });
    };
    renderRows(activeBox, active, "কোনো Pending বা Processing অর্ডার নেই।", true, true);
    renderRows(historyBox, history, "এখনো কোনো Approved / Completed অর্ডার নেই।", false, true);
    renderRows(rejectedBox, rejected, "Rejected অর্ডার নেই।", false, true);
    renderRows(archivedBox, archived, "Deleted / Archived অর্ডার নেই।", false, false);
  } catch (error) {
    console.error("Orders error:", error);
    [activeBox, historyBox, rejectedBox, archivedBox].filter(Boolean).forEach(box => box.textContent = "অর্ডার লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।");
  }
}

async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;
  try {
    await runTransaction(db, async transaction => {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("অর্ডারটি পাওয়া যায়নি।");
      const order = orderSnap.data();
      const isYellowDiamond = String(order.diamondType || order.packageType || "").toLowerCase().includes("yellow") || order.isYellowDiamond === true;
      if (status === "Completed" && order.stockDeducted === true) throw new Error("এই অর্ডারটি ইতিমধ্যে সম্পন্ন হয়েছে। দ্বিতীয়বার Approve করা যাবে না।");
      const shouldDeduct = status === "Completed" && !isYellowDiamond
        && ["Pending", "Processing"].includes(order.status || "Pending") && order.stockDeducted !== true;
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
          stockType: "black",
          updatedAt: serverTimestamp()
        }, { merge: true });
        transaction.update(orderRef, {
          status: "Completed", diamondType: "black", stockDeducted: true, stockDeductedQuantity: quantity,
          stockDeductedAt: serverTimestamp(), isArchived: false, updatedAt: serverTimestamp()
        });
      } else {
        transaction.update(orderRef, { status, ...(isYellowDiamond ? { diamondType: "yellow", stockDeducted: false } : {}), isArchived: false, updatedAt: serverTimestamp() });
      }
    });
    await loadAdminOrders(); await loadDashboardStats();
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
    [uid,data.profileId,data.displayName,data.name,data.email,data.phone,data.mobile].join(" ").toLowerCase().includes(term)
  );
  box.replaceChildren();
  if (!rows.length) { box.textContent = "কোনো কাস্টমার পাওয়া যায়নি।"; return; }
  rows.forEach(({uid,data}) => {
    const card = document.createElement("article");
    card.className = "order-card";
    const title = document.createElement("strong");
    title.textContent = data.displayName || data.name || "নাম দেওয়া হয়নি";
    const info = document.createElement("p");
    info.textContent = "ইমেইল: " + (data.email || "—") + " | ফোন: " + (data.phone || data.mobile || "—") + " | Agent Profile ID: " + (data.profileId || "এখনো তৈরি হয়নি") + " | Customer ID: " + uid;
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
            || (phone && [d.customerPhone,d.phone].some(value => String(value || "") === phone));
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
    const [ordersSnapshot, stockSnapshot] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDoc(doc(db, "settings", "diamondStock"))
    ]);
    let salesDiamond = 0;
    ordersSnapshot.forEach(item => {
      const data = item.data();
      if (data.status === "Completed") {
        salesDiamond += Number(data.diamondQuantity)
          || Number(String(data.packageName || "").match(/[0-9]+/)?.[0]) || 0;
      }
    });
    const stock = Number(stockSnapshot.exists() ? stockSnapshot.data().quantity : 0);
    const totalDiamond = stock + salesDiamond;
    container.replaceChildren();

    const stockCard = document.createElement("article");
    stockCard.className = "dashboard-stat-card gio-diamond-tile gio-stock-tile";
    const stockTop = document.createElement("div");
    stockTop.className = "gio-diamond-tile-top";
    const stockTitle = document.createElement("strong");
    stockTitle.textContent = "CURRENT DIAMOND";
    const editToggle = document.createElement("button");
    editToggle.type = "button";
    editToggle.className = "gio-stock-edit-toggle";
    editToggle.textContent = "Edit";
    editToggle.setAttribute("aria-label", "Stock সম্পাদনা");
    const stockGem = document.createElement("div");
    stockGem.className = "gio-dashboard-gem";
    stockGem.setAttribute("aria-hidden", "true");
    stockGem.textContent = "💎";
    const stockValue = document.createElement("p");
    stockValue.className = "gio-diamond-value";
    stockValue.textContent = stock.toLocaleString("en-BD");
    const controls = document.createElement("div");
    controls.className = "gio-stock-controls gio-stock-edit-panel";
    controls.hidden = true;
    const minus = document.createElement("button");
    minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label","এক Diamond কমান");
    const edit = document.createElement("input");
    edit.type = "number"; edit.min = "0"; edit.step = "1"; edit.inputMode = "numeric";
    edit.setAttribute("aria-label","Black Diamond Stock সংখ্যা");
    edit.value = String(stock);
    const plus = document.createElement("button");
    plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label","এক Diamond বাড়ান");
    const save = document.createElement("button");
    save.type = "button"; save.className = "gio-stock-save"; save.textContent = "Save";
    const updateEdit = delta => { edit.value = String(Math.max(0, Number(edit.value || 0) + delta)); };
    minus.addEventListener("click",()=>updateEdit(-1));
    plus.addEventListener("click",()=>updateEdit(1));
    save.addEventListener("click",()=>{
      if(!isAdmin)return;
      const target=$("diamondStockQuantity");
      if(!target)return;
      target.value=edit.value;
      $("diamondStockForm")?.requestSubmit();
    });
    editToggle.addEventListener("click",()=>{
      controls.hidden = !controls.hidden;
      editToggle.textContent = controls.hidden ? "Edit" : "Close";
      if (!controls.hidden) edit.focus();
    });
    stockTop.append(stockTitle, editToggle);
    controls.append(minus,edit,plus,save);
    stockCard.append(stockTop,stockGem,stockValue,controls);
    container.appendChild(stockCard);

    const salesCard = document.createElement("article");
    salesCard.className = "dashboard-stat-card gio-diamond-tile gio-sales-tile";
    const salesTitle = document.createElement("strong");
    salesTitle.textContent = "SALES DIAMOND";
    const salesGem = document.createElement("div");
    salesGem.className = "gio-dashboard-gem";
    salesGem.setAttribute("aria-hidden", "true");
    salesGem.textContent = "💎";
    const salesValue = document.createElement("p");
    salesValue.className = "gio-diamond-value";
    salesValue.textContent = salesDiamond.toLocaleString("en-BD");
    salesCard.append(salesTitle,salesGem,salesValue);
    container.appendChild(salesCard);

    const totalCard = document.createElement("article");
    totalCard.className = "dashboard-stat-card gio-diamond-tile gio-total-tile";
    const totalTitle = document.createElement("strong");
    totalTitle.textContent = "TOTAL DIAMOND";
    const totalGem = document.createElement("div");
    totalGem.className = "gio-dashboard-gem";
    totalGem.setAttribute("aria-hidden", "true");
    totalGem.textContent = "💎";
    const totalValue = document.createElement("p");
    totalValue.className = "gio-diamond-value";
    totalValue.textContent = totalDiamond.toLocaleString("en-BD");
    totalCard.append(totalTitle,totalGem,totalValue);
    container.appendChild(totalCard);

    const stockInput = $("diamondStockQuantity");
    if (stockInput && document.activeElement !== stockInput) stockInput.value = String(stock);
  } catch(error) {
    console.error("Dashboard error:", error);
    container.textContent = "ড্যাশবোর্ডের তথ্য লোড করা যায়নি।";
  }
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

async function loadYellowDiamondPackages() {
  const container = $("adminYellowPackages");
  if (!container || !isAdmin) return;
  container.textContent = "Yellow Diamond প্যাকেজ লোড হচ্ছে...";
  try {
    const snapshot = await getDocs(collection(db, "yellowDiamondPackages"));
    const bySlot = new Map();
    snapshot.forEach(item => { const slot = Number(item.data().slot); if (Number.isInteger(slot) && slot >= 1 && slot <= 3) bySlot.set(slot, item.data()); });
    container.replaceChildren();
    for (let slot = 1; slot <= 3; slot++) {
      const data = bySlot.get(slot) || {};
      const quantity = $("yellowPackageDiamond" + slot), price = $("yellowPackagePrice" + slot);
      if (quantity) quantity.value = data.active !== false && data.diamondQuantity ? String(data.diamondQuantity) : "";
      if (price) price.value = data.active !== false && data.price ? String(data.price) : "";
      const card = document.createElement("div"); card.className = "order-card";
      const title = document.createElement("h4"); title.textContent = "Yellow প্যাকেজ " + slot;
      const details = document.createElement("p");
      details.textContent = data.active !== false && data.diamondQuantity && data.price
        ? Number(data.diamondQuantity) + " Yellow Diamond — ৳" + Number(data.price)
        : "এখনো সেট করা হয়নি / বন্ধ";
      card.append(title, details); container.appendChild(card);
    }
  } catch (error) {
    console.error("Yellow Diamond packages:", error);
    container.textContent = "Yellow Diamond প্যাকেজ লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।";
  }
}

const yellowPackageForm = $("yellowPackageForm");
if (yellowPackageForm) {
  yellowPackageForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;
    const message = $("yellowPackageMessage"), slots = [];
    for (let slot = 1; slot <= 3; slot++) {
      const quantityRaw = $("yellowPackageDiamond" + slot)?.value.trim() || "";
      const priceRaw = $("yellowPackagePrice" + slot)?.value.trim() || "";
      if (!quantityRaw && !priceRaw) { slots.push({slot,active:false}); continue; }
      const diamondQuantity = Number(quantityRaw), price = Number(priceRaw);
      if (!Number.isSafeInteger(diamondQuantity) || diamondQuantity <= 0 || !Number.isFinite(price) || price <= 0) {
        showMessage(message, "Yellow প্যাকেজ " + slot + ": সঠিক Diamond সংখ্যা ও টাকা লিখুন।"); return;
      }
      slots.push({slot,active:true,diamondQuantity,price});
    }
    try {
      for (const item of slots) await setDoc(doc(db,"yellowDiamondPackages","yellow_package_slot_"+item.slot), {
        slot:item.slot, active:item.active, diamondQuantity:item.active?item.diamondQuantity:0,
        name:item.active?item.diamondQuantity+" Yellow Diamond":"",
        price:item.active?item.price:0, updatedAt:serverTimestamp(),
        updatedBy:auth.currentUser?.uid || ""
      });
      // Retire legacy slots 4–5 so only the three configured Yellow packages remain active.
      for (const slot of [4, 5]) await setDoc(doc(db,"yellowDiamondPackages","yellow_package_slot_"+slot), {slot,active:false,diamondQuantity:0,name:"",price:0,updatedAt:serverTimestamp(),updatedBy:auth.currentUser?.uid || ""});
      showMessage(message, "৩টি Yellow Diamond প্যাকেজ সংরক্ষণ হয়েছে।", true);
      await loadYellowDiamondPackages();
    } catch(error) {
      console.error("Save Yellow Diamond packages:", error);
      showMessage(message, "Yellow Diamond প্যাকেজ সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।");
    }
  });
}

async function loadAdminPackages() {
  const container = $("adminPackages");
  if (!container || !isAdmin) return;
  container.textContent = "প্যাকেজ লোড হচ্ছে...";
  try {
    const snapshot = await getDocs(collection(db, "packages"));
    const bySlot = new Map();
    snapshot.forEach(item => { const slot = Number(item.data().slot); if (Number.isInteger(slot) && slot >= 1 && slot <= 5) bySlot.set(slot, item.data()); });
    container.replaceChildren();
    for (let slot = 1; slot <= 5; slot++) {
      const data = bySlot.get(slot) || {};
      const quantityInput = $("packageDiamond" + slot);
      const priceInput = $("packagePrice" + slot);
      if (quantityInput) quantityInput.value = data.active !== false && data.diamondQuantity ? String(data.diamondQuantity) : "";
      if (priceInput) priceInput.value = data.active !== false && data.price ? String(data.price) : "";
      const card = document.createElement("div"); card.className = "order-card";
      const title = document.createElement("h4"); title.textContent = "প্যাকেজ " + slot;
      const details = document.createElement("p");
      details.textContent = data.active !== false && data.diamondQuantity && data.price ? Number(data.diamondQuantity) + " Diamond — ৳" + Number(data.price) : "এখনো সেট করা হয়নি / বন্ধ";
      card.append(title, details); container.appendChild(card);
    }
  } catch (error) { console.error("Packages error:", error); container.textContent = "প্যাকেজ লোড করা যায়নি।"; }
}

const packageForm = $("packageForm");
if (packageForm) {
  packageForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;
    const message = $("packageMessage"), slots = [];
    for (let slot = 1; slot <= 5; slot++) {
      const quantityRaw = $("packageDiamond" + slot)?.value.trim() || "";
      const priceRaw = $("packagePrice" + slot)?.value.trim() || "";
      if (!quantityRaw && !priceRaw) { slots.push({ slot, active: false }); continue; }
      const diamondQuantity = Number(quantityRaw), price = Number(priceRaw);
      if (!Number.isSafeInteger(diamondQuantity) || diamondQuantity <= 0 || !Number.isFinite(price) || price <= 0) {
        showMessage(message, "প্যাকেজ " + slot + ": Diamond সংখ্যা ও সঠিক টাকা লিখুন।"); return;
      }
      slots.push({ slot, active: true, diamondQuantity, price });
    }
    try {
      for (const item of slots) await setDoc(doc(db, "packages", "package_slot_" + item.slot), {
        slot: item.slot, active: item.active, diamondQuantity: item.active ? item.diamondQuantity : 0,
        name: item.active ? item.diamondQuantity + " Diamond" : "", price: item.active ? item.price : 0,
        updatedAt: serverTimestamp()
      });
      showMessage(message, "৫টি প্যাকেজের সেটিংস সংরক্ষণ হয়েছে।", true);
      await loadAdminPackages();
    } catch (error) {
      console.error("Save five packages:", error);
      showMessage(message, "প্যাকেজ সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।");
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


// GIO BD Owner in-app APK updater (native Android bridge).
(async function setupOwnerAppUpdater() {
  const manifestUrl = "https://gio-bd-admin.web.app/updates/admin-version.json";
  const nativePlatform = window.Capacitor?.isNativePlatform?.() === true;
  if (!nativePlatform) return;

  let AppUpdate;
  try {
    // Load the optional native updater only after the login handlers are registered.
    // A CDN/plugin failure must never prevent the OTP login module from starting.
    const capacitorCore = await import("https://cdn.jsdelivr.net/npm/@capacitor/core@8.6.0/dist/index.js");
    AppUpdate = capacitorCore.registerPlugin("AppUpdate");
  } catch (error) {
    console.warn("App updater module unavailable; continuing without updater:", error);
    return;
  }

  let installed;
  try {
    installed = await AppUpdate.getAppVersion();
  } catch (error) {
    console.warn("App updater native bridge unavailable:", error);
    return;
  }

  const banner = document.createElement("section");
  banner.id = "gioAppUpdateBanner";
  banner.setAttribute("role", "status");
  banner.style.cssText = "display:none;margin:12px auto;padding:14px;max-width:900px;border:1px solid #8b75c9;border-radius:14px;background:#21183c;color:#fff;box-sizing:border-box";
  const heading = document.createElement("strong");
  heading.textContent = "নতুন GIO BD Owner আপডেট পাওয়া গেছে";
  const detail = document.createElement("p");
  detail.style.cssText = "margin:8px 0;font-size:14px";
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = "আপডেট নাও";
  action.style.cssText = "padding:10px 14px;border:0;border-radius:9px;background:#a78bfa;color:#160d2b;font-weight:700";
  const status = document.createElement("p");
  status.style.cssText = "margin:8px 0 0;font-size:13px";
  banner.append(heading, detail, action, status);
  const header = document.querySelector("header.header");
  if (header?.parentNode) header.insertAdjacentElement("afterend", banner);
  else document.body.prepend(banner);

  let latestManifest = null;
  action.addEventListener("click", async () => {
    if (!latestManifest?.apkUrl) return;
    try {
      action.disabled = true;
      status.textContent = "APK ডাউনলোড শুরু হচ্ছে...";
      await AppUpdate.installUpdate({ apkUrl: latestManifest.apkUrl });
      status.textContent = "ডাউনলোড শুরু হয়েছে। ডাউনলোড শেষ হলে Android-এর ইনস্টল স্ক্রিন আসবে।";
    } catch (error) {
      console.error("Owner app update:", error);
      status.textContent = error?.message || "আপডেট শুরু করা যায়নি। অনুমতি পরীক্ষা করে আবার চেষ্টা করুন।";
    } finally {
      action.disabled = false;
    }
  });

  try {
    const response = await fetch(manifestUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Update server response: " + response.status);
    const manifest = await response.json();
    if (manifest.appId !== "com.giobd.admin") throw new Error("এই আপডেটটি GIO BD Owner অ্যাপের জন্য নয়");
    const latestCode = Number(manifest.versionCode);
    const currentCode = Number(installed.versionCode);
    const apk = new URL(manifest.apkUrl);
    if (apk.hostname !== "github.com" || !apk.pathname.includes("/releases/latest/download/")) {
      throw new Error("Untrusted APK download address");
    }
    if (!Number.isFinite(latestCode) || !Number.isFinite(currentCode) || latestCode <= currentCode) return;
    latestManifest = manifest;
    detail.textContent = "বর্তমান ভার্সন " + (installed.versionName || currentCode) +
      " · নতুন ভার্সন " + (manifest.versionName || latestCode) +
      "। আপডেট ইনস্টল করতে Android-এর অনুমতি দিতে হবে।";
    banner.style.display = "block";
  } catch (error) {
    console.warn("Could not check Owner app update:", error);
  }
})();
