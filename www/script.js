import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
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

const $ = id => document.getElementById(id);

let isAdmin = false;
let packages = [];

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

function message(id, text, type = "") {
  const el = $(id);
  if (!el) return;

  el.textContent = text;
  el.className = "form-message " + type;
}

function openPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === id);
  });
}

$("year").textContent = new Date().getFullYear();

// Navigation
document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    if (page === "adminPage" && !isAdmin) {
      alert("শুধু Admin এই পেজ খুলতে পারবেন।");
      return;
    }

    openPage(page);
  });
});

// Keep login active after closing and reopening the app
await setPersistence(auth, browserLocalPersistence);

// Check Admin account
async function checkAdmin(user) {
  if (!user) return false;

  try {
    const adminDoc = await getDoc(
      doc(db, "users", "admin")
    );

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

// Login state
onAuthStateChanged(auth, async user => {
  isAdmin = await checkAdmin(user);

  $("adminNav").hidden = !isAdmin;
  $("logoutBtn").hidden = !user;
  $("loginNav").hidden = isAdmin;
  $("customerLoginNav").hidden = !!user;

  $("authStatus").textContent = user
    ? "লগইন: " + (user.email || "Customer")
    : "আপনি লগইন করেননি";

  if (isAdmin) {
    openPage("adminPage");
    loadAdminOrders();
    loadAdminPackages();
  } else if (
    user &&
    $("customerAuthPage").classList.contains("active")
  ) {
    openPage("homePage");
  }
});

// Handle Google redirect result
try {
  await getRedirectResult(auth);
} catch (error) {
  console.error("Google login:", error);
  message(
    "customerAuthMessage",
    "Google Login হয়নি: " + error.message,
    "error"
  );
}

// Google Login
$("googleLoginBtn").addEventListener("click", async () => {
  const button = $("googleLoginBtn");
  button.disabled = true;

  message(
    "customerAuthMessage",
    "Google Account নির্বাচন করুন..."
  );

  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error(error);

    message(
      "customerAuthMessage",
      "Google Login সমস্যা: " + error.message,
      "error"
    );

    button.disabled = false;
  }
});

// Customer Email Login
$("customerAuthForm").addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("customerLoginBtn");
  button.disabled = true;

  const email = $("customerEmail").value.trim();
  const password = $("customerPassword").value;

  message(
    "customerAuthMessage",
    "লগইন হচ্ছে..."
  );

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    message(
      "customerAuthMessage",
      "লগইন সফল হয়েছে!",
      "success"
    );

    openPage("homePage");

  } catch (error) {
    console.error(error);

    message(
      "customerAuthMessage",
      "লগইন হয়নি: " + error.message,
      "error"
    );
  } finally {
    button.disabled = false;
  }
});

// Customer Registration
$("customerRegisterBtn").addEventListener("click", async () => {
  const button = $("customerRegisterBtn");
  button.disabled = true;

  const email = $("customerEmail").value.trim();
  const password = $("customerPassword").value;

  if (!email || password.length < 6) {
    message(
      "customerAuthMessage",
      "সঠিক Email দিন এবং কমপক্ষে ৬ অক্ষরের Password লিখুন।",
      "error"
    );

    button.disabled = false;
    return;
  }

  message(
    "customerAuthMessage",
    "নতুন অ্যাকাউন্ট তৈরি হচ্ছে..."
  );

  try {
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    message(
      "customerAuthMessage",
      "অ্যাকাউন্ট তৈরি হয়েছে এবং লগইন সফল!",
      "success"
    );

    openPage("homePage");

  } catch (error) {
    console.error(error);

    message(
      "customerAuthMessage",
      "অ্যাকাউন্ট তৈরি হয়নি: " + error.message,
      "error"
    );
  } finally {
    button.disabled = false;
  }
});

// Forgot Password
$("resetPasswordBtn").addEventListener("click", async () => {
  const email = $("customerEmail").value.trim();

  if (!email) {
    message(
      "customerAuthMessage",
      "প্রথমে আপনার Email লিখুন।",
      "error"
    );
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);

    message(
      "customerAuthMessage",
      "Password Reset Link আপনার Email-এ পাঠানো হয়েছে।",
      "success"
    );

  } catch (error) {
    console.error(error);

    message(
      "customerAuthMessage",
      "Reset Link পাঠানো যায়নি: " + error.message,
      "error"
    );
  }
});

