import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithCustomToken,
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
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction
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
const OWNER_AUTH_API_BASE_URL = "https://gio-bd-owner-auth.onrender.com";

const $ = (id) => document.getElementById(id);

const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const adminPage = $("adminPage");
const loginPage = $("loginPage");
const adminSettingsPage = $("adminSettingsPage");
const authStatus = $("authStatus");
const logoutBtn = $("logoutBtn");

let isAdmin = false;
let stopOrdersRealtime = null;

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

const adminLanguageToggle = $("adminLanguageToggle");
let adminLanguage = "bn";
const adminTranslations = [
  ["#loginPage h2", "Owner লগইন", "Owner Login"],
  [".owner-login-description", "শুধুমাত্র অনুমোদিত Owner প্রবেশ করতে পারবেন।", "Only the authorized Owner can sign in."],
  ['label[for="adminEmail"]', "Owner Gmail", "Owner Gmail"],
  ['#ownerSendOtpBtn', "OTP পাঠান", "Send OTP"],
  ['label[for="ownerOtpCode"]', "৬ সংখ্যার OTP", "6-digit OTP"],
  ['#ownerOtpCode', "৬ সংখ্যার OTP লিখুন", "Enter 6-digit OTP"],
  ['#ownerVerifyOtpBtn', "OTP যাচাই করে লগইন", "Verify OTP & Login"],
  ["#adminPage > h2", "ড্যাশবোর্ড", "Dashboard"],
  ["#adminSettingsPage > h2", "অ্যাডমিন সেটিংস", "Owner Settings"],
  ['label[for="diamondStockQuantity"]', "মোট Diamond Stock", "Total Diamond Stock"],
  ['#diamondStockForm button', "Stock সংরক্ষণ করুন", "Save Stock"],
  ['#orderSearch', "অর্ডার ID, কাস্টমার, IMO ID, ফোন বা Transaction ID খুঁজুন", "Search Order ID, customer, IMO ID, phone or Transaction ID"],
  ['label[for="bkashNumber"]', "বিকাশ Personal নম্বর", "bKash Personal Number"],
  ['label[for="nagadNumber"]', "নগদ Personal নম্বর", "Nagad Personal Number"],
  ['label[for="rocketNumber"]', "রকেট নম্বর", "Rocket Number"],
  ['#paymentSettingsForm button', "নম্বর সংরক্ষণ করুন", "Save Payment Numbers"],
  ['label[for="whatsappNumber"]', "WhatsApp নম্বর (দেশের কোডসহ)", "WhatsApp Number (with country code)"],
  ['#supportContactForm button', "WhatsApp নম্বর সংরক্ষণ করুন", "Save WhatsApp Number"],
  ['#packageForm button', "প্যাকেজ যোগ করুন", "Add Package"],
  ['#adminPage h3', "ড্যাশবোর্ড", "Dashboard"]
];
function applyAdminLanguage() {
  adminTranslations.forEach(([selector,bn,en]) => {
    document.querySelectorAll(selector).forEach(element => {
      if (element instanceof HTMLInputElement) element.placeholder = adminLanguage === "en" ? en : bn;
      else element.textContent = adminLanguage === "en" ? en : bn;
    });
  });
  if (adminLanguageToggle) adminLanguageToggle.textContent = adminLanguage === "bn" ? "English" : "বাংলা";
  document.documentElement.lang = adminLanguage;
}
adminLanguageToggle?.addEventListener("click", () => {
  adminLanguage = adminLanguage === "bn" ? "en" : "bn";
  applyAdminLanguage();
});


const ownerEmailInput = $("adminEmail");
const ownerOtpInput = $("ownerOtpCode");
const ownerSendOtpButton = $("ownerSendOtpBtn");
const ownerVerifyOtpButton = $("ownerVerifyOtpBtn");
const ownerOtpVerifySection = $("ownerOtpVerifySection");

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

