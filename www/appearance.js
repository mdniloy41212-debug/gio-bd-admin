import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const config = {
  apiKey: "AIzaSyDZ3tIrZxqYuiYP8fnoNoDcLR6W7wbEt30",
  authDomain: "gio-bd.firebaseapp.com",
  projectId: "gio-bd",
  storageBucket: "gio-bd.firebasestorage.app",
  messagingSenderId: "727420404239",
  appId: "1:727420404239:web:914e2903eb648db782d97a",
  measurementId: "G-B3J9DTP6M9"
};
const app = getApps().length ? getApps()[0] : initializeApp(config);
const db = getFirestore(app);
const safeUrl = value => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
};
const setImage = (element, url, alt) => {
  if (!element || !url) return;
  const img = document.createElement("img");
  img.src = url;
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block";
  element.replaceChildren(img);
};
function applyAppearance(data = {}) {
  const root = document.documentElement;
  const colors = {
    "--gio-bg": data.backgroundColor,
    "--gio-surface": data.surfaceColor,
    "--gio-primary": data.primaryColor,
    "--gio-accent": data.accentColor,
    "--gio-text": data.textColor,
    "--gio-diamond-text": data.diamondTextColor,
    "--gio-brand-text": data.brandTextColor
  };
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value.trim())) root.style.setProperty(key, value.trim());
    else root.style.removeProperty(key);
  }
  const background = safeUrl(data.backgroundImageUrl);
  if (background) {
    document.body.style.backgroundImage = "linear-gradient(#070b1dcc,#070b1dcc),url('" + background.replace(/'/g, "%27") + "')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
  } else {
    document.body.style.removeProperty("background-image");
    document.body.style.removeProperty("background-size");
    document.body.style.removeProperty("background-attachment");
    document.body.style.removeProperty("background-position");
  }
  const mappings = [
    [".gio-main-crystal", data.diamondIconUrl, "Diamond"],
    [".gio-section-gem", data.diamondIconUrl, "Diamond"],
    [".gio-diamond-mark", data.diamondIconUrl, "GIO BD Diamond"],
    [".gio-home-profile", data.profileIconUrl, "Profile"],
    ["#customerProfileButton", data.profileIconUrl, "Profile"],
    [".support-action.whatsapp span", data.whatsappIconUrl, "WhatsApp"],
    [".support-action.facebook span", data.facebookIconUrl, "Facebook"],
    [".support-action.gmail span", data.gmailIconUrl, "Gmail"]
  ];
  for (const [selector, rawUrl, alt] of mappings) {
    const url = safeUrl(rawUrl);
    if (!url) continue;
    document.querySelectorAll(selector).forEach(el => setImage(el, url, alt));
  }
  document.querySelectorAll(".package-card").forEach(card => {
    const url = safeUrl(data.packageDiamondIconUrl || data.diamondIconUrl);
    if (!url || card.querySelector(".gio-server-package-gem")) return;
    const image = document.createElement("img");
    image.className = "gio-server-package-gem";
    image.src = url;
    image.alt = "Diamond";
    image.loading = "lazy";
    image.style.cssText = "width:28px;height:28px;object-fit:contain;vertical-align:middle;margin-right:7px";
    const title = card.querySelector("h3,h4,strong");
    if (title) title.prepend(image);
  });
  if (typeof data.diamondTextColor === "string" && /^#[0-9a-f]{3,8}$/i.test(data.diamondTextColor)) {
    document.querySelectorAll(".gio-section-heading h2,.package-card h3,.package-card h4").forEach(el => el.style.color = data.diamondTextColor);
  }
  if (typeof data.brandTextColor === "string" && /^#[0-9a-f]{3,8}$/i.test(data.brandTextColor)) {
    document.querySelectorAll(".logo,.gio-brand-name,.gio-home-topline h1").forEach(el => el.style.color = data.brandTextColor);
  }
}
const style = document.createElement("style");
style.textContent = `
:root{--gio-bg:#100b25;--gio-surface:#102e65;--gio-primary:#135ce0;--gio-accent:#ffc928;--gio-text:#fff}
body{background-color:var(--gio-bg);color:var(--gio-text)}
.gio-hero-card,.gio-quick-card,.package-card,.gio-settings-card{border-color:var(--gio-accent)!important}
.gio-quick-card,.package-card,.gio-settings-card{background:linear-gradient(145deg,var(--gio-surface),var(--gio-bg))!important}
.gio-primary-cta,.gio-agent-update-banner button{background:var(--gio-primary)}
`;
document.head.appendChild(style);
onSnapshot(doc(db, "settings", "appAppearance"), snapshot => {
  applyAppearance(snapshot.exists() ? snapshot.data() : {});
}, error => console.warn("GIO BD server appearance settings:", error));