// Load customer packages
async function loadPackages() {
  try {
    const snapshot = await getDocs(
      collection(db, "packages")
    );

    packages = snapshot.docs
      .map(item => ({
        id: item.id,
        ...item.data()
      }))
      .filter(item => item.active !== false);

    $("packageList").innerHTML = "";

    $("packageSelect").innerHTML =
      '<option value="">প্যাকেজ নির্বাচন করুন</option>';

    if (packages.length === 0) {
      $("packageList").textContent =
        "এখনো কোনো প্যাকেজ যোগ করা হয়নি।";
      return;
    }

    packages.forEach(item => {
      const card = document.createElement("div");
      card.className = "package-card";

      const title = document.createElement("h3");
      title.textContent = item.name;

      const price = document.createElement("p");
      price.textContent = "৳ " + Number(item.price);

      const button = document.createElement("button");
      button.textContent = "অর্ডার করুন";

      button.addEventListener("click", () => {
        $("packageSelect").value = item.id;
        openPage("orderPage");
      });

      card.append(title, price, button);
      $("packageList").appendChild(card);

      const option = document.createElement("option");
      option.value = item.id;
      option.textContent =
        item.name + " - ৳" + item.price;

      $("packageSelect").appendChild(option);
    });

  } catch (error) {
    console.error(error);

    $("packageList").textContent =
      "প্যাকেজ লোড হয়নি। Firebase Rules পরীক্ষা করুন।";
  }
}

// Place Order
$("orderForm").addEventListener("submit", async event => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    message(
      "orderMessage",
      "অর্ডার দিতে আগে Customer Login করুন।",
      "error"
    );

    openPage("customerAuthPage");
    return;
  }

  const button = event.target.querySelector(
    'button[type="submit"]'
  );

  button.disabled = true;

  message(
    "orderMessage",
    "অর্ডার জমা হচ্ছে..."
  );

  try {
    const packageId = $("packageSelect").value;

    const selected = packages.find(
      p => p.id === packageId
    );

    if (!selected) {
      throw new Error("সঠিক প্যাকেজ নির্বাচন করুন।");
    }

    const order = {
      userId: user.uid,
      customerEmail: user.email || "",
      customerName: $("customerName").value.trim(),
      customerPhone: $("customerPhone").value.trim(),
      imoId: $("imoId").value.trim(),
      packageId: selected.id,
      packageName: selected.name,
      price: Number(selected.price),
      paymentMethod: $("paymentMethod").value,
      transactionId: $("transactionId").value.trim(),
      status: "Pending",
      createdAt: serverTimestamp()
    };

    const result = await addDoc(
      collection(db, "orders"),
      order
    );

    $("trackOrderId").value = result.id;

    message(
      "orderMessage",
      "অর্ডার সফল হয়েছে! আপনার Order ID: " + result.id,
      "success"
    );

    event.target.reset();

  } catch (error) {
    console.error(error);

    message(
      "orderMessage",
      "অর্ডার জমা হয়নি: " + error.message,
      "error"
    );
  } finally {
    button.disabled = false;
  }
});

// Track own order
$("trackForm").addEventListener("submit", async event => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    message(
      "trackResult",
      "অর্ডার ট্র্যাক করতে আগে Login করুন।",
      "error"
    );

    openPage("customerAuthPage");
    return;
  }

  const orderId = $("trackOrderId").value.trim();
  const resultBox = $("trackResult");

  resultBox.textContent = "অর্ডার খোঁজা হচ্ছে...";

  try {
    const orderDoc = await getDoc(
      doc(db, "orders", orderId)
    );

    if (!orderDoc.exists()) {
      resultBox.textContent =
        "এই Order ID পাওয়া যায়নি অথবা দেখার অনুমতি নেই।";
      return;
    }

    const data = orderDoc.data();

    if (!isAdmin && data.userId !== user.uid) {
      resultBox.textContent =
        "এই অর্ডারটি আপনার অ্যাকাউন্টের নয়।";
      return;
    }

    resultBox.textContent =
      "প্যাকেজ: " + data.packageName +
      " | মূল্য: ৳" + data.price +
      " | স্ট্যাটাস: " + data.status;

  } catch (error) {
    console.error(error);

    resultBox.textContent =
      "অর্ডার খুঁজতে সমস্যা হয়েছে। Order ID ও Login পরীক্ষা করুন।";
  }
});