if (ownerSendOtpButton) {
  ownerSendOtpButton.addEventListener("click", async () => {
    const email = ownerEmailInput?.value.trim().toLowerCase();
    if (!email) {
      showMessage(loginMessage, "প্রথমে Owner Gmail লিখুন।");
      ownerEmailInput?.focus();
      return;
    }
    if (email !== "mdniloy41212@gmail.com") {
      showMessage(loginMessage, "এই Gmail দিয়ে Owner Login অনুমোদিত নয়।");
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
    if (email !== "mdniloy41212@gmail.com") {
      showMessage(loginMessage, "অনুমোদিত Owner Gmail লিখুন।");
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
      const verificationToken = verification.verificationToken;
      if (!verificationToken) throw new Error("OTP যাচাইয়ের টোকেন পাওয়া যায়নি।");

      const completed = await ownerAuthRequest("/api/owner/complete-login", {
        email,
        verificationToken
      });
      if (!completed.customToken) throw new Error("Firebase Login Token পাওয়া যায়নি।");

      showMessage(loginMessage, "লগইন হচ্ছে...", true);
      await signInWithCustomToken(auth, completed.customToken);
    } catch (error) {
      console.error("Owner OTP login error:", error);
      showMessage(loginMessage, error.message || "OTP যাচাই করে লগইন করা যায়নি।");
    } finally {
      ownerVerifyOtpButton.disabled = false;
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (stopOrdersRealtime) { stopOrdersRealtime(); stopOrdersRealtime = null; }
  isAdmin = false;

  if (!user) {
    document.querySelector(".gio-admin-bottom-nav")?.setAttribute("hidden", "");
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
  stopOrdersRealtime = onSnapshot(collection(db, "orders"), snapshot => {
    const pendingCount = snapshot.docs.filter(item => ["Pending", "Processing"].includes(item.data().status || "Pending") && item.data().isArchived !== true).length;
    const alertBox = $("adminOrderAlert");
    if (alertBox) alertBox.textContent = "নতুন / চলমান অর্ডার: " + pendingCount;
    loadAdminOrders();
    loadDashboardStats();
  }, error => {
    console.error("Realtime orders listener:", error);
    const alertBox = $("adminOrderAlert");
    if (alertBox) alertBox.textContent = "অর্ডার নোটিফিকেশন লোড হয়নি।";
  });
  document.querySelector(".gio-admin-bottom-nav")?.removeAttribute("hidden");
  document.querySelector(".gio-admin-help")?.removeAttribute("hidden");

  if (loginPage) { loginPage.hidden = true; loginPage.classList.remove("active"); }
  if (adminPage) { adminPage.hidden = false; adminPage.classList.add("active"); }
  if (adminSettingsPage) { adminSettingsPage.hidden = true; adminSettingsPage.classList.remove("active"); }
  if (logoutBtn) logoutBtn.hidden = true;
  if (authStatus) authStatus.hidden = true;
  const adminDisplayName = $("adminDisplayName");
  if (adminDisplayName) adminDisplayName.textContent = user.displayName || user.email || "Admin";

  await loadAdminOrders();
  await loadDashboardStats();
  await loadPaymentSettings();
  await loadAdminPackages();
  await loadYellowDiamondPackages();
  await loadSupportContact();
});

const settingsButton = $("adminSettingsButton");
const settingsBackButton = $("adminSettingsBack");
if (settingsButton) { settingsButton.hidden = true;
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
        if (data.paymentScreenshotUrl) {
          const link = document.createElement("a");
          link.href = data.paymentScreenshotUrl; link.target = "_blank";
          link.rel = "noopener noreferrer"; link.textContent = "পেমেন্ট স্ক্রিনশট দেখুন";
          card.appendChild(link);
        }
        if (canChange && !["Completed", "Rejected", "Cancelled"].includes(data.status)) {
          if (data.status === "Approved") {
            card.appendChild(makeButton("Confirm / Complete", () => updateOrderStatus(id, "Completed")));
          } else if (data.paymentVerified === true) {
            card.appendChild(makeButton("Confirm", () => updateOrderStatus(id, "Approved")));
          } else {
            card.appendChild(makeButton("পেমেন্ট যাচাই করুন", () => verifyPayment(id)));
          }
          card.appendChild(makeButton("Cancel / Reject", () => updateOrderStatus(id, "Rejected")));
        }
        if (canArchive) card.appendChild(makeButton("Delete / Archive", () => archiveOrder(id)));
        if (box === archivedBox) card.appendChild(makeButton("Restore", () => restoreOrder(id)));
        box.appendChild(card);
      });
    };
    renderRows(activeBox, active, "কোনো Pending বা Processing অর্ডার নেই।", true, true);
    renderRows(historyBox, history, "এখনো কোনো Approved / Completed অর্ডার নেই।", true, true);
    renderRows(rejectedBox, rejected, "Rejected অর্ডার নেই।", false, true);
    renderRows(archivedBox, archived, "Deleted / Archived অর্ডার নেই।", false, false);
  } catch (error) {
    console.error("Orders error:", error);
    [activeBox, historyBox, rejectedBox, archivedBox].filter(Boolean).forEach(box => box.textContent = "অর্ডার লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।");
  }
}

