import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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
const db = getFirestore(app);
const style = document.createElement("style");
style.id = "gio-server-appearance-style";
document.head.appendChild(style);

function httpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch { return ""; }
}
function validColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : "";
}
function safeCssUrl(value) {
  return value.replace(/["\\()\n\r]/g, c => "%" + c.charCodeAt(0).toString(16));
}
function setImage(selector, rawUrl, alt, className = "gio-server-image") {
  const url = httpsUrl(rawUrl);
  document.querySelectorAll(selector).forEach(element => {
    let img = element.querySelector(":scope > img." + className);
    if (!url) { if (img) img.remove(); return; }
    if (!img) {
      img = document.createElement("img");
      img.className = className;
      img.alt = alt;
      img.loading = "eager";
      img.decoding = "async";
      img.style.cssText = "width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;display:block";
      element.prepend(img);
    }
    if (img.src !== url) img.src = url;
  });
}
function setBg(selector, rawUrl, overlay = "rgba(0,0,0,0)") {
  const url = httpsUrl(rawUrl);
  document.querySelectorAll(selector).forEach(element => {
    if (!url) {
      ["background-image","background-size","background-position","background-repeat"].forEach(p => element.style.removeProperty(p));
      return;
    }
    element.style.setProperty("background-image", "linear-gradient(" + overlay + "," + overlay + "),url(\"" + safeCssUrl(url) + "\")", "important");
    element.style.setProperty("background-size", "cover", "important");
    element.style.setProperty("background-position", "center", "important");
    element.style.setProperty("background-repeat", "no-repeat", "important");
  });
}
function applyAppearance(data = {}) {
  const root = document.documentElement;
  const colors = {
    "--gio-bg": validColor(data.backgroundColor),
    "--gio-surface": validColor(data.surfaceColor),
    "--gio-primary": validColor(data.primaryColor),
    "--gio-accent": validColor(data.accentColor),
    "--gio-text": validColor(data.textColor),
    "--gio-diamond-text": validColor(data.diamondTextColor),
    "--gio-brand-text": validColor(data.brandTextColor)
  };
  Object.entries(colors).forEach(([key,value]) => value ? root.style.setProperty(key,value) : root.style.removeProperty(key));

  const backgroundUrl = httpsUrl(data.backgroundImageUrl);
  const overlay = typeof data.backgroundOverlay === "string" && /^rgba?\([\d\s.,%]+\)$/.test(data.backgroundOverlay)
    ? data.backgroundOverlay : "rgba(5,10,28,.62)";
  if (backgroundUrl) {
    setBg("body", backgroundUrl, overlay);
    document.body.style.setProperty("background-attachment","fixed","important");
  } else {
    setBg("body", "", "");
    document.body.style.removeProperty("background-attachment");
  }

  setBg(".gio-hero-card", data.heroImageUrl, "rgba(4,12,35,.24)");
  setBg(".gio-crystal-stage", data.heroArtworkUrl, "rgba(4,12,35,.08)");
  setBg(".gio-login-brand", data.loginBackgroundUrl, "rgba(4,12,35,.18)");
  setBg(".package-card", data.packageCardBackgroundUrl, "rgba(4,12,35,.12)");

  const icons = [
    [".gio-main-crystal,.gio-section-gem,.gio-diamond-mark,.gio-phone-gem",data.diamondIconUrl,"Diamond"],
    [".gio-home-profile,#customerProfileButton,.admin-profile-avatar",data.profileIconUrl,"Profile"],
    [".support-action.whatsapp span",data.whatsappIconUrl,"WhatsApp"],
    [".support-action.facebook span",data.facebookIconUrl,"Facebook"],
    [".support-action.gmail span",data.gmailIconUrl,"Gmail"],
    [".gio-quick-card:nth-child(1) .gio-quick-icon",data.diamondIconUrl,"Diamond"],
    [".gio-quick-card:nth-child(2) .gio-quick-icon",data.trackIconUrl,"Track order"],
    [".gio-quick-card:nth-child(3) .gio-quick-icon",data.inboxIconUrl,"Inbox"]
  ];
  icons.forEach(([selector,url,alt]) => setImage(selector,url,alt));

  const logo = httpsUrl(data.logoIconUrl);
  document.querySelectorAll(".logo,.gio-brand-name").forEach(element => {
    let img = element.querySelector(":scope > img.gio-server-logo");
    if (!logo) { if(img) img.remove(); return; }
    if (!img) {
      img=document.createElement("img");
      img.className="gio-server-logo";
      img.alt="GIO BD logo";
      img.style.cssText="width:30px;height:30px;object-fit:contain;vertical-align:middle;margin-right:8px";
      element.prepend(img);
    }
    if(img.src!==logo) img.src=logo;
  });

  const packageIcon = httpsUrl(data.packageDiamondIconUrl || data.diamondIconUrl);
  document.querySelectorAll(".package-card").forEach(card => {
    const title=card.querySelector("h3,h4,strong");
    if(title) setImageToNode(title,packageIcon,"Diamond","gio-server-package-icon");
  });

  const css = [];
  if(colors["--gio-accent"]) css.push(".gio-hero-card,.gio-quick-card,.package-card,.gio-settings-card,.gio-admin-bottom-nav{border-color:"+colors["--gio-accent"]+"!important}");
  if(colors["--gio-primary"]) css.push(".gio-primary-cta,.gio-agent-update-banner button{background-color:"+colors["--gio-primary"]+"!important}");
  if(colors["--gio-surface"]) css.push(".gio-quick-card,.package-card,.gio-settings-card{background-color:"+colors["--gio-surface"]+"!important}");
  if(colors["--gio-text"]) css.push("body{color:"+colors["--gio-text"]+"!important}");
  if(colors["--gio-diamond-text"]) css.push(".gio-section-heading h2,.package-card h3,.package-card h4{color:"+colors["--gio-diamond-text"]+"!important}");
  if(colors["--gio-brand-text"]) css.push(".logo,.gio-brand-name,.gio-home-topline h1{color:"+colors["--gio-brand-text"]+"!important}");
  style.textContent = css.join("\n");
}
function setImageToNode(node,url,alt,className) {
  let img=node.querySelector(":scope > img."+className);
  if(!url){if(img)img.remove();return;}
  if(!img){img=document.createElement("img");img.className=className;img.alt=alt;img.style.cssText="width:28px;height:28px;object-fit:contain;vertical-align:middle;margin-right:7px";node.prepend(img);}
  if(img.src!==url)img.src=url;
}

onSnapshot(doc(db,"settings","appAppearance"),snapshot => {
  applyAppearance(snapshot.exists()?snapshot.data():{});
},error => console.warn("GIO BD live appearance settings failed; check Firestore read rules.",error));