// Admin Login
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const button = event.target.querySelector(
    'button[type="submit"]'
  );

  button.disabled = true;

  message(
    "loginMessage",
    "Admin Login হচ্ছে..."
  );

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      $("adminEmail").value.trim(),
      $("adminPassword").value
    );

    const allowed = await checkAdmin(
      credential.user
    );

    if (!allowed) {
      await signOut(auth);

      throw new Error(
        "এই অ্যাকাউন্টটি Admin নয়।"
      );
    }

    isAdmin = true;

    message(
      "loginMessage",
      "Admin Login সফল হয়েছে।",
      "success"
    );

    openPage("adminPage");
    loadAdminOrders();
    loadAdminPackages();

  } catch (error) {
    console.error(error);

    message(
      "loginMessage",
      error.message === "Firebase: Error (auth/invalid-credential)."
        ? "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।"
        : "Admin Login হয়নি: " + error.message,
      "error"
    );
  } finally {
    button.disabled = false;
  }
});

// Logout
$("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);

    isAdmin = false;
    openPage("homePage");

  } catch (error) {
    console.error(error);
    alert("Logout করা যায়নি।");
  }
});

// Load Admin Orders
async function loadAdminOrders() {
  if (!isAdmin) return;

  const box = $("adminOrders");
  box.textContent = "অর্ডার লোড হচ্ছে...";

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      )
    );

    box.innerHTML = "";

    if (snapshot.empty) {
      box.textContent = "এখনো কোনো অর্ডার নেই।";
      return;
    }

    snapshot.forEach(item => {
      const data = item.data();

      const card = document.createElement("div");
      card.className = "order-card";

      const details = document.createElement("p");

      details.textContent =
        "Order ID: " + item.id +
        " | Email: " + (data.customerEmail || "") +
        " | নাম: " + data.customerName +
        " | ফোন: " + data.customerPhone +
        " | IMO ID: " + data.imoId +
        " | প্যাকেজ: " + data.packageName +
        " | মূল্য: ৳" + data.price +
        " | Payment: " + data.paymentMethod +
        " | TrxID: " + data.transactionId +
        " | Status: " + data.status;

      const approve = document.createElement("button");
      approve.textContent = "Approve";

      approve.addEventListener("click", () => {
        updateOrderStatus(item.id, "Approved");
      });

      const reject = document.createElement("button");
      reject.textContent = "Reject";

      reject.addEventListener("click", () => {
        updateOrderStatus(item.id, "Rejected");
      });

      card.append(details, approve, reject);
      box.appendChild(card);
    });

  } catch (error) {
    console.error(error);

    box.textContent =
      "অর্ডার লোড হয়নি। Admin Login ও Firestore Rules পরীক্ষা করুন।";
  }
}

// Update Order Status
async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;

  try {
    await updateDoc(
      doc(db, "orders", orderId),
      { status }
    );

    await loadAdminOrders();

  } catch (error) {
    console.error(error);
    alert("অর্ডারের স্ট্যাটাস পরিবর্তন হয়নি।");
  }
}

// Add Package
$("packageForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin) return;

  const button = event.target.querySelector(
    'button[type="submit"]'
  );

  button.disabled = true;

  try {
    const name = $("newPackageName").value.trim();
    const price = Number($("newPackagePrice").value);

    if (!name || !Number.isFinite(price) || price <= 0) {
      throw new Error(
        "প্যাকেজের নাম ও সঠিক মূল্য দিন।"
      );
    }

    await addDoc(
      collection(db, "packages"),
      {
        name,
        price,
        active: true,
        createdAt: serverTimestamp()
      }
    );

    event.target.reset();

    message(
      "packageMessage",
      "নতুন প্যাকেজ যোগ হয়েছে।",
      "success"
    );

    await loadPackages();
    await loadAdminPackages();

  } catch (error) {
    console.error(error);

    message(
      "packageMessage",
      "প্যাকেজ যোগ হয়নি: " + error.message,
      "error"
    );
  } finally {
    button.disabled = false;
  }
});

// Load Admin Packages
async function loadAdminPackages() {
  if (!isAdmin) return;

  const box = $("adminPackages");
  box.innerHTML = "";

  try {
    const snapshot = await getDocs(
      collection(db, "packages")
    );

    snapshot.forEach(item => {
      const data = item.data();

      const card = document.createElement("div");
      card.className = "order-card";

      const details = document.createElement("p");
      details.textContent =
        data.name + " - ৳" + data.price;

      const remove = document.createElement("button");
      remove.textContent = "Delete";

      remove.addEventListener("click", async () => {
        if (!confirm("এই প্যাকেজ মুছে ফেলবেন?")) return;

        try {
          await deleteDoc(
            doc(db, "packages", item.id)
          );

          await loadPackages();
          await loadAdminPackages();

        } catch (error) {
          console.error(error);
          alert("প্যাকেজ মুছতে সমস্যা হয়েছে।");
        }
      });

      card.append(details, remove);
      box.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    box.textContent = "প্যাকেজ লোড করা যায়নি।";
  }
}

// Start App
openPage("homePage");
loadPackages();