async function verifyPayment(orderId) {
  if (!isAdmin) return;
  try {
    const orderSnapshot = await getDoc(doc(db, "orders", orderId));
    if (!orderSnapshot.exists()) throw new Error("অর্ডার পাওয়া যায়নি।");
    const transactionId = String(orderSnapshot.data().transactionId || "").trim();
    if (!transactionId) throw new Error("Transaction ID না থাকলে পেমেন্ট Verified করা যাবে না।");
    if (orderSnapshot.data().paymentVerified === true) {
      alert("এই অর্ডারের পেমেন্ট আগেই Verified করা হয়েছে।");
      return;
    }
    if (!confirm("Transaction ID: " + transactionId +
      "\n\nআপনি কি bKash / Nagad / Rocket-এর লেনদেনের তথ্য মিলিয়ে টাকা পাওয়ার বিষয়টি নিজে যাচাই করেছেন?\n\nশুধু নিশ্চিত হওয়ার পর OK চাপুন।")) return;
    await updateDoc(doc(db, "orders", orderId), {
      paymentVerified: true,
      paymentVerifiedAt: serverTimestamp(),
      paymentVerifiedBy: auth.currentUser?.uid || "",
      updatedAt: serverTimestamp()
    });
    await loadAdminOrders();
  } catch (error) {
    console.error("Payment verification error:", error);
    alert("পেমেন্ট যাচাই করা যায়নি: " + (error.message || "অজানা সমস্যা"));
  }
}

async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;
  try {
    const notificationOrder = await runTransaction(db, async transaction => {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("অর্ডারটি পাওয়া যায়নি।");
      const order = orderSnap.data();
      if (status === "Approved" && order.paymentVerified !== true) {
        throw new Error("প্রথমে Transaction ID ও পেমেন্ট নিজে যাচাই করে ‘পেমেন্ট যাচাই করুন’ চাপুন।");
      }
      const paymentIsVerified = order.paymentVerified === true;
      const isYellowDiamondOrder = String(order.packageType || "").toLowerCase() === "yellow";
      if (order.status === "Completed" && status !== "Completed") {
        throw new Error("Completed অর্ডারের স্ট্যাটাস পরিবর্তন করা যাবে না।");
      }
      if (status === "Completed" && order.status !== "Approved") {
        throw new Error("প্রথমে Payment Verified করে অর্ডার Approved করুন, তারপর Completed করুন।");
      }
      if (status === "Completed" && order.paymentVerified !== true) {
        throw new Error("Payment Verified না করে অর্ডার Completed করা যাবে না।");
      }
      if (status === "Completed" && order.stockDeducted !== true && !isYellowDiamondOrder) {
        throw new Error("অর্ডার Approved হওয়ার সময় Diamond Stock কাটা হয়নি। আগে Stock ও Approval যাচাই করুন।");
      }

      // Deduct stock exactly once when Admin approves an already payment-verified order.
      const shouldDeduct = status === "Approved"
        && paymentIsVerified
        && order.stockDeducted !== true
        && order.status !== "Completed"
        && !isYellowDiamondOrder;

      // If an approved, not-yet-completed order is cancelled/rejected, return its reserved stock.
      const shouldRestore = ["Cancelled", "Rejected"].includes(status)
        && order.status === "Approved"
        && order.stockDeducted === true
        && order.stockRestored !== true
        && !isYellowDiamondOrder;
      const shouldDebitMoney = shouldDeduct && order.balanceDeducted !== true;
      const shouldRefundMoney = shouldRestore && order.balanceDeducted === true && order.balanceRefunded !== true;

      let balanceRef = null;
      let balanceSnap = null;
      let currentBalance = 0;
      const orderAmount = Number(order.price);
      if ((shouldDebitMoney || shouldRefundMoney) && (!Number.isFinite(orderAmount) || orderAmount < 0)) {
        throw new Error("অর্ডারের সঠিক মূল্য পাওয়া যায়নি; ব্যালেন্স পরিবর্তন করা হয়নি।");
      }
      if (shouldDebitMoney || shouldRefundMoney) {
        balanceRef = doc(db, "settings", "mainBalance");
        balanceSnap = await transaction.get(balanceRef);
        currentBalance = Number(balanceSnap.exists() ? balanceSnap.data().amount : 0);
        if (!Number.isFinite(currentBalance) || currentBalance < 0) {
          throw new Error("Owner Main Balance সঠিক নয়।");
        }
        if (shouldDebitMoney && currentBalance < orderAmount) {
          throw new Error("Owner Main Balance অপর্যাপ্ত। প্রয়োজন ৳" + orderAmount + ", আছে ৳" + currentBalance);
        }
      }

      if (shouldDeduct) {
        const quantity = Number(order.diamondQuantity)
          || Number(String(order.packageName || "").match(/[0-9]+/)?.[0]) || 0;
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("এই অর্ডারের Diamond quantity পাওয়া যায়নি। প্যাকেজের পরিমাণ ঠিক করুন।");
        }
        const stockRef = doc(db, "settings", "diamondStock");
        const stockSnap = await transaction.get(stockRef);
        const currentStock = Number(stockSnap.exists() ? stockSnap.data().quantity : 0);
        if (!Number.isFinite(currentStock) || currentStock < quantity) {
          throw new Error("পর্যাপ্ত Diamond Stock নেই। বর্তমান স্টক: " + currentStock);
        }
        transaction.set(stockRef, {
          quantity: currentStock - quantity,
          updatedAt: serverTimestamp()
        }, { merge: true });
        if (shouldDebitMoney) {
          transaction.set(balanceRef, {
            amount: currentBalance - orderAmount,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid || ""
          }, { merge: true });
        }
        transaction.update(orderRef, {
          status, statusChangedAt: serverTimestamp(), paymentVerified: true,
          paymentVerifiedAt: order.paymentVerified === true ? (order.paymentVerifiedAt || serverTimestamp()) : serverTimestamp(),
          stockDeducted: true, stockDeductedQuantity: quantity,
          stockDeductedAt: serverTimestamp(), stockRestored: false,
          balanceDeducted: shouldDebitMoney || order.balanceDeducted === true,
          balanceDeductedAmount: shouldDebitMoney ? orderAmount : (Number(order.balanceDeductedAmount) || 0),
          balanceDeductedAt: shouldDebitMoney ? serverTimestamp() : (order.balanceDeductedAt || null),
          balanceRefunded: false,
          isArchived: false, updatedAt: serverTimestamp()
        });
      } else if (shouldRestore) {
        const quantity = Number(order.stockDeductedQuantity)
          || Number(order.diamondQuantity)
          || Number(String(order.packageName || "").match(/[0-9]+/)?.[0]) || 0;
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("ফেরত দেওয়ার Diamond quantity পাওয়া যায়নি। Admin-এর সহায়তা নিন।");
        }
        const stockRef = doc(db, "settings", "diamondStock");
        const stockSnap = await transaction.get(stockRef);
        const currentStock = Number(stockSnap.exists() ? stockSnap.data().quantity : 0);
        transaction.set(stockRef, {
          quantity: currentStock + quantity,
          updatedAt: serverTimestamp()
        }, { merge: true });
        if (shouldRefundMoney) {
          transaction.set(balanceRef, {
            amount: currentBalance + orderAmount,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid || ""
          }, { merge: true });
        }
        transaction.update(orderRef, {
          status, statusChangedAt: serverTimestamp(), stockDeducted: false, stockRestored: true,
          stockRestoredQuantity: quantity, stockRestoredAt: serverTimestamp(),
          balanceRefunded: shouldRefundMoney || order.balanceRefunded === true,
          balanceRefundedAmount: shouldRefundMoney ? orderAmount : (Number(order.balanceRefundedAmount) || 0),
          balanceRefundedAt: shouldRefundMoney ? serverTimestamp() : (order.balanceRefundedAt || null),
          isArchived: false, updatedAt: serverTimestamp()
        });
      } else {
        transaction.update(orderRef, { status, statusChangedAt: serverTimestamp(), isArchived: false, updatedAt: serverTimestamp() });
      }
      return { userId: order.userId || order.customerUid || "", packageName: order.packageName || "Diamond Order", price: order.price };
    });
    if (notificationOrder?.userId && ["Completed", "Cancelled", "Rejected"].includes(status)) {
      const completed = status === "Completed";
      try {
        await addDoc(collection(db, "supportMessages"), {
          userUid: notificationOrder.userId,
          senderRole: "admin",
          senderName: "GIO BD অর্ডার আপডেট",
          text: completed
            ? "✅ আপনার অর্ডার রিসিভ হয়েছে। অর্ডার কমপ্লিট। প্যাকেজ: " + notificationOrder.packageName + " | মূল্য: ৳" + (notificationOrder.price ?? "—") + " | Order ID: " + orderId
            : "❌ দুঃখিত, আপনার অর্ডারটি ক্যানসেল হয়েছে। প্যাকেজ: " + notificationOrder.packageName + " | Order ID: " + orderId,
          orderId,
          orderStatus: status,
          createdAt: serverTimestamp()
        });
      } catch (notificationError) {
        console.error("Customer order notification could not be sent:", notificationError);
        alert("অর্ডারের স্ট্যাটাস আপডেট হয়েছে, তবে কাস্টমার নোটিফিকেশন পাঠানো যায়নি: " + notificationError.message);
      }
    }
    await loadAdminOrders(); await loadDashboardStats();
  } catch (error) {
    console.error("Update order error:", error);
    alert("অর্ডারের অবস্থা পরিবর্তন করা যায়নি: " + (error.message || "অজানা সমস্যা"));
  }
}

async function archiveOrder(orderId) {
  if (!isAdmin) return;
  try {
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    if (!orderSnap.exists()) throw new Error("অর্ডার পাওয়া যায়নি।");
    const createdAt = orderSnap.data().createdAt?.toMillis?.() || 0;
    if (!createdAt || Date.now() - createdAt < 12 * 60 * 60 * 1000) {
      throw new Error("অর্ডার তৈরি হওয়ার ১২ ঘণ্টা পূর্ণ হলে History Archive করতে পারবেন।");
    }
    if (!confirm("১২ ঘণ্টার বেশি পুরোনো এই অর্ডার History থেকে Archive করবেন? পরে Restore করা যাবে।")) return;
    await updateDoc(doc(db, "orders", orderId), { isArchived: true, archivedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await loadAdminOrders(); await loadDashboardStats();
  } catch (error) { console.error("Archive order error:", error); alert("অর্ডার Archive করা যায়নি: " + (error.message || "")); }
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
    const [ordersSnapshot, salesLedgerSnapshot, stockSnapshot, balanceSnapshot] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "salesLedger")),
      getDoc(doc(db, "settings", "diamondStock")),
      getDoc(doc(db, "settings", "mainBalance"))
    ]);
    let salesMoney = 0;
    let salesDiamonds = 0;
    ordersSnapshot.forEach(item => {
      const data = item.data();
      if (data.status === "Completed" && data.isArchived !== true) {
        salesMoney += Number(data.price) || 0;
        const explicitQty = Number(data.diamondQuantity);
        if (Number.isSafeInteger(explicitQty) && explicitQty > 0) salesDiamonds += explicitQty;
        else {
          const match = String(data.packageName || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(?:k)?\s*(?:diamond|ডায়মন্ড|ডায়মন্ড)/i);
          if (match) salesDiamonds += Math.round(Number(match[1]) * (/k/i.test(match[0]) ? 1000 : 1));
        }
      }
    });
    salesLedgerSnapshot.forEach(item => { salesMoney += Number(item.data().amount) || 0; });
    const stock = Number(stockSnapshot.exists() ? stockSnapshot.data().quantity : 0);
    const balance = Number(balanceSnapshot.exists() ? balanceSnapshot.data().amount : 0);
    container.replaceChildren();
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "owner-stock-edit-button";
    editButton.textContent = "✏️ ডায়মন্ড এডিট করুন";
    editButton.addEventListener("click", () => {
      const form = $("diamondStockForm");
      if (!form) return;
      form.hidden = !form.hidden;
      if (!form.hidden) $("diamondStockQuantity")?.focus();
    });
    container.appendChild(editButton);
    [["বর্তমান ডায়মন্ড", stock.toLocaleString("en-BD") + " 💎", "current-diamonds"], ["সেলস ডায়মন্ড", salesDiamonds.toLocaleString("en-BD") + " 💎", "sales-diamonds"], ["Owner Balance", "৳" + balance.toLocaleString("en-BD"), "owner-balance"], ["মোট বিক্রয়", "৳" + salesMoney.toLocaleString("en-BD"), "sales-money"]].forEach(([label,value,kind]) => {
      const card = document.createElement("div");
      card.className = "order-card dashboard-stat-card owner-diamond-card " + kind;
      const title = document.createElement("strong");
      title.textContent = label;
      const number = document.createElement("p");
      number.textContent = String(value);
      card.append(title, number);
      container.appendChild(card);
    });
    const balanceInput = $("mainBalanceAmount");
    if (balanceInput && document.activeElement !== balanceInput) balanceInput.value = String(balance);
    const stockInput = $("diamondStockQuantity");
    if (stockInput && document.activeElement !== stockInput) stockInput.value = String(stock);
  } catch(error) {
    console.error("Dashboard error:", error);
    container.textContent = "ড্যাশবোর্ডের তথ্য লোড করা যায়নি।";
  }
}

const mainBalanceForm = $("mainBalanceForm");
if (mainBalanceForm) {
  mainBalanceForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;
    const amount = Number($("mainBalanceAmount")?.value);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      showMessage($("mainBalanceMessage"), "০ বা তার বেশি পূর্ণসংখ্যা টাকা লিখুন।");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "mainBalance"), {
        amount, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || ""
      }, { merge: true });
      showMessage($("mainBalanceMessage"), "Main Balance সংরক্ষণ হয়েছে।", true);
      await loadDashboardStats();
    } catch (error) {
      console.error("Main balance save error:", error);
      showMessage($("mainBalanceMessage"), "Main Balance সংরক্ষণ হয়নি: " + (error.message || "Rules পরীক্ষা করুন।"));
    }
  });
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
        (data.name || "নাম নেই") + " (" + (Number(data.diamondQuantity) || Number(String(data.name || "").match(/[0-9]+/)?.[0]) || "পরিমাণ নেই") + " Diamond) - ৳" + (data.price ?? "নেই");

      card.appendChild(details);
      card.appendChild(makeButton("Edit Name / Quantity / Price", async () => {
        const nextName = prompt("প্যাকেজের নতুন নাম লিখুন:", String(data.name || ""));
        if (nextName === null) return;
        const nextQuantity = Number(prompt("নতুন Diamond Quantity লিখুন:", String(Number(data.diamondQuantity) || Number(String(data.name || "").match(/[0-9]+/)?.[0]) || 0)));
        if (!Number.isSafeInteger(nextQuantity) || nextQuantity <= 0) return alert("সঠিক পূর্ণসংখ্যা Diamond Quantity দিন।");
        const nextPrice = Number(prompt("নতুন প্যাকেজ মূল্য লিখুন:", String(data.price ?? "")));
        if (!nextName.trim() || !Number.isFinite(nextPrice) || nextPrice <= 0) return alert("সঠিক নাম ও প্যাকেজ মূল্য দিন।");
        try {
          await updateDoc(doc(db, "packages", item.id), {
            name: nextName.trim(),
            diamondQuantity: nextQuantity,
            price: nextPrice,
            updatedAt: serverTimestamp()
          });
          await loadAdminPackages();
        } catch (error) {
          console.error("Edit package error:", error);
          alert("প্যাকেজ আপডেট করা যায়নি: " + (error.message || "অজানা সমস্যা"));
        }
      }));
      card.appendChild(makeButton(data.active === false ? "প্যাকেজ চালু করুন" : "প্যাকেজ বন্ধ করুন", async () => {
        try {
          await updateDoc(doc(db, "packages", item.id), {
            active: data.active === false,
            updatedAt: serverTimestamp()
          });
          await loadAdminPackages();
        } catch (error) {
          console.error("Package status error:", error);
          alert("প্যাকেজের অবস্থা পরিবর্তন করা যায়নি।");
        }
      }));
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


async function loadYellowDiamondPackages() {
  const container = $("yellowDiamondAdminSlots");
  if (!container || !isAdmin) return;

  try {
    const snapshot = await getDocs(collection(db, "yellowDiamondPackages"));
    const bySlot = new Map();
    snapshot.forEach(item => {
      const data = item.data();
      const slot = Number(data.slot);
      if (Number.isInteger(slot) && slot >= 1 && slot <= 5) bySlot.set(slot, data);
    });

    container.replaceChildren();
    for (let slot = 1; slot <= 5; slot++) {
      const data = bySlot.get(slot) || {};
      const card = document.createElement("div");
      card.className = "order-card";
      const heading = document.createElement("strong");
      heading.textContent = "Yellow Diamond প্যাকেজ " + slot;
      const quantityLabel = document.createElement("label");
      quantityLabel.htmlFor = "yellowPackageDiamond" + slot;
      quantityLabel.textContent = "Diamond পরিমাণ";
      const quantity = document.createElement("input");
      quantity.id = "yellowPackageDiamond" + slot;
      quantity.type = "number";
      quantity.min = "1";
      quantity.step = "1";
      quantity.placeholder = "যেমন: 1000";
      quantity.value = Number(data.diamondQuantity) > 0 ? String(data.diamondQuantity) : "";
      const priceLabel = document.createElement("label");
      priceLabel.htmlFor = "yellowPackagePrice" + slot;
      priceLabel.textContent = "মূল্য (৳)";
      const price = document.createElement("input");
      price.id = "yellowPackagePrice" + slot;
      price.type = "number";
      price.min = "1";
      price.step = "1";
      price.placeholder = "যেমন: 100";
      price.value = Number(data.price) > 0 ? String(data.price) : "";
      const activeLabel = document.createElement("label");
      const active = document.createElement("input");
      active.id = "yellowPackageActive" + slot;
      active.type = "checkbox";
      active.checked = data.active === true;
      activeLabel.append(active, document.createTextNode(" Agent App-এ চালু রাখুন"));
      card.append(heading, quantityLabel, quantity, priceLabel, price, activeLabel);
      container.appendChild(card);
    }
  } catch (error) {
    console.error("Yellow Diamond packages load:", error);
    showMessage($("yellowPackageMessage"), "Yellow Diamond প্যাকেজ লোড হয়নি। Firestore Rules পরীক্ষা করুন।");
  }
}

const yellowPackageForm = $("yellowPackageForm");
if (yellowPackageForm) {
  yellowPackageForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) return;

    const button = yellowPackageForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      for (let slot = 1; slot <= 5; slot++) {
        const quantity = Number($("yellowPackageDiamond" + slot)?.value || 0);
        const price = Number($("yellowPackagePrice" + slot)?.value || 0);
        const active = Boolean($("yellowPackageActive" + slot)?.checked);
        if (active && (!Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0)) {
          throw new Error("চালু করা প্রতিটি প্যাকেজে সঠিক Diamond পরিমাণ ও মূল্য দিন।");
        }
        await setDoc(doc(db, "yellowDiamondPackages", "yellow_package_slot_" + slot), {
          slot,
          active: active && quantity > 0 && price > 0,
          diamondQuantity: quantity,
          name: quantity > 0 ? quantity + " Yellow Diamond" : "Yellow Diamond",
          price,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || ""
        }, { merge: true });
      }
      showMessage($("yellowPackageMessage"), "Yellow Diamond প্যাকেজগুলো সংরক্ষণ হয়েছে।", true);
      await loadYellowDiamondPackages();
    } catch (error) {
      console.error("Yellow Diamond package save:", error);
      showMessage($("yellowPackageMessage"), error.message || "Yellow Diamond প্যাকেজ সংরক্ষণ হয়নি।");
    } finally {
      if (button) button.disabled = false;
    }
  });
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
