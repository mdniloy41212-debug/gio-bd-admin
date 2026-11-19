var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name3 in all)
    __defProp(target, name3, { get: all[name3], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins = cap.Plugins = cap.Plugins || {};
      const getPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const isNativePlatform = () => getPlatform() !== "web";
      const isPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const getPluginHeader = (pluginName) => {
        var _a;
        return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
      };
      const handleError = (err) => win.console.error(err);
      const registeredPlugins = /* @__PURE__ */ new Map();
      const registerPlugin2 = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a, _b;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
            }
          } else if (impl) {
            return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p = new Promise((resolve) => call.then(() => resolve({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
        });
        return proxy;
      };
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    WebPlugin = class {
      constructor() {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        if (index !== -1) {
          this.listeners[eventName].splice(index, 1);
        }
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
    (function(SystemBarsStyle2) {
      SystemBarsStyle2["Dark"] = "DARK";
      SystemBarsStyle2["Light"] = "LIGHT";
      SystemBarsStyle2["Default"] = "DEFAULT";
    })(SystemBarsStyle || (SystemBarsStyle = {}));
    (function(SystemBarType2) {
      SystemBarType2["StatusBar"] = "StatusBar";
      SystemBarType2["NavigationBar"] = "NavigationBar";
    })(SystemBarType || (SystemBarType = {}));
    SystemBarsPluginWeb = class extends WebPlugin {
      async setStyle() {
        this.unavailable("not available for web");
      }
      async setAnimation() {
        this.unavailable("not available for web");
      }
      async show() {
        this.unavailable("not available for web");
      }
      async hide() {
        this.unavailable("not available for web");
      }
    };
    SystemBars = registerPlugin("SystemBars", {
      web: () => new SystemBarsPluginWeb()
    });
  }
});

// node_modules/@capacitor-firebase/authentication/dist/esm/definitions.js
var Persistence, ProviderId;
var init_definitions = __esm({
  "node_modules/@capacitor-firebase/authentication/dist/esm/definitions.js"() {
    (function(Persistence2) {
      Persistence2["IndexedDbLocal"] = "INDEXED_DB_LOCAL";
      Persistence2["InMemory"] = "IN_MEMORY";
      Persistence2["BrowserLocal"] = "BROWSER_LOCAL";
      Persistence2["BrowserSession"] = "BROWSER_SESSION";
    })(Persistence || (Persistence = {}));
    (function(ProviderId3) {
      ProviderId3["APPLE"] = "apple.com";
      ProviderId3["FACEBOOK"] = "facebook.com";
      ProviderId3["GAME_CENTER"] = "gc.apple.com";
      ProviderId3["GITHUB"] = "github.com";
      ProviderId3["GOOGLE"] = "google.com";
      ProviderId3["MICROSOFT"] = "microsoft.com";
      ProviderId3["PLAY_GAMES"] = "playgames.google.com";
      ProviderId3["TWITTER"] = "twitter.com";
      ProviderId3["YAHOO"] = "yahoo.com";
      ProviderId3["PASSWORD"] = "password";
      ProviderId3["PHONE"] = "phone";
    })(ProviderId || (ProviderId = {}));
  }
});

// node_modules/@firebase/util/dist/postinstall.mjs
var getDefaultsFromPostinstall;
var init_postinstall = __esm({
  "node_modules/@firebase/util/dist/postinstall.mjs"() {
    getDefaultsFromPostinstall = () => void 0;
  }
});

// node_modules/@firebase/util/dist/index.esm.js
function getGlobal() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
}
function getUA() {
  if (typeof navigator !== "undefined" && typeof navigator["userAgent"] === "string") {
    return navigator["userAgent"];
  } else {
    return "";
  }
}
function isMobileCordova() {
  return typeof window !== "undefined" && // @ts-ignore Setting up an broadly applicable index signature for Window
  // just to deal with this case would probably be a bad idea.
  !!(window["cordova"] || window["phonegap"] || window["PhoneGap"]) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA());
}
function isCloudflareWorker() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}
function isBrowserExtension() {
  const runtime = typeof chrome === "object" ? chrome.runtime : typeof browser === "object" ? browser.runtime : void 0;
  return typeof runtime === "object" && runtime.id !== void 0;
}
function isReactNative() {
  return typeof navigator === "object" && navigator["product"] === "ReactNative";
}
function isIE() {
  const ua = getUA();
  return ua.indexOf("MSIE ") >= 0 || ua.indexOf("Trident/") >= 0;
}
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
}
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        reject(request.error?.message || "");
      };
    } catch (error) {
      reject(error);
    }
  });
}
function replaceTemplate(template, data) {
  try {
    let ptr = 0;
    let result = "";
    while (ptr < template.length) {
      const start = template.indexOf("{$", ptr);
      if (start === -1) {
        result += template.substring(ptr);
        break;
      }
      const end = template.indexOf("}", start + 2);
      if (end === -1) {
        result += template.substring(ptr);
        break;
      }
      const key = template.substring(start + 2, end);
      const value = data[key];
      result += template.substring(ptr, start) + (value != null ? String(value) : `<${key}?>`);
      ptr = end + 1;
    }
    return result;
  } catch (e) {
    return template;
  }
}
function isEmpty(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    const aProp = a[k];
    const bProp = b[k];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k of bKeys) {
    if (!aKeys.includes(k)) {
      return false;
    }
  }
  return true;
}
function isObject(thing) {
  return thing !== null && typeof thing === "object";
}
function querystring(querystringParams) {
  const params = [];
  for (const [key, value] of Object.entries(querystringParams)) {
    if (Array.isArray(value)) {
      value.forEach((arrayVal) => {
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(arrayVal));
      });
    } else {
      params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  }
  return params.length ? "&" + params.join("&") : "";
}
function querystringDecode(querystring2) {
  const obj = {};
  const tokens = querystring2.replace(/^\?/, "").split("&");
  tokens.forEach((token) => {
    if (token) {
      const [key, value] = token.split("=");
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return obj;
}
function extractQuerystring(url) {
  const queryStart = url.indexOf("?");
  if (!queryStart) {
    return "";
  }
  const fragmentStart = url.indexOf("#", queryStart);
  return url.substring(queryStart, fragmentStart > 0 ? fragmentStart : void 0);
}
function createSubscribe(executor, onNoObservers) {
  const proxy = new ObserverProxy(executor, onNoObservers);
  return proxy.subscribe.bind(proxy);
}
function implementsAnyMethods(obj, methods) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  for (const method of methods) {
    if (method in obj && typeof obj[method] === "function") {
      return true;
    }
  }
  return false;
}
function noop() {
}
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}
function isCloudWorkstation(url) {
  try {
    const host = url.startsWith("http://") || url.startsWith("https://") ? new URL(url).hostname : url;
    return host.endsWith(".cloudworkstations.dev");
  } catch {
    return false;
  }
}
async function pingServer(endpoint) {
  const result = await fetch(endpoint, {
    credentials: "include"
  });
  return result.ok;
}
var stringToByteArray$1, byteArrayToString, base64, DecodeBase64StringError, base64Encode, base64urlEncodeWithoutPadding, base64Decode, getDefaultsFromGlobal, getDefaultsFromEnvVariable, getDefaultsFromCookie, getDefaults, getDefaultEmulatorHost, getDefaultAppConfig, getExperimentalSetting, Deferred, ERROR_NAME, FirebaseError, ErrorFactory, ObserverProxy, MAX_VALUE_MILLIS;
var init_index_esm = __esm({
  "node_modules/@firebase/util/dist/index.esm.js"() {
    init_postinstall();
    stringToByteArray$1 = function(str) {
      const out = [];
      let p = 0;
      for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128) {
          out[p++] = c;
        } else if (c < 2048) {
          out[p++] = c >> 6 | 192;
          out[p++] = c & 63 | 128;
        } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
          c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
          out[p++] = c >> 18 | 240;
          out[p++] = c >> 12 & 63 | 128;
          out[p++] = c >> 6 & 63 | 128;
          out[p++] = c & 63 | 128;
        } else {
          out[p++] = c >> 12 | 224;
          out[p++] = c >> 6 & 63 | 128;
          out[p++] = c & 63 | 128;
        }
      }
      return out;
    };
    byteArrayToString = function(bytes) {
      const out = [];
      let pos = 0, c = 0;
      while (pos < bytes.length) {
        const c1 = bytes[pos++];
        if (c1 < 128) {
          out[c++] = String.fromCharCode(c1);
        } else if (c1 > 191 && c1 < 224) {
          const c2 = bytes[pos++];
          out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
        } else if (c1 > 239 && c1 < 365) {
          const c2 = bytes[pos++];
          const c3 = bytes[pos++];
          const c4 = bytes[pos++];
          const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
          out[c++] = String.fromCharCode(55296 + (u >> 10));
          out[c++] = String.fromCharCode(56320 + (u & 1023));
        } else {
          const c2 = bytes[pos++];
          const c3 = bytes[pos++];
          out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
        }
      }
      return out.join("");
    };
    base64 = {
      /**
       * Maps bytes to characters.
       */
      byteToCharMap_: null,
      /**
       * Maps characters to bytes.
       */
      charToByteMap_: null,
      /**
       * Maps bytes to websafe characters.
       * @private
       */
      byteToCharMapWebSafe_: null,
      /**
       * Maps websafe characters to bytes.
       * @private
       */
      charToByteMapWebSafe_: null,
      /**
       * Our default alphabet, shared between
       * ENCODED_VALS and ENCODED_VALS_WEBSAFE
       */
      ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      /**
       * Our default alphabet. Value 64 (=) is special; it means "nothing."
       */
      get ENCODED_VALS() {
        return this.ENCODED_VALS_BASE + "+/=";
      },
      /**
       * Our websafe alphabet.
       */
      get ENCODED_VALS_WEBSAFE() {
        return this.ENCODED_VALS_BASE + "-_.";
      },
      /**
       * Whether this browser supports the atob and btoa functions. This extension
       * started at Mozilla but is now implemented by many browsers. We use the
       * ASSUME_* variables to avoid pulling in the full useragent detection library
       * but still allowing the standard per-browser compilations.
       *
       */
      HAS_NATIVE_SUPPORT: typeof atob === "function",
      /**
       * Base64-encode an array of bytes.
       *
       * @param input An array of bytes (numbers with
       *     value in [0, 255]) to encode.
       * @param webSafe Boolean indicating we should use the
       *     alternative alphabet.
       * @return The base64 encoded string.
       */
      encodeByteArray(input, webSafe) {
        if (!Array.isArray(input)) {
          throw Error("encodeByteArray takes an array as a parameter");
        }
        this.init_();
        const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
        const output = [];
        for (let i = 0; i < input.length; i += 3) {
          const byte1 = input[i];
          const haveByte2 = i + 1 < input.length;
          const byte2 = haveByte2 ? input[i + 1] : 0;
          const haveByte3 = i + 2 < input.length;
          const byte3 = haveByte3 ? input[i + 2] : 0;
          const outByte1 = byte1 >> 2;
          const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
          let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
          let outByte4 = byte3 & 63;
          if (!haveByte3) {
            outByte4 = 64;
            if (!haveByte2) {
              outByte3 = 64;
            }
          }
          output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
        }
        return output.join("");
      },
      /**
       * Base64-encode a string.
       *
       * @param input A string to encode.
       * @param webSafe If true, we should use the
       *     alternative alphabet.
       * @return The base64 encoded string.
       */
      encodeString(input, webSafe) {
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
          return btoa(input);
        }
        return this.encodeByteArray(stringToByteArray$1(input), webSafe);
      },
      /**
       * Base64-decode a string.
       *
       * @param input to decode.
       * @param webSafe True if we should use the
       *     alternative alphabet.
       * @return string representing the decoded value.
       */
      decodeString(input, webSafe) {
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
          return atob(input);
        }
        return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
      },
      /**
       * Base64-decode a string.
       *
       * In base-64 decoding, groups of four characters are converted into three
       * bytes.  If the encoder did not apply padding, the input length may not
       * be a multiple of 4.
       *
       * In this case, the last group will have fewer than 4 characters, and
       * padding will be inferred.  If the group has one or two characters, it decodes
       * to one byte.  If the group has three characters, it decodes to two bytes.
       *
       * @param input Input to decode.
       * @param webSafe True if we should use the web-safe alphabet.
       * @return bytes representing the decoded value.
       */
      decodeStringToByteArray(input, webSafe) {
        this.init_();
        const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
        const output = [];
        for (let i = 0; i < input.length; ) {
          const byte1 = charToByteMap[input.charAt(i++)];
          const haveByte2 = i < input.length;
          const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
          ++i;
          const haveByte3 = i < input.length;
          const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
          ++i;
          const haveByte4 = i < input.length;
          const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
          ++i;
          if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
            throw new DecodeBase64StringError();
          }
          const outByte1 = byte1 << 2 | byte2 >> 4;
          output.push(outByte1);
          if (byte3 !== 64) {
            const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
            output.push(outByte2);
            if (byte4 !== 64) {
              const outByte3 = byte3 << 6 & 192 | byte4;
              output.push(outByte3);
            }
          }
        }
        return output;
      },
      /**
       * Lazy static initialization function. Called before
       * accessing any of the static map variables.
       * @private
       */
      init_() {
        if (!this.byteToCharMap_) {
          this.byteToCharMap_ = {};
          this.charToByteMap_ = {};
          this.byteToCharMapWebSafe_ = {};
          this.charToByteMapWebSafe_ = {};
          for (let i = 0; i < this.ENCODED_VALS.length; i++) {
            this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
            this.charToByteMap_[this.byteToCharMap_[i]] = i;
            this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
            this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
            if (i >= this.ENCODED_VALS_BASE.length) {
              this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
              this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
            }
          }
        }
      }
    };
    DecodeBase64StringError = class extends Error {
      constructor() {
        super(...arguments);
        this.name = "DecodeBase64StringError";
      }
    };
    base64Encode = function(str) {
      const utf8Bytes = stringToByteArray$1(str);
      return base64.encodeByteArray(utf8Bytes, true);
    };
    base64urlEncodeWithoutPadding = function(str) {
      return base64Encode(str).replace(/\./g, "");
    };
    base64Decode = function(str) {
      try {
        return base64.decodeString(str, true);
      } catch (e) {
        console.error("base64Decode failed: ", e);
      }
      return null;
    };
    getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
    getDefaultsFromEnvVariable = () => {
      if (typeof process === "undefined" || typeof process.env === "undefined") {
        return;
      }
      const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
      if (defaultsJsonString) {
        return JSON.parse(defaultsJsonString);
      }
    };
    getDefaultsFromCookie = () => {
      if (typeof document === "undefined") {
        return;
      }
      let match;
      try {
        match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
      } catch (e) {
        return;
      }
      const decoded = match && base64Decode(match[1]);
      return decoded && JSON.parse(decoded);
    };
    getDefaults = () => {
      try {
        return getDefaultsFromPostinstall() || getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
      } catch (e) {
        console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
        return;
      }
    };
    getDefaultEmulatorHost = (productName) => getDefaults()?.emulatorHosts?.[productName];
    getDefaultAppConfig = () => getDefaults()?.config;
    getExperimentalSetting = (name3) => getDefaults()?.[`_${name3}`];
    Deferred = class {
      constructor() {
        this.reject = () => {
        };
        this.resolve = () => {
        };
        this.promise = new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      }
      /**
       * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
       * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
       * and returns a node-style callback which will resolve or reject the Deferred's promise.
       */
      wrapCallback(callback) {
        return (error, value) => {
          if (error) {
            this.reject(error);
          } else {
            this.resolve(value);
          }
          if (typeof callback === "function") {
            this.promise.catch(() => {
            });
            if (callback.length === 1) {
              callback(error);
            } else {
              callback(error, value);
            }
          }
        };
      }
    };
    ERROR_NAME = "FirebaseError";
    FirebaseError = class _FirebaseError extends Error {
      constructor(code, message, customData) {
        super(message);
        this.code = code;
        this.customData = customData;
        this.name = ERROR_NAME;
        Object.setPrototypeOf(this, _FirebaseError.prototype);
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, ErrorFactory.prototype.create);
        }
      }
    };
    ErrorFactory = class {
      constructor(service, serviceName, errors) {
        this.service = service;
        this.serviceName = serviceName;
        this.errors = errors;
      }
      create(code, ...data) {
        const customData = data[0] || {};
        const fullCode = `${this.service}/${code}`;
        const template = this.errors[code];
        const message = template ? replaceTemplate(template, customData) : "Error";
        const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
        const error = new FirebaseError(fullCode, fullMessage, customData);
        return error;
      }
    };
    ObserverProxy = class {
      /**
       * @param executor Function which can make calls to a single Observer
       *     as a proxy.
       * @param onNoObservers Callback when count of Observers goes to zero.
       */
      constructor(executor, onNoObservers) {
        this.observers = [];
        this.unsubscribes = [];
        this.observerCount = 0;
        this.task = Promise.resolve();
        this.finalized = false;
        this.onNoObservers = onNoObservers;
        this.task.then(() => {
          executor(this);
        }).catch((e) => {
          this.error(e);
        });
      }
      next(value) {
        this.forEachObserver((observer) => {
          observer.next(value);
        });
      }
      error(error) {
        this.forEachObserver((observer) => {
          observer.error(error);
        });
        this.close(error);
      }
      complete() {
        this.forEachObserver((observer) => {
          observer.complete();
        });
        this.close();
      }
      /**
       * Subscribe function that can be used to add an Observer to the fan-out list.
       *
       * - We require that no event is sent to a subscriber synchronously to their
       *   call to subscribe().
       */
      subscribe(nextOrObserver, error, complete) {
        let observer;
        if (nextOrObserver === void 0 && error === void 0 && complete === void 0) {
          throw new Error("Missing Observer.");
        }
        if (implementsAnyMethods(nextOrObserver, [
          "next",
          "error",
          "complete"
        ])) {
          observer = nextOrObserver;
        } else {
          observer = {
            next: nextOrObserver,
            error,
            complete
          };
        }
        if (observer.next === void 0) {
          observer.next = noop;
        }
        if (observer.error === void 0) {
          observer.error = noop;
        }
        if (observer.complete === void 0) {
          observer.complete = noop;
        }
        const unsub = this.unsubscribeOne.bind(this, this.observers.length);
        if (this.finalized) {
          this.task.then(() => {
            try {
              if (this.finalError) {
                observer.error(this.finalError);
              } else {
                observer.complete();
              }
            } catch (e) {
            }
            return;
          });
        }
        this.observers.push(observer);
        return unsub;
      }
      // Unsubscribe is synchronous - we guarantee that no events are sent to
      // any unsubscribed Observer.
      unsubscribeOne(i) {
        if (this.observers === void 0 || this.observers[i] === void 0) {
          return;
        }
        delete this.observers[i];
        this.observerCount -= 1;
        if (this.observerCount === 0 && this.onNoObservers !== void 0) {
          this.onNoObservers(this);
        }
      }
      forEachObserver(fn) {
        if (this.finalized) {
          return;
        }
        for (let i = 0; i < this.observers.length; i++) {
          this.sendOne(i, fn);
        }
      }
      // Call the Observer via one of it's callback function. We are careful to
      // confirm that the observe has not been unsubscribed since this asynchronous
      // function had been queued.
      sendOne(i, fn) {
        this.task.then(() => {
          if (this.observers !== void 0 && this.observers[i] !== void 0) {
            try {
              fn(this.observers[i]);
            } catch (e) {
              if (typeof console !== "undefined" && console.error) {
                console.error(e);
              }
            }
          }
        });
      }
      close(err) {
        if (this.finalized) {
          return;
        }
        this.finalized = true;
        if (err !== void 0) {
          this.finalError = err;
        }
        this.task.then(() => {
          this.observers = void 0;
          this.onNoObservers = void 0;
        });
      }
    };
    MAX_VALUE_MILLIS = 4 * 60 * 60 * 1e3;
  }
});

// node_modules/@firebase/component/dist/esm/index.esm.js
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? void 0 : identifier;
}
function isComponentEager(component) {
  return component.instantiationMode === "EAGER";
}
var Component, DEFAULT_ENTRY_NAME, Provider, ComponentContainer;
var init_index_esm2 = __esm({
  "node_modules/@firebase/component/dist/esm/index.esm.js"() {
    init_index_esm();
    Component = class {
      /**
       *
       * @param name The public service name, e.g. app, auth, firestore, database
       * @param instanceFactory Service factory responsible for creating the public interface
       * @param type whether the service provided by the component is public or private
       */
      constructor(name3, instanceFactory, type) {
        this.name = name3;
        this.instanceFactory = instanceFactory;
        this.type = type;
        this.multipleInstances = false;
        this.serviceProps = {};
        this.instantiationMode = "LAZY";
        this.onInstanceCreated = null;
      }
      setInstantiationMode(mode) {
        this.instantiationMode = mode;
        return this;
      }
      setMultipleInstances(multipleInstances) {
        this.multipleInstances = multipleInstances;
        return this;
      }
      setServiceProps(props) {
        this.serviceProps = props;
        return this;
      }
      setInstanceCreatedCallback(callback) {
        this.onInstanceCreated = callback;
        return this;
      }
    };
    DEFAULT_ENTRY_NAME = "[DEFAULT]";
    Provider = class {
      constructor(name3, container) {
        this.name = name3;
        this.container = container;
        this.component = null;
        this.instances = /* @__PURE__ */ new Map();
        this.instancesDeferred = /* @__PURE__ */ new Map();
        this.instancesOptions = /* @__PURE__ */ new Map();
        this.onInitCallbacks = /* @__PURE__ */ new Map();
      }
      /**
       * @param identifier A provider can provide multiple instances of a service
       * if this.component.multipleInstances is true.
       */
      get(identifier) {
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        if (!this.instancesDeferred.has(normalizedIdentifier)) {
          const deferred = new Deferred();
          this.instancesDeferred.set(normalizedIdentifier, deferred);
          if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
            try {
              const instance = this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier
              });
              if (instance) {
                deferred.resolve(instance);
              }
            } catch (e) {
            }
          }
        }
        return this.instancesDeferred.get(normalizedIdentifier).promise;
      }
      getImmediate(options) {
        const normalizedIdentifier = this.normalizeInstanceIdentifier(options?.identifier);
        const optional = options?.optional ?? false;
        if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
          try {
            return this.getOrInitializeService({
              instanceIdentifier: normalizedIdentifier
            });
          } catch (e) {
            if (optional) {
              return null;
            } else {
              throw e;
            }
          }
        } else {
          if (optional) {
            return null;
          } else {
            throw Error(`Service ${this.name} is not available`);
          }
        }
      }
      getComponent() {
        return this.component;
      }
      setComponent(component) {
        if (component.name !== this.name) {
          throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
        }
        if (this.component) {
          throw Error(`Component for ${this.name} has already been provided`);
        }
        this.component = component;
        if (!this.shouldAutoInitialize()) {
          return;
        }
        if (isComponentEager(component)) {
          try {
            this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
          } catch (e) {
          }
        }
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
          const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
          try {
            const instance = this.getOrInitializeService({
              instanceIdentifier: normalizedIdentifier
            });
            instanceDeferred.resolve(instance);
          } catch (e) {
          }
        }
      }
      clearInstance(identifier = DEFAULT_ENTRY_NAME) {
        this.instancesDeferred.delete(identifier);
        this.instancesOptions.delete(identifier);
        this.instances.delete(identifier);
      }
      // app.delete() will call this method on every provider to delete the services
      // TODO: should we mark the provider as deleted?
      async delete() {
        const services = Array.from(this.instances.values());
        await Promise.all([
          ...services.filter((service) => "INTERNAL" in service).map((service) => service.INTERNAL.delete()),
          ...services.filter((service) => "_delete" in service).map((service) => service._delete())
        ]);
      }
      isComponentSet() {
        return this.component != null;
      }
      isInitialized(identifier = DEFAULT_ENTRY_NAME) {
        return this.instances.has(identifier);
      }
      getOptions(identifier = DEFAULT_ENTRY_NAME) {
        return this.instancesOptions.get(identifier) || {};
      }
      initialize(opts = {}) {
        const { options = {} } = opts;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
        if (this.isInitialized(normalizedIdentifier)) {
          throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
        }
        if (!this.isComponentSet()) {
          throw Error(`Component ${this.name} has not been registered yet`);
        }
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier,
          options
        });
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
          const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
          if (normalizedIdentifier === normalizedDeferredIdentifier) {
            instanceDeferred.resolve(instance);
          }
        }
        return instance;
      }
      /**
       *
       * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
       * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
       *
       * @param identifier An optional instance identifier
       * @returns a function to unregister the callback
       */
      onInit(callback, identifier) {
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        const existingCallbacks = this.onInitCallbacks.get(normalizedIdentifier) ?? /* @__PURE__ */ new Set();
        existingCallbacks.add(callback);
        this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
        const existingInstance = this.instances.get(normalizedIdentifier);
        if (existingInstance) {
          callback(existingInstance, normalizedIdentifier);
        }
        return () => {
          existingCallbacks.delete(callback);
        };
      }
      /**
       * Invoke onInit callbacks synchronously
       * @param instance the service instance`
       */
      invokeOnInitCallbacks(instance, identifier) {
        const callbacks = this.onInitCallbacks.get(identifier);
        if (!callbacks) {
          return;
        }
        for (const callback of callbacks) {
          try {
            callback(instance, identifier);
          } catch {
          }
        }
      }
      getOrInitializeService({ instanceIdentifier, options = {} }) {
        let instance = this.instances.get(instanceIdentifier);
        if (!instance && this.component) {
          instance = this.component.instanceFactory(this.container, {
            instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
            options
          });
          this.instances.set(instanceIdentifier, instance);
          this.instancesOptions.set(instanceIdentifier, options);
          this.invokeOnInitCallbacks(instance, instanceIdentifier);
          if (this.component.onInstanceCreated) {
            try {
              this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
            } catch {
            }
          }
        }
        return instance || null;
      }
      normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
        if (this.component) {
          return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
        } else {
          return identifier;
        }
      }
      shouldAutoInitialize() {
        return !!this.component && this.component.instantiationMode !== "EXPLICIT";
      }
    };
    ComponentContainer = class {
      constructor(name3) {
        this.name = name3;
        this.providers = /* @__PURE__ */ new Map();
      }
      /**
       *
       * @param component Component being added
       * @param overwrite When a component with the same name has already been registered,
       * if overwrite is true: overwrite the existing component with the new component and create a new
       * provider with the new component. It can be useful in tests where you want to use different mocks
       * for different tests.
       * if overwrite is false: throw an exception
       */
      addComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
          throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
        }
        provider.setComponent(component);
      }
      addOrOverwriteComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
          this.providers.delete(component.name);
        }
        this.addComponent(component);
      }
      /**
       * getProvider provides a type safe interface where it can only be called with a field name
       * present in NameServiceMapping interface.
       *
       * Firebase SDKs providing services should extend NameServiceMapping interface to register
       * themselves.
       */
      getProvider(name3) {
        if (this.providers.has(name3)) {
          return this.providers.get(name3);
        }
        const provider = new Provider(name3, this);
        this.providers.set(name3, provider);
        return provider;
      }
      getProviders() {
        return Array.from(this.providers.values());
      }
    };
  }
});

// node_modules/@firebase/logger/dist/esm/index.esm.js
var instances, LogLevel, levelStringToEnum, defaultLogLevel, ConsoleMethod, defaultLogHandler, Logger;
var init_index_esm3 = __esm({
  "node_modules/@firebase/logger/dist/esm/index.esm.js"() {
    instances = [];
    (function(LogLevel2) {
      LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
      LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
      LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
      LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
      LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
      LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
    })(LogLevel || (LogLevel = {}));
    levelStringToEnum = {
      "debug": LogLevel.DEBUG,
      "verbose": LogLevel.VERBOSE,
      "info": LogLevel.INFO,
      "warn": LogLevel.WARN,
      "error": LogLevel.ERROR,
      "silent": LogLevel.SILENT
    };
    defaultLogLevel = LogLevel.INFO;
    ConsoleMethod = {
      [LogLevel.DEBUG]: "log",
      [LogLevel.VERBOSE]: "log",
      [LogLevel.INFO]: "info",
      [LogLevel.WARN]: "warn",
      [LogLevel.ERROR]: "error"
    };
    defaultLogHandler = (instance, logType, ...args) => {
      if (logType < instance.logLevel) {
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const method = ConsoleMethod[logType];
      if (method) {
        console[method](`[${now}]  ${instance.name}:`, ...args);
      } else {
        throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
      }
    };
    Logger = class {
      /**
       * Gives you an instance of a Logger to capture messages according to
       * Firebase's logging scheme.
       *
       * @param name The name that the logs will be associated with
       */
      constructor(name3) {
        this.name = name3;
        this._logLevel = defaultLogLevel;
        this._logHandler = defaultLogHandler;
        this._userLogHandler = null;
        instances.push(this);
      }
      get logLevel() {
        return this._logLevel;
      }
      set logLevel(val) {
        if (!(val in LogLevel)) {
          throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
        }
        this._logLevel = val;
      }
      // Workaround for setter/getter having to be the same type.
      setLogLevel(val) {
        this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
      }
      get logHandler() {
        return this._logHandler;
      }
      set logHandler(val) {
        if (typeof val !== "function") {
          throw new TypeError("Value assigned to `logHandler` must be a function");
        }
        this._logHandler = val;
      }
      get userLogHandler() {
        return this._userLogHandler;
      }
      set userLogHandler(val) {
        this._userLogHandler = val;
      }
      /**
       * The functions below are all based on the `console` interface
       */
      debug(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
        this._logHandler(this, LogLevel.DEBUG, ...args);
      }
      log(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
        this._logHandler(this, LogLevel.VERBOSE, ...args);
      }
      info(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
        this._logHandler(this, LogLevel.INFO, ...args);
      }
      warn(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
        this._logHandler(this, LogLevel.WARN, ...args);
      }
      error(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
        this._logHandler(this, LogLevel.ERROR, ...args);
      }
    };
  }
});

// node_modules/idb/build/wrap-idb-value.js
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var instanceOfAny, idbProxyableTypes, cursorAdvanceMethods, cursorRequestMap, transactionDoneMap, transactionStoreNamesMap, transformCache, reverseTransformCache, idbProxyTraps, unwrap;
var init_wrap_idb_value = __esm({
  "node_modules/idb/build/wrap-idb-value.js"() {
    instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
    cursorRequestMap = /* @__PURE__ */ new WeakMap();
    transactionDoneMap = /* @__PURE__ */ new WeakMap();
    transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
    transformCache = /* @__PURE__ */ new WeakMap();
    reverseTransformCache = /* @__PURE__ */ new WeakMap();
    idbProxyTraps = {
      get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
          if (prop === "done")
            return transactionDoneMap.get(target);
          if (prop === "objectStoreNames") {
            return target.objectStoreNames || transactionStoreNamesMap.get(target);
          }
          if (prop === "store") {
            return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
          }
        }
        return wrap(target[prop]);
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
      has(target, prop) {
        if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
          return true;
        }
        return prop in target;
      }
    };
    unwrap = (value) => reverseTransformCache.get(value);
  }
});

// node_modules/idb/build/index.js
function openDB(name3, version3, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name3, version3);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db2) => {
    if (terminated)
      db2.addEventListener("close", () => terminated());
    if (blocking) {
      db2.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
var readMethods, writeMethods, cachedMethods;
var init_build = __esm({
  "node_modules/idb/build/index.js"() {
    init_wrap_idb_value();
    init_wrap_idb_value();
    readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
    writeMethods = ["put", "add", "delete", "clear"];
    cachedMethods = /* @__PURE__ */ new Map();
    replaceTraps((oldTraps) => ({
      ...oldTraps,
      get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
      has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
    }));
  }
});

// node_modules/@firebase/app/dist/esm/index.esm.js
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return component?.type === "VERSION";
}
function _addComponent(app2, component) {
  try {
    app2.container.addComponent(component);
  } catch (e) {
    logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app2.name}`, e);
  }
}
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger.debug(`There were multiple attempts to register component ${componentName}.`);
    return false;
  }
  _components.set(componentName, component);
  for (const app2 of _apps.values()) {
    _addComponent(app2, component);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component);
  }
  return true;
}
function _getProvider(app2, name3) {
  const heartbeatController = app2.container.getProvider("heartbeat").getImmediate({ optional: true });
  if (heartbeatController) {
    void heartbeatController.triggerHeartbeat();
  }
  return app2.container.getProvider(name3);
}
function _isFirebaseServerApp(obj) {
  if (obj === null || obj === void 0) {
    return false;
  }
  return obj.settings !== void 0;
}
function initializeApp(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name4 = rawConfig;
    rawConfig = { name: name4 };
  }
  const config = {
    name: DEFAULT_ENTRY_NAME2,
    automaticDataCollectionEnabled: true,
    ...rawConfig
  };
  const name3 = config.name;
  if (typeof name3 !== "string" || !name3) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name3)
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create(
      "no-options"
      /* AppError.NO_OPTIONS */
    );
  }
  const existingApp = _apps.get(name3);
  if (existingApp) {
    if (!deepEqual(options, existingApp.options)) {
      throw ERROR_FACTORY.create("duplicate-app", {
        appName: name3,
        mismatchedParam: "options",
        oldValue: JSON.stringify(existingApp.options),
        newValue: JSON.stringify(options)
      });
    } else if (!deepEqual(config, existingApp.config)) {
      throw ERROR_FACTORY.create("duplicate-app", {
        appName: name3,
        mismatchedParam: "config",
        oldValue: JSON.stringify(existingApp.config),
        newValue: JSON.stringify(config)
      });
    } else {
      return existingApp;
    }
  }
  const container = new ComponentContainer(name3);
  for (const component of _components.values()) {
    container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name3, newApp);
  return newApp;
}
function getApp(name3 = DEFAULT_ENTRY_NAME2) {
  const app2 = _apps.get(name3);
  if (!app2 && name3 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp();
  }
  if (!app2) {
    throw ERROR_FACTORY.create("no-app", { appName: name3 });
  }
  return app2;
}
function registerVersion(libraryKeyOrName, version3, variant) {
  let library = PLATFORM_LOG_STRING[libraryKeyOrName] ?? libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version3.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version3}":`
    ];
    if (libraryMismatch) {
      warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(`version name "${version3}" contains illegal characters (whitespace or "/")`);
    }
    logger.warn(warning.join(" "));
    return;
  }
  _registerComponent(new Component(
    `${library}-version`,
    () => ({ library, version: version3 }),
    "VERSION"
    /* ComponentType.VERSION */
  ));
}
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: (db2, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db2.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message
      });
    });
  }
  return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app2) {
  try {
    const db2 = await getDbPromise();
    const tx = db2.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app2));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e?.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app2, heartbeatObject) {
  try {
    const db2 = await getDbPromise();
    const tx = db2.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app2));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e?.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
function computeKey(app2) {
  return `${app2.name}!${app2.options.appId}`;
}
function getUTCDateString() {
  const today = /* @__PURE__ */ new Date();
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date]
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries
  };
}
function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })
  ).length;
}
function getEarliestHeartbeatIdx(heartbeats) {
  if (heartbeats.length === 0) {
    return -1;
  }
  let earliestHeartbeatIdx = 0;
  let earliestHeartbeatDate = heartbeats[0].date;
  for (let i = 1; i < heartbeats.length; i++) {
    if (heartbeats[i].date < earliestHeartbeatDate) {
      earliestHeartbeatDate = heartbeats[i].date;
      earliestHeartbeatIdx = i;
    }
  }
  return earliestHeartbeatIdx;
}
function registerCoreComponents(variant) {
  _registerComponent(new Component(
    "platform-logger",
    (container) => new PlatformLoggerServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  _registerComponent(new Component(
    "heartbeat",
    (container) => new HeartbeatServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  registerVersion(name$q, version$1, variant);
  registerVersion(name$q, version$1, "esm2020");
  registerVersion("fire-js", "");
}
var PlatformLoggerServiceImpl, name$q, version$1, logger, name$p, name$o, name$n, name$m, name$l, name$k, name$j, name$i, name$h, name$g, name$f, name$e, name$d, name$c, name$b, name$a, name$9, name$8, name$7, name$6, name$5, name$4, name$3, name$2, name$1, name, version, DEFAULT_ENTRY_NAME2, PLATFORM_LOG_STRING, _apps, _serverApps, _components, ERRORS, ERROR_FACTORY, FirebaseAppImpl, SDK_VERSION, DB_NAME, DB_VERSION, STORE_NAME, dbPromise, MAX_HEADER_BYTES, MAX_NUM_STORED_HEARTBEATS, HeartbeatServiceImpl, HeartbeatStorageImpl;
var init_index_esm4 = __esm({
  "node_modules/@firebase/app/dist/esm/index.esm.js"() {
    init_index_esm2();
    init_index_esm3();
    init_index_esm();
    init_index_esm();
    init_build();
    PlatformLoggerServiceImpl = class {
      constructor(container) {
        this.container = container;
      }
      // In initial implementation, this will be called by installations on
      // auth token refresh, and installations will send this string.
      getPlatformInfoString() {
        const providers = this.container.getProviders();
        return providers.map((provider) => {
          if (isVersionServiceProvider(provider)) {
            const service = provider.getImmediate();
            return `${service.library}/${service.version}`;
          } else {
            return null;
          }
        }).filter((logString) => logString).join(" ");
      }
    };
    name$q = "@firebase/app";
    version$1 = "0.16.2";
    logger = new Logger("@firebase/app");
    name$p = "@firebase/app-compat";
    name$o = "@firebase/analytics-compat";
    name$n = "@firebase/analytics";
    name$m = "@firebase/app-check-compat";
    name$l = "@firebase/app-check";
    name$k = "@firebase/auth";
    name$j = "@firebase/auth-compat";
    name$i = "@firebase/database";
    name$h = "@firebase/data-connect";
    name$g = "@firebase/database-compat";
    name$f = "@firebase/functions";
    name$e = "@firebase/functions-compat";
    name$d = "@firebase/installations";
    name$c = "@firebase/installations-compat";
    name$b = "@firebase/messaging";
    name$a = "@firebase/messaging-compat";
    name$9 = "@firebase/performance";
    name$8 = "@firebase/performance-compat";
    name$7 = "@firebase/remote-config";
    name$6 = "@firebase/remote-config-compat";
    name$5 = "@firebase/storage";
    name$4 = "@firebase/storage-compat";
    name$3 = "@firebase/firestore";
    name$2 = "@firebase/ai";
    name$1 = "@firebase/firestore-compat";
    name = "firebase";
    version = "12.19.0";
    DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
    PLATFORM_LOG_STRING = {
      [name$q]: "fire-core",
      [name$p]: "fire-core-compat",
      [name$n]: "fire-analytics",
      [name$o]: "fire-analytics-compat",
      [name$l]: "fire-app-check",
      [name$m]: "fire-app-check-compat",
      [name$k]: "fire-auth",
      [name$j]: "fire-auth-compat",
      [name$i]: "fire-rtdb",
      [name$h]: "fire-data-connect",
      [name$g]: "fire-rtdb-compat",
      [name$f]: "fire-fn",
      [name$e]: "fire-fn-compat",
      [name$d]: "fire-iid",
      [name$c]: "fire-iid-compat",
      [name$b]: "fire-fcm",
      [name$a]: "fire-fcm-compat",
      [name$9]: "fire-perf",
      [name$8]: "fire-perf-compat",
      [name$7]: "fire-rc",
      [name$6]: "fire-rc-compat",
      [name$5]: "fire-gcs",
      [name$4]: "fire-gcs-compat",
      [name$3]: "fire-fst",
      [name$1]: "fire-fst-compat",
      [name$2]: "fire-vertex",
      "fire-js": "fire-js",
      // Platform identifier for JS SDK.
      [name]: "fire-js-all"
    };
    _apps = /* @__PURE__ */ new Map();
    _serverApps = /* @__PURE__ */ new Map();
    _components = /* @__PURE__ */ new Map();
    ERRORS = {
      [
        "no-app"
        /* AppError.NO_APP */
      ]: "No Firebase App '{$appName}' has been created - call initializeApp() first",
      [
        "bad-app-name"
        /* AppError.BAD_APP_NAME */
      ]: "Illegal App name: '{$appName}'",
      [
        "duplicate-app"
        /* AppError.DUPLICATE_APP */
      ]: "Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.",
      [
        "app-deleted"
        /* AppError.APP_DELETED */
      ]: "Firebase App named '{$appName}' already deleted",
      [
        "server-app-deleted"
        /* AppError.SERVER_APP_DELETED */
      ]: "Firebase Server App has been deleted",
      [
        "no-options"
        /* AppError.NO_OPTIONS */
      ]: "Need to provide options, when not being deployed to hosting via source.",
      [
        "invalid-app-argument"
        /* AppError.INVALID_APP_ARGUMENT */
      ]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
      [
        "invalid-log-argument"
        /* AppError.INVALID_LOG_ARGUMENT */
      ]: "First argument to `onLog` must be null or a function.",
      [
        "idb-open"
        /* AppError.IDB_OPEN */
      ]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "idb-get"
        /* AppError.IDB_GET */
      ]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "idb-set"
        /* AppError.IDB_WRITE */
      ]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "idb-delete"
        /* AppError.IDB_DELETE */
      ]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "finalization-registry-not-supported"
        /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */
      ]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
      [
        "invalid-server-app-environment"
        /* AppError.INVALID_SERVER_APP_ENVIRONMENT */
      ]: "FirebaseServerApp is not for use in browser environments."
    };
    ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);
    FirebaseAppImpl = class {
      constructor(options, config, container) {
        this._isDeleted = false;
        this._options = { ...options };
        this._config = { ...config };
        this._name = config.name;
        this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
        this._container = container;
        this.container.addComponent(new Component(
          "app",
          () => this,
          "PUBLIC"
          /* ComponentType.PUBLIC */
        ));
      }
      get automaticDataCollectionEnabled() {
        this.checkDestroyed();
        return this._automaticDataCollectionEnabled;
      }
      set automaticDataCollectionEnabled(val) {
        this.checkDestroyed();
        this._automaticDataCollectionEnabled = val;
      }
      get name() {
        this.checkDestroyed();
        return this._name;
      }
      get options() {
        this.checkDestroyed();
        return this._options;
      }
      get config() {
        this.checkDestroyed();
        return this._config;
      }
      get container() {
        return this._container;
      }
      get isDeleted() {
        return this._isDeleted;
      }
      set isDeleted(val) {
        this._isDeleted = val;
      }
      /**
       * This function will throw an Error if the App has already been deleted -
       * use before performing API actions on the App.
       */
      checkDestroyed() {
        if (this.isDeleted) {
          throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
        }
      }
    };
    SDK_VERSION = version;
    DB_NAME = "firebase-heartbeat-database";
    DB_VERSION = 1;
    STORE_NAME = "firebase-heartbeat-store";
    dbPromise = null;
    MAX_HEADER_BYTES = 1024;
    MAX_NUM_STORED_HEARTBEATS = 30;
    HeartbeatServiceImpl = class {
      constructor(container) {
        this.container = container;
        this._heartbeatsCache = null;
        const app2 = this.container.getProvider("app").getImmediate();
        this._storage = new HeartbeatStorageImpl(app2);
        this._heartbeatsCachePromise = this._storage.read().then((result) => {
          this._heartbeatsCache = result;
          return result;
        });
      }
      /**
       * Called to report a heartbeat. The function will generate
       * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
       * to IndexedDB.
       * Note that we only store one heartbeat per day. So if a heartbeat for today is
       * already logged, subsequent calls to this function in the same day will be ignored.
       */
      async triggerHeartbeat() {
        try {
          const platformLogger = this.container.getProvider("platform-logger").getImmediate();
          const agent = platformLogger.getPlatformInfoString();
          const date = getUTCDateString();
          if (this._heartbeatsCache?.heartbeats == null) {
            this._heartbeatsCache = await this._heartbeatsCachePromise;
            if (this._heartbeatsCache?.heartbeats == null) {
              return;
            }
          }
          if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
            return;
          } else {
            this._heartbeatsCache.heartbeats.push({ date, agent });
            if (this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS) {
              const earliestHeartbeatIdx = getEarliestHeartbeatIdx(this._heartbeatsCache.heartbeats);
              this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
            }
          }
          return this._storage.overwrite(this._heartbeatsCache);
        } catch (e) {
          logger.warn(e);
        }
      }
      /**
       * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
       * It also clears all heartbeats from memory as well as in IndexedDB.
       *
       * NOTE: Consuming product SDKs should not send the header if this method
       * returns an empty string.
       */
      async getHeartbeatsHeader() {
        try {
          if (this._heartbeatsCache === null) {
            await this._heartbeatsCachePromise;
          }
          if (this._heartbeatsCache?.heartbeats == null || this._heartbeatsCache.heartbeats.length === 0) {
            return "";
          }
          const date = getUTCDateString();
          const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
          const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
          this._heartbeatsCache.lastSentHeartbeatDate = date;
          if (unsentEntries.length > 0) {
            this._heartbeatsCache.heartbeats = unsentEntries;
            await this._storage.overwrite(this._heartbeatsCache);
          } else {
            this._heartbeatsCache.heartbeats = [];
            void this._storage.overwrite(this._heartbeatsCache);
          }
          return headerString;
        } catch (e) {
          logger.warn(e);
          return "";
        }
      }
    };
    HeartbeatStorageImpl = class {
      constructor(app2) {
        this.app = app2;
        this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
      }
      async runIndexedDBEnvironmentCheck() {
        if (!isIndexedDBAvailable()) {
          return false;
        } else {
          return validateIndexedDBOpenable().then(() => true).catch(() => false);
        }
      }
      /**
       * Read all heartbeats.
       */
      async read() {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
          return { heartbeats: [] };
        } else {
          const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
          if (idbHeartbeatObject?.heartbeats) {
            return idbHeartbeatObject;
          } else {
            return { heartbeats: [] };
          }
        }
      }
      // overwrite the storage with the provided heartbeats
      async overwrite(heartbeatsObject) {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
          return;
        } else {
          const existingHeartbeatsObject = await this.read();
          return writeHeartbeatsToIndexedDB(this.app, {
            lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
            heartbeats: heartbeatsObject.heartbeats
          });
        }
      }
      // add heartbeats
      async add(heartbeatsObject) {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
          return;
        } else {
          const existingHeartbeatsObject = await this.read();
          return writeHeartbeatsToIndexedDB(this.app, {
            lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
            heartbeats: [
              ...existingHeartbeatsObject.heartbeats,
              ...heartbeatsObject.heartbeats
            ]
          });
        }
      }
    };
    registerCoreComponents("");
  }
});

// node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js
function _prodErrorMap() {
  return {
    [
      "dependent-sdk-initialized-before-auth"
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    ]: "Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."
  };
}
function _logWarn(msg, ...args) {
  if (logClient.logLevel <= LogLevel.WARN) {
    logClient.warn(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
function _logError(msg, ...args) {
  if (logClient.logLevel <= LogLevel.ERROR) {
    logClient.error(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
function _fail(authOrCode, ...rest) {
  throw createErrorInternal(authOrCode, ...rest);
}
function _createError(authOrCode, ...rest) {
  return createErrorInternal(authOrCode, ...rest);
}
function _errorWithCustomMessage(auth2, code, message) {
  const errorMap = {
    ...prodErrorMap(),
    [code]: message
  };
  const factory = new ErrorFactory("auth", "Firebase", errorMap);
  return factory.create(code, {
    appName: auth2.name
  });
}
function _serverAppCurrentUserOperationNotSupportedError(auth2) {
  return _errorWithCustomMessage(auth2, "operation-not-supported-in-this-environment", "Operations that alter the current user are not supported in conjunction with FirebaseServerApp");
}
function _assertInstanceOf(auth2, object, instance) {
  const constructorInstance = instance;
  if (!(object instanceof constructorInstance)) {
    if (constructorInstance.name !== object.constructor.name) {
      _fail(
        auth2,
        "argument-error"
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
    }
    throw _errorWithCustomMessage(auth2, "argument-error", `Type of ${object.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`);
  }
}
function createErrorInternal(authOrCode, ...rest) {
  if (typeof authOrCode !== "string") {
    const code = rest[0];
    const fullParams = [...rest.slice(1)];
    if (fullParams[0]) {
      fullParams[0].appName = authOrCode.name;
    }
    return authOrCode._errorFactory.create(code, ...fullParams);
  }
  return _DEFAULT_AUTH_ERROR_FACTORY.create(authOrCode, ...rest);
}
function _assert(assertion, authOrCode, ...rest) {
  if (!assertion) {
    throw createErrorInternal(authOrCode, ...rest);
  }
}
function debugFail(failure) {
  const message = `INTERNAL ASSERTION FAILED: ` + failure;
  _logError(message);
  throw new Error(message);
}
function debugAssert(assertion, message) {
  if (!assertion) {
    debugFail(message);
  }
}
function _getCurrentUrl() {
  return typeof self !== "undefined" && self.location?.href || "";
}
function _isHttpOrHttps() {
  return _getCurrentScheme() === "http:" || _getCurrentScheme() === "https:";
}
function _getCurrentScheme() {
  return typeof self !== "undefined" && self.location?.protocol || null;
}
function _isOnline() {
  if (typeof navigator !== "undefined" && navigator && "onLine" in navigator && typeof navigator.onLine === "boolean" && // Apply only for traditional web apps and Chrome extensions.
  // This is especially true for Cordova apps which have unreliable
  // navigator.onLine behavior unless cordova-plugin-network-information is
  // installed which overwrites the native navigator.onLine value and
  // defines navigator.connection.
  (_isHttpOrHttps() || isBrowserExtension() || "connection" in navigator)) {
    return navigator.onLine;
  }
  return true;
}
function _getUserLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const navigatorLanguage = navigator;
  return (
    // Most reliable, but only supported in Chrome/Firefox.
    navigatorLanguage.languages && navigatorLanguage.languages[0] || // Supported in most browsers, but returns the language of the browser
    // UI, not the language set in browser settings.
    navigatorLanguage.language || // Couldn't determine language.
    null
  );
}
function _emulatorUrl(config, path) {
  debugAssert(config.emulator, "Emulator should always be set here");
  const { url } = config.emulator;
  if (!path) {
    return url;
  }
  return `${url}${path.startsWith("/") ? path.slice(1) : path}`;
}
function _addTidIfNecessary(auth2, request) {
  if (auth2.tenantId && !request.tenantId) {
    return {
      ...request,
      tenantId: auth2.tenantId
    };
  }
  return request;
}
async function _performApiRequest(auth2, method, path, request, customErrorMap = {}) {
  return _performFetchWithErrorHandling(auth2, customErrorMap, async () => {
    let body = {};
    let params = {};
    if (request) {
      if (method === "GET") {
        params = request;
      } else {
        body = {
          body: JSON.stringify(request)
        };
      }
    }
    const query = querystring({
      ...params,
      key: auth2.config.apiKey
    }).slice(1);
    const headers = await auth2._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/json";
    if (auth2.languageCode) {
      headers[
        "X-Firebase-Locale"
        /* HttpHeader.X_FIREBASE_LOCALE */
      ] = auth2.languageCode;
    }
    const fetchArgs = {
      method,
      headers,
      ...body
    };
    if (!isCloudflareWorker()) {
      fetchArgs.referrerPolicy = "strict-origin-when-cross-origin";
    }
    if (auth2.emulatorConfig && isCloudWorkstation(auth2.emulatorConfig.host)) {
      fetchArgs.credentials = "include";
    }
    return FetchProvider.fetch()(await _getFinalTarget(auth2, auth2.config.apiHost, path, query), fetchArgs);
  });
}
async function _performFetchWithErrorHandling(auth2, customErrorMap, fetchFn) {
  auth2._canInitEmulator = false;
  const errorMap = { ...SERVER_ERROR_MAP, ...customErrorMap };
  try {
    const networkTimeout = new NetworkTimeout(auth2);
    const response = await Promise.race([
      fetchFn(),
      networkTimeout.promise
    ]);
    networkTimeout.clearNetworkTimeout();
    const json = await response.json();
    if ("needConfirmation" in json) {
      throw _makeTaggedError(auth2, "account-exists-with-different-credential", json);
    }
    if (response.ok && !("errorMessage" in json)) {
      return json;
    } else {
      const errorMessage = response.ok ? json.errorMessage : json.error.message;
      const [serverErrorCode, serverErrorMessage] = errorMessage.split(" : ");
      if (serverErrorCode === "FEDERATED_USER_ID_ALREADY_LINKED") {
        throw _makeTaggedError(auth2, "credential-already-in-use", json);
      } else if (serverErrorCode === "EMAIL_EXISTS") {
        throw _makeTaggedError(auth2, "email-already-in-use", json);
      } else if (serverErrorCode === "USER_DISABLED") {
        throw _makeTaggedError(auth2, "user-disabled", json);
      }
      const authError = errorMap[serverErrorCode] || serverErrorCode.toLowerCase().replace(/[_\s]+/g, "-");
      if (serverErrorMessage) {
        throw _errorWithCustomMessage(auth2, authError, serverErrorMessage);
      } else {
        _fail(auth2, authError);
      }
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      throw e;
    }
    _fail(auth2, "network-request-failed", { "message": String(e) });
  }
}
async function _performSignInRequest(auth2, method, path, request, customErrorMap = {}) {
  const serverResponse = await _performApiRequest(auth2, method, path, request, customErrorMap);
  if ("mfaPendingCredential" in serverResponse) {
    _fail(auth2, "multi-factor-auth-required", {
      _serverResponse: serverResponse
    });
  }
  return serverResponse;
}
async function _getFinalTarget(auth2, host, path, query) {
  const base = `${host}${path}?${query}`;
  const authInternal = auth2;
  const finalTarget = authInternal.config.emulator ? _emulatorUrl(auth2.config, base) : `${auth2.config.apiScheme}://${base}`;
  if (CookieAuthProxiedEndpoints.includes(path)) {
    await authInternal._persistenceManagerAvailable;
    if (authInternal._getPersistenceType() === "COOKIE") {
      const cookiePersistence = authInternal._getPersistence();
      return cookiePersistence._getFinalTarget(finalTarget).toString();
    }
  }
  return finalTarget;
}
function _parseEnforcementState(enforcementStateStr) {
  switch (enforcementStateStr) {
    case "ENFORCE":
      return "ENFORCE";
    case "AUDIT":
      return "AUDIT";
    case "OFF":
      return "OFF";
    default:
      return "ENFORCEMENT_STATE_UNSPECIFIED";
  }
}
function _makeTaggedError(auth2, code, response) {
  const errorParams = {
    appName: auth2.name
  };
  if (response.email) {
    errorParams.email = response.email;
  }
  if (response.phoneNumber) {
    errorParams.phoneNumber = response.phoneNumber;
  }
  const error = _createError(auth2, code, errorParams);
  error.customData._tokenResponse = response;
  return error;
}
function isV2(grecaptcha) {
  return grecaptcha !== void 0 && grecaptcha.getResponse !== void 0;
}
function isEnterprise(grecaptcha) {
  return grecaptcha !== void 0 && grecaptcha.enterprise !== void 0;
}
async function getRecaptchaParams(auth2) {
  return (await _performApiRequest(
    auth2,
    "GET",
    "/v1/recaptchaParams"
    /* Endpoint.GET_RECAPTCHA_PARAM */
  )).recaptchaSiteKey || "";
}
async function getRecaptchaConfig(auth2, request) {
  return _performApiRequest(auth2, "GET", "/v2/recaptchaConfig", _addTidIfNecessary(auth2, request));
}
async function deleteAccount(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:delete", request);
}
async function deleteLinkedAccounts(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:update", request);
}
async function getAccountInfo(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:lookup", request);
}
function utcTimestampToDateString(utcTimestamp) {
  if (!utcTimestamp) {
    return void 0;
  }
  try {
    const date = new Date(Number(utcTimestamp));
    if (!isNaN(date.getTime())) {
      return date.toUTCString();
    }
  } catch (e) {
  }
  return void 0;
}
async function getIdTokenResult(user, forceRefresh = false) {
  const userInternal = getModularInstance(user);
  const token = await userInternal.getIdToken(forceRefresh);
  const claims = _parseToken(token);
  _assert(
    claims && claims.exp && claims.auth_time && claims.iat,
    userInternal.auth,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const firebase = typeof claims.firebase === "object" ? claims.firebase : void 0;
  const signInProvider = firebase?.["sign_in_provider"];
  return {
    claims,
    token,
    authTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.auth_time)),
    issuedAtTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.iat)),
    expirationTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.exp)),
    signInProvider: signInProvider || null,
    signInSecondFactor: firebase?.["sign_in_second_factor"] || null
  };
}
function secondsStringToMilliseconds(seconds) {
  return Number(seconds) * 1e3;
}
function _parseToken(token) {
  const [algorithm, payload, signature] = token.split(".");
  if (algorithm === void 0 || payload === void 0 || signature === void 0) {
    _logError("JWT malformed, contained fewer than 3 sections");
    return null;
  }
  try {
    const decoded = base64Decode(payload);
    if (!decoded) {
      _logError("Failed to decode base64 JWT payload");
      return null;
    }
    return JSON.parse(decoded);
  } catch (e) {
    _logError("Caught error parsing JWT payload as JSON", e?.toString());
    return null;
  }
}
function _tokenExpiresIn(token) {
  const parsedToken = _parseToken(token);
  _assert(
    parsedToken,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.exp !== "undefined",
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.iat !== "undefined",
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return Number(parsedToken.exp) - Number(parsedToken.iat);
}
async function _logoutIfInvalidated(user, promise, bypassAuthState = false) {
  if (bypassAuthState) {
    return promise;
  }
  try {
    return await promise;
  } catch (e) {
    if (e instanceof FirebaseError && isUserInvalidated(e)) {
      if (user.auth.currentUser === user) {
        await user.auth.signOut();
      }
    }
    throw e;
  }
}
function isUserInvalidated({ code }) {
  return code === `auth/${"user-disabled"}` || code === `auth/${"user-token-expired"}`;
}
async function _reloadWithoutSaving(user) {
  const auth2 = user.auth;
  const idToken = await user.getIdToken();
  const response = await _logoutIfInvalidated(user, getAccountInfo(auth2, { idToken }));
  _assert(
    response?.users.length,
    auth2,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const coreAccount = response.users[0];
  user._notifyReloadListener(coreAccount);
  const newProviderData = coreAccount.providerUserInfo?.length ? extractProviderData(coreAccount.providerUserInfo) : [];
  const providerData = mergeProviderData(user.providerData, newProviderData);
  const oldIsAnonymous = user.isAnonymous;
  const newIsAnonymous = !(user.email && coreAccount.passwordHash) && !providerData?.length;
  const isAnonymous = !oldIsAnonymous ? false : newIsAnonymous;
  const updates = {
    uid: coreAccount.localId,
    displayName: coreAccount.displayName || null,
    photoURL: coreAccount.photoUrl || null,
    email: coreAccount.email || null,
    emailVerified: coreAccount.emailVerified || false,
    phoneNumber: coreAccount.phoneNumber || null,
    tenantId: coreAccount.tenantId || null,
    providerData,
    metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
    isAnonymous
  };
  Object.assign(user, updates);
}
async function reload(user) {
  const userInternal = getModularInstance(user);
  await _reloadWithoutSaving(userInternal);
  await userInternal.auth._persistUserIfCurrent(userInternal);
  userInternal.auth._notifyListenersIfCurrent(userInternal);
}
function mergeProviderData(original, newData) {
  const deduped = original.filter((o) => !newData.some((n) => n.providerId === o.providerId));
  return [...deduped, ...newData];
}
function extractProviderData(providers) {
  return providers.map(({ providerId, ...provider }) => {
    return {
      providerId,
      uid: provider.rawId || "",
      displayName: provider.displayName || null,
      email: provider.email || null,
      phoneNumber: provider.phoneNumber || null,
      photoURL: provider.photoUrl || null
    };
  });
}
async function requestStsToken(auth2, refreshToken) {
  const response = await _performFetchWithErrorHandling(auth2, {}, async () => {
    const body = querystring({
      "grant_type": "refresh_token",
      "refresh_token": refreshToken
    }).slice(1);
    const { tokenApiHost, apiKey } = auth2.config;
    const url = await _getFinalTarget(auth2, tokenApiHost, "/v1/token", `key=${apiKey}`);
    const headers = await auth2._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/x-www-form-urlencoded";
    const options = {
      method: "POST",
      headers,
      body
    };
    if (auth2.emulatorConfig && isCloudWorkstation(auth2.emulatorConfig.host)) {
      options.credentials = "include";
    }
    return FetchProvider.fetch()(url, options);
  });
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token
  };
}
async function revokeToken(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts:revokeToken", _addTidIfNecessary(auth2, request));
}
function assertStringOrUndefined(assertion, appName) {
  _assert(typeof assertion === "string" || typeof assertion === "undefined", "internal-error", { appName });
}
function _getInstance(cls) {
  debugAssert(cls instanceof Function, "Expected a class definition");
  let instance = instanceCache.get(cls);
  if (instance) {
    debugAssert(instance instanceof cls, "Instance stored in cache mismatched with class");
    return instance;
  }
  instance = new cls();
  instanceCache.set(cls, instance);
  return instance;
}
function _persistenceKeyName(key, apiKey, appName) {
  return `${"firebase"}:${key}:${apiKey}:${appName}`;
}
function _getBrowserName(userAgent) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("opera/") || ua.includes("opr/") || ua.includes("opios/")) {
    return "Opera";
  } else if (_isIEMobile(ua)) {
    return "IEMobile";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    return "IE";
  } else if (ua.includes("edge/")) {
    return "Edge";
  } else if (_isFirefox(ua)) {
    return "Firefox";
  } else if (ua.includes("silk/")) {
    return "Silk";
  } else if (_isBlackBerry(ua)) {
    return "Blackberry";
  } else if (_isWebOS(ua)) {
    return "Webos";
  } else if (_isSafari(ua)) {
    return "Safari";
  } else if ((ua.includes("chrome/") || _isChromeIOS(ua)) && !ua.includes("edge/")) {
    return "Chrome";
  } else if (_isAndroid(ua)) {
    return "Android";
  } else {
    const re = /([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/;
    const matches = userAgent.match(re);
    if (matches?.length === 2) {
      return matches[1];
    }
  }
  return "Other";
}
function _isFirefox(ua = getUA()) {
  return /firefox\//i.test(ua);
}
function _isSafari(userAgent = getUA()) {
  const ua = userAgent.toLowerCase();
  return ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/") && !ua.includes("android");
}
function _isChromeIOS(ua = getUA()) {
  return /crios\//i.test(ua);
}
function _isIEMobile(ua = getUA()) {
  return /iemobile/i.test(ua);
}
function _isAndroid(ua = getUA()) {
  return /android/i.test(ua);
}
function _isBlackBerry(ua = getUA()) {
  return /blackberry/i.test(ua);
}
function _isWebOS(ua = getUA()) {
  return /webos/i.test(ua);
}
function _isIOS(ua = getUA()) {
  return /iphone|ipad|ipod/i.test(ua) || /macintosh/i.test(ua) && /mobile/i.test(ua);
}
function _isIOSStandalone(ua = getUA()) {
  return _isIOS(ua) && !!window.navigator?.standalone;
}
function _isIE10() {
  return isIE() && document.documentMode === 10;
}
function _isMobileBrowser(ua = getUA()) {
  return _isIOS(ua) || _isAndroid(ua) || _isWebOS(ua) || _isBlackBerry(ua) || /windows phone/i.test(ua) || _isIEMobile(ua);
}
function _getClientVersion(clientPlatform, frameworks = []) {
  let reportedPlatform;
  switch (clientPlatform) {
    case "Browser":
      reportedPlatform = _getBrowserName(getUA());
      break;
    case "Worker":
      reportedPlatform = `${_getBrowserName(getUA())}-${clientPlatform}`;
      break;
    default:
      reportedPlatform = clientPlatform;
  }
  const reportedFrameworks = frameworks.length ? frameworks.join(",") : "FirebaseCore-web";
  return `${reportedPlatform}/${"JsCore"}/${SDK_VERSION}/${reportedFrameworks}`;
}
async function _getPasswordPolicy(auth2, request = {}) {
  return _performApiRequest(auth2, "GET", "/v2/passwordPolicy", _addTidIfNecessary(auth2, request));
}
function _castAuth(auth2) {
  return getModularInstance(auth2);
}
function _setExternalJSProvider(p) {
  externalJSProvider = p;
}
function _loadJS(url) {
  return externalJSProvider.loadJS(url);
}
function _recaptchaV2ScriptUrl() {
  return externalJSProvider.recaptchaV2Script;
}
function _recaptchaEnterpriseScriptUrl() {
  return externalJSProvider.recaptchaEnterpriseScript;
}
function _gapiScriptUrl() {
  return externalJSProvider.gapiScript;
}
function _generateCallbackName(prefix) {
  return `__${prefix}${Math.floor(Math.random() * 1e6)}`;
}
function generateRandomAlphaNumericString(len) {
  const chars = [];
  const allowedChars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < len; i++) {
    chars.push(allowedChars.charAt(Math.floor(Math.random() * allowedChars.length)));
  }
  return chars.join("");
}
async function injectRecaptchaFields(auth2, request, action, isCaptchaResp = false, isFakeToken = false) {
  const verifier = new RecaptchaEnterpriseVerifier(auth2);
  let captchaResponse;
  if (isFakeToken) {
    captchaResponse = FAKE_TOKEN;
  } else {
    try {
      captchaResponse = await verifier.verify(action);
    } catch (error) {
      captchaResponse = await verifier.verify(action, true);
    }
  }
  const newRequest = { ...request };
  if (action === "mfaSmsEnrollment" || action === "mfaSmsSignIn") {
    if ("phoneEnrollmentInfo" in newRequest) {
      const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
      const recaptchaToken = newRequest.phoneEnrollmentInfo.recaptchaToken;
      Object.assign(newRequest, {
        "phoneEnrollmentInfo": {
          phoneNumber,
          recaptchaToken,
          captchaResponse,
          "clientType": "CLIENT_TYPE_WEB",
          "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }
      });
    } else if ("phoneSignInInfo" in newRequest) {
      const recaptchaToken = newRequest.phoneSignInInfo.recaptchaToken;
      Object.assign(newRequest, {
        "phoneSignInInfo": {
          recaptchaToken,
          captchaResponse,
          "clientType": "CLIENT_TYPE_WEB",
          "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }
      });
    }
    return newRequest;
  }
  if (!isCaptchaResp) {
    Object.assign(newRequest, { captchaResponse });
  } else {
    Object.assign(newRequest, { "captchaResp": captchaResponse });
  }
  Object.assign(newRequest, {
    "clientType": "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  });
  Object.assign(newRequest, {
    "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
    /* RecaptchaVersion.ENTERPRISE */
  });
  return newRequest;
}
async function handleRecaptchaFlow(authInstance, request, actionName, actionMethod, recaptchaAuthProvider) {
  if (recaptchaAuthProvider === "EMAIL_PASSWORD_PROVIDER") {
    if (authInstance._getRecaptchaConfig()?.isProviderEnabled(
      "EMAIL_PASSWORD_PROVIDER"
      /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
    )) {
      const requestWithRecaptcha = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        actionName === "getOobCode"
        /* RecaptchaActionName.GET_OOB_CODE */
      );
      return actionMethod(authInstance, requestWithRecaptcha);
    } else {
      return actionMethod(authInstance, request).catch(async (error) => {
        if (error.code === `auth/${"missing-recaptcha-token"}`) {
          console.log(`${actionName} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);
          const requestWithRecaptcha = await injectRecaptchaFields(
            authInstance,
            request,
            actionName,
            actionName === "getOobCode"
            /* RecaptchaActionName.GET_OOB_CODE */
          );
          return actionMethod(authInstance, requestWithRecaptcha);
        } else {
          return Promise.reject(error);
        }
      });
    }
  } else if (recaptchaAuthProvider === "PHONE_PROVIDER") {
    if (authInstance._getRecaptchaConfig()?.isProviderEnabled(
      "PHONE_PROVIDER"
      /* RecaptchaAuthProvider.PHONE_PROVIDER */
    )) {
      const requestWithRecaptcha = await injectRecaptchaFields(authInstance, request, actionName);
      return actionMethod(authInstance, requestWithRecaptcha).catch(async (error) => {
        if (authInstance._getRecaptchaConfig()?.getProviderEnforcementState(
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        ) === "AUDIT") {
          if (error.code === `auth/${"missing-recaptcha-token"}` || error.code === `auth/${"invalid-app-credential"}`) {
            console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${actionName} flow.`);
            const requestWithRecaptchaFields = await injectRecaptchaFields(
              authInstance,
              request,
              actionName,
              false,
              // isCaptchaResp
              true
              // isFakeToken
            );
            return actionMethod(authInstance, requestWithRecaptchaFields);
          }
        }
        return Promise.reject(error);
      });
    } else {
      const requestWithRecaptchaFields = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        false,
        // isCaptchaResp
        true
        // isFakeToken
      );
      return actionMethod(authInstance, requestWithRecaptchaFields);
    }
  } else {
    return Promise.reject(recaptchaAuthProvider + " provider is not supported.");
  }
}
async function _initializeRecaptchaConfig(auth2) {
  const authInternal = _castAuth(auth2);
  const response = await getRecaptchaConfig(authInternal, {
    clientType: "CLIENT_TYPE_WEB",
    version: "RECAPTCHA_ENTERPRISE"
    /* RecaptchaVersion.ENTERPRISE */
  });
  const config = new RecaptchaConfig(response);
  if (authInternal.tenantId == null) {
    authInternal._agentRecaptchaConfig = config;
  } else {
    authInternal._tenantRecaptchaConfigs[authInternal.tenantId] = config;
  }
  if (config.isAnyProviderEnabled()) {
    const verifier = new RecaptchaEnterpriseVerifier(authInternal);
    void verifier.verify();
  }
}
function initializeAuth(app2, deps) {
  const provider = _getProvider(app2, "auth");
  if (provider.isInitialized()) {
    const auth3 = provider.getImmediate();
    const initialOptions = provider.getOptions();
    if (deepEqual(initialOptions, deps ?? {})) {
      return auth3;
    } else {
      _fail(
        auth3,
        "already-initialized"
        /* AuthErrorCode.ALREADY_INITIALIZED */
      );
    }
  }
  const auth2 = provider.initialize({ options: deps });
  return auth2;
}
function _initializeAuthInstance(auth2, deps) {
  const persistence = deps?.persistence || [];
  const hierarchy = (Array.isArray(persistence) ? persistence : [persistence]).map(_getInstance);
  if (deps?.errorMap) {
    auth2._updateErrorMap(deps.errorMap);
  }
  auth2._initializeWithPersistence(hierarchy, deps?.popupRedirectResolver);
}
function connectAuthEmulator(auth2, url, options) {
  const authInternal = _castAuth(auth2);
  _assert(
    /^https?:\/\//.test(url),
    authInternal,
    "invalid-emulator-scheme"
    /* AuthErrorCode.INVALID_EMULATOR_SCHEME */
  );
  const disableWarnings = !!options?.disableWarnings;
  const protocol = extractProtocol(url);
  const { host, port } = extractHostAndPort(url);
  const portStr = port === null ? "" : `:${port}`;
  const emulator = { url: `${protocol}//${host}${portStr}/` };
  const emulatorConfig = Object.freeze({
    host,
    port,
    protocol: protocol.replace(":", ""),
    options: Object.freeze({ disableWarnings })
  });
  if (!authInternal._canInitEmulator) {
    _assert(
      authInternal.config.emulator && authInternal.emulatorConfig,
      authInternal,
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    _assert(
      deepEqual(emulator, authInternal.config.emulator) && deepEqual(emulatorConfig, authInternal.emulatorConfig),
      authInternal,
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    return;
  }
  authInternal.config.emulator = emulator;
  authInternal.emulatorConfig = emulatorConfig;
  authInternal.settings.appVerificationDisabledForTesting = true;
  if (isCloudWorkstation(host)) {
    void pingServer(`${protocol}//${host}${portStr}`);
  } else if (!disableWarnings) {
    emitEmulatorWarning();
  }
}
function extractProtocol(url) {
  const protocolEnd = url.indexOf(":");
  return protocolEnd < 0 ? "" : url.substr(0, protocolEnd + 1);
}
function extractHostAndPort(url) {
  const protocol = extractProtocol(url);
  const authority = /(\/\/)?([^?#/]+)/.exec(url.substr(protocol.length));
  if (!authority) {
    return { host: "", port: null };
  }
  const hostAndPort = authority[2].split("@").pop() || "";
  const bracketedIPv6 = /^(\[[^\]]+\])(:|$)/.exec(hostAndPort);
  if (bracketedIPv6) {
    const host = bracketedIPv6[1];
    return { host, port: parsePort(hostAndPort.substr(host.length + 1)) };
  } else {
    const [host, port] = hostAndPort.split(":");
    return { host, port: parsePort(port) };
  }
}
function parsePort(portStr) {
  if (!portStr) {
    return null;
  }
  const port = Number(portStr);
  if (isNaN(port)) {
    return null;
  }
  return port;
}
function emitEmulatorWarning() {
  function attachBanner() {
    const el = document.createElement("p");
    const sty = el.style;
    el.innerText = "Running in emulator mode. Do not use with production credentials.";
    sty.position = "fixed";
    sty.width = "100%";
    sty.backgroundColor = "#ffffff";
    sty.border = ".1em solid #000000";
    sty.color = "#b50000";
    sty.bottom = "0px";
    sty.left = "0px";
    sty.margin = "0px";
    sty.zIndex = "10000";
    sty.textAlign = "center";
    el.classList.add("firebase-emulator-warning");
    document.body.appendChild(el);
  }
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.");
  }
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", attachBanner);
    } else {
      attachBanner();
    }
  }
}
async function resetPassword(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:resetPassword", _addTidIfNecessary(auth2, request));
}
async function updateEmailPassword(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:update", request);
}
async function linkEmailPassword(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:signUp", request);
}
async function applyActionCode$1(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:update", _addTidIfNecessary(auth2, request));
}
async function signInWithPassword(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithPassword", _addTidIfNecessary(auth2, request));
}
async function sendOobCode(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:sendOobCode", _addTidIfNecessary(auth2, request));
}
async function sendEmailVerification$1(auth2, request) {
  return sendOobCode(auth2, request);
}
async function sendPasswordResetEmail$1(auth2, request) {
  return sendOobCode(auth2, request);
}
async function sendSignInLinkToEmail$1(auth2, request) {
  return sendOobCode(auth2, request);
}
async function verifyAndChangeEmail(auth2, request) {
  return sendOobCode(auth2, request);
}
async function signInWithEmailLink$1(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth2, request));
}
async function signInWithEmailLinkForLinking(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth2, request));
}
async function signInWithIdp(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithIdp", _addTidIfNecessary(auth2, request));
}
async function sendPhoneVerificationCode(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:sendVerificationCode", _addTidIfNecessary(auth2, request));
}
async function signInWithPhoneNumber$1(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth2, request));
}
async function linkWithPhoneNumber$1(auth2, request) {
  const response = await _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth2, request));
  if (response.temporaryProof) {
    throw _makeTaggedError(auth2, "account-exists-with-different-credential", response);
  }
  return response;
}
async function verifyPhoneNumberForExisting(auth2, request) {
  const apiRequest = {
    ...request,
    operation: "REAUTH"
  };
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth2, apiRequest), VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_);
}
function parseMode(mode) {
  switch (mode) {
    case "recoverEmail":
      return "RECOVER_EMAIL";
    case "resetPassword":
      return "PASSWORD_RESET";
    case "signIn":
      return "EMAIL_SIGNIN";
    case "verifyEmail":
      return "VERIFY_EMAIL";
    case "verifyAndChangeEmail":
      return "VERIFY_AND_CHANGE_EMAIL";
    case "revertSecondFactorAddition":
      return "REVERT_SECOND_FACTOR_ADDITION";
    default:
      return null;
  }
}
function parseDeepLink(url) {
  const link = querystringDecode(extractQuerystring(url))["link"];
  const doubleDeepLink = link ? querystringDecode(extractQuerystring(link))["deep_link_id"] : null;
  const iOSDeepLink = querystringDecode(extractQuerystring(url))["deep_link_id"];
  const iOSDoubleDeepLink = iOSDeepLink ? querystringDecode(extractQuerystring(iOSDeepLink))["link"] : null;
  return iOSDoubleDeepLink || iOSDeepLink || doubleDeepLink || link || url;
}
async function signUp(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signUp", _addTidIfNecessary(auth2, request));
}
function providerIdForResponse(response) {
  if (response.providerId) {
    return response.providerId;
  }
  if ("phoneNumber" in response) {
    return "phone";
  }
  return null;
}
async function signInAnonymously(auth2) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authInternal = _castAuth(auth2);
  await authInternal._initializationPromise;
  if (authInternal.currentUser?.isAnonymous) {
    return new UserCredentialImpl({
      user: authInternal.currentUser,
      providerId: null,
      operationType: "signIn"
      /* OperationType.SIGN_IN */
    });
  }
  const response = await signUp(authInternal, {
    returnSecureToken: true
  });
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response, true);
  await authInternal._updateCurrentUser(userCredential.user);
  return userCredential;
}
function _processCredentialSavingMfaContextIfNecessary(auth2, operationType, credential, user) {
  const idTokenProvider = operationType === "reauthenticate" ? credential._getReauthenticationResolver(auth2) : credential._getIdTokenResponse(auth2);
  return idTokenProvider.catch((error) => {
    if (error.code === `auth/${"multi-factor-auth-required"}`) {
      throw MultiFactorError._fromErrorAndOperation(auth2, error, operationType, user);
    }
    throw error;
  });
}
function providerDataAsNames(providerData) {
  return new Set(providerData.map(({ providerId }) => providerId).filter((pid) => !!pid));
}
async function unlink(user, providerId) {
  const userInternal = getModularInstance(user);
  await _assertLinkedStatus(true, userInternal, providerId);
  const { providerUserInfo } = await deleteLinkedAccounts(userInternal.auth, {
    idToken: await userInternal.getIdToken(),
    deleteProvider: [providerId]
  });
  const providersLeft = providerDataAsNames(providerUserInfo || []);
  userInternal.providerData = userInternal.providerData.filter((pd) => providersLeft.has(pd.providerId));
  if (!providersLeft.has(
    "phone"
    /* ProviderId.PHONE */
  )) {
    userInternal.phoneNumber = null;
  }
  await userInternal.auth._persistUserIfCurrent(userInternal);
  return userInternal;
}
async function _link$1(user, credential, bypassAuthState = false) {
  const response = await _logoutIfInvalidated(user, credential._linkToIdToken(user.auth, await user.getIdToken()), bypassAuthState);
  return UserCredentialImpl._forOperation(user, "link", response);
}
async function _assertLinkedStatus(expected, user, provider) {
  await _reloadWithoutSaving(user);
  const providerIds = providerDataAsNames(user.providerData);
  const code = expected === false ? "provider-already-linked" : "no-such-provider";
  _assert(providerIds.has(provider) === expected, user.auth, code);
}
async function _reauthenticate(user, credential, bypassAuthState = false) {
  const { auth: auth2 } = user;
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const operationType = "reauthenticate";
  try {
    const response = await _logoutIfInvalidated(user, _processCredentialSavingMfaContextIfNecessary(auth2, operationType, credential, user), bypassAuthState);
    _assert(
      response.idToken,
      auth2,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const parsed = _parseToken(response.idToken);
    _assert(
      parsed,
      auth2,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const { sub: localId } = parsed;
    _assert(
      user.uid === localId,
      auth2,
      "user-mismatch"
      /* AuthErrorCode.USER_MISMATCH */
    );
    return UserCredentialImpl._forOperation(user, operationType, response);
  } catch (e) {
    if (e?.code === `auth/${"user-not-found"}`) {
      _fail(
        auth2,
        "user-mismatch"
        /* AuthErrorCode.USER_MISMATCH */
      );
    }
    throw e;
  }
}
async function _signInWithCredential(auth2, credential, bypassAuthState = false) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const operationType = "signIn";
  const response = await _processCredentialSavingMfaContextIfNecessary(auth2, operationType, credential);
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(auth2, operationType, response);
  if (!bypassAuthState) {
    await auth2._updateCurrentUser(userCredential.user);
  }
  return userCredential;
}
async function signInWithCredential(auth2, credential) {
  return _signInWithCredential(_castAuth(auth2), credential);
}
async function linkWithCredential(user, credential) {
  const userInternal = getModularInstance(user);
  await _assertLinkedStatus(false, userInternal, credential.providerId);
  return _link$1(userInternal, credential);
}
async function signInWithCustomToken$1(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithCustomToken", _addTidIfNecessary(auth2, request));
}
async function signInWithCustomToken(auth2, customToken) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authInternal = _castAuth(auth2);
  const response = await signInWithCustomToken$1(authInternal, {
    token: customToken,
    returnSecureToken: true
  });
  const cred = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response);
  await authInternal._updateCurrentUser(cred.user);
  return cred;
}
function _setActionCodeSettingsOnRequest(auth2, request, actionCodeSettings) {
  _assert(
    actionCodeSettings.url?.length > 0,
    auth2,
    "invalid-continue-uri"
    /* AuthErrorCode.INVALID_CONTINUE_URI */
  );
  _assert(
    typeof actionCodeSettings.dynamicLinkDomain === "undefined" || actionCodeSettings.dynamicLinkDomain.length > 0,
    auth2,
    "invalid-dynamic-link-domain"
    /* AuthErrorCode.INVALID_DYNAMIC_LINK_DOMAIN */
  );
  _assert(
    typeof actionCodeSettings.linkDomain === "undefined" || actionCodeSettings.linkDomain.length > 0,
    auth2,
    "invalid-hosting-link-domain"
    /* AuthErrorCode.INVALID_HOSTING_LINK_DOMAIN */
  );
  request.continueUrl = actionCodeSettings.url;
  request.dynamicLinkDomain = actionCodeSettings.dynamicLinkDomain;
  request.linkDomain = actionCodeSettings.linkDomain;
  request.canHandleCodeInApp = actionCodeSettings.handleCodeInApp;
  if (actionCodeSettings.iOS) {
    _assert(
      actionCodeSettings.iOS.bundleId.length > 0,
      auth2,
      "missing-ios-bundle-id"
      /* AuthErrorCode.MISSING_IOS_BUNDLE_ID */
    );
    request.iOSBundleId = actionCodeSettings.iOS.bundleId;
  }
  if (actionCodeSettings.android) {
    _assert(
      actionCodeSettings.android.packageName.length > 0,
      auth2,
      "missing-android-pkg-name"
      /* AuthErrorCode.MISSING_ANDROID_PACKAGE_NAME */
    );
    request.androidInstallApp = actionCodeSettings.android.installApp;
    request.androidMinimumVersionCode = actionCodeSettings.android.minimumVersion;
    request.androidPackageName = actionCodeSettings.android.packageName;
  }
}
async function recachePasswordPolicy(auth2) {
  const authInternal = _castAuth(auth2);
  if (authInternal._getPasswordPolicyInternal()) {
    await authInternal._updatePasswordPolicy();
  }
}
async function sendPasswordResetEmail(auth2, email, actionCodeSettings) {
  const authInternal = _castAuth(auth2);
  const request = {
    requestType: "PASSWORD_RESET",
    email,
    clientType: "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  };
  if (actionCodeSettings) {
    _setActionCodeSettingsOnRequest(authInternal, request, actionCodeSettings);
  }
  await handleRecaptchaFlow(
    authInternal,
    request,
    "getOobCode",
    sendPasswordResetEmail$1,
    "EMAIL_PASSWORD_PROVIDER"
    /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
  );
}
async function confirmPasswordReset(auth2, oobCode, newPassword) {
  await resetPassword(getModularInstance(auth2), {
    oobCode,
    newPassword
  }).catch(async (error) => {
    if (error.code === `auth/${"password-does-not-meet-requirements"}`) {
      void recachePasswordPolicy(auth2);
    }
    throw error;
  });
}
async function applyActionCode(auth2, oobCode) {
  await applyActionCode$1(getModularInstance(auth2), { oobCode });
}
async function createUserWithEmailAndPassword(auth2, email, password) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authInternal = _castAuth(auth2);
  const request = {
    returnSecureToken: true,
    email,
    password,
    clientType: "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  };
  const signUpResponse = handleRecaptchaFlow(
    authInternal,
    request,
    "signUpPassword",
    signUp,
    "EMAIL_PASSWORD_PROVIDER"
    /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
  );
  const response = await signUpResponse.catch((error) => {
    if (error.code === `auth/${"password-does-not-meet-requirements"}`) {
      void recachePasswordPolicy(auth2);
    }
    throw error;
  });
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response);
  await authInternal._updateCurrentUser(userCredential.user);
  return userCredential;
}
function signInWithEmailAndPassword(auth2, email, password) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  return signInWithCredential(getModularInstance(auth2), EmailAuthProvider.credential(email, password)).catch(async (error) => {
    if (error.code === `auth/${"password-does-not-meet-requirements"}`) {
      void recachePasswordPolicy(auth2);
    }
    throw error;
  });
}
async function sendSignInLinkToEmail(auth2, email, actionCodeSettings) {
  const authInternal = _castAuth(auth2);
  const request = {
    requestType: "EMAIL_SIGNIN",
    email,
    clientType: "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  };
  function setActionCodeSettings(request2, actionCodeSettings2) {
    _assert(
      actionCodeSettings2.handleCodeInApp,
      authInternal,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    if (actionCodeSettings2) {
      _setActionCodeSettingsOnRequest(authInternal, request2, actionCodeSettings2);
    }
  }
  setActionCodeSettings(request, actionCodeSettings);
  await handleRecaptchaFlow(
    authInternal,
    request,
    "getOobCode",
    sendSignInLinkToEmail$1,
    "EMAIL_PASSWORD_PROVIDER"
    /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
  );
}
function isSignInWithEmailLink(auth2, emailLink) {
  const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
  return actionCodeUrl?.operation === "EMAIL_SIGNIN";
}
async function signInWithEmailLink(auth2, email, emailLink) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authModular = getModularInstance(auth2);
  const credential = EmailAuthProvider.credentialWithLink(email, emailLink || _getCurrentUrl());
  _assert(
    credential._tenantId === (authModular.tenantId || null),
    authModular,
    "tenant-id-mismatch"
    /* AuthErrorCode.TENANT_ID_MISMATCH */
  );
  return signInWithCredential(authModular, credential);
}
async function createAuthUri(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:createAuthUri", _addTidIfNecessary(auth2, request));
}
async function fetchSignInMethodsForEmail(auth2, email) {
  const continueUri = _isHttpOrHttps() ? _getCurrentUrl() : "http://localhost";
  const request = {
    identifier: email,
    continueUri
  };
  const { signinMethods } = await createAuthUri(getModularInstance(auth2), request);
  return signinMethods || [];
}
async function sendEmailVerification(user, actionCodeSettings) {
  const userInternal = getModularInstance(user);
  const idToken = await user.getIdToken();
  const request = {
    requestType: "VERIFY_EMAIL",
    idToken
  };
  if (actionCodeSettings) {
    _setActionCodeSettingsOnRequest(userInternal.auth, request, actionCodeSettings);
  }
  const { email } = await sendEmailVerification$1(userInternal.auth, request);
  if (email !== user.email) {
    await user.reload();
  }
}
async function verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings) {
  const userInternal = getModularInstance(user);
  const idToken = await user.getIdToken();
  const request = {
    requestType: "VERIFY_AND_CHANGE_EMAIL",
    idToken,
    newEmail
  };
  if (actionCodeSettings) {
    _setActionCodeSettingsOnRequest(userInternal.auth, request, actionCodeSettings);
  }
  const { email } = await verifyAndChangeEmail(userInternal.auth, request);
  if (email !== user.email) {
    await user.reload();
  }
}
async function updateProfile$1(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:update", request);
}
async function updateProfile(user, profile) {
  const { displayName, photoURL: photoUrl } = profile;
  if (displayName === void 0 && photoUrl === void 0) {
    return;
  }
  const userInternal = getModularInstance(user);
  const idToken = await userInternal.getIdToken();
  const profileRequest = {
    idToken,
    displayName,
    photoUrl,
    returnSecureToken: true
  };
  const response = await _logoutIfInvalidated(userInternal, updateProfile$1(userInternal.auth, profileRequest));
  userInternal.displayName = response.displayName || null;
  userInternal.photoURL = response.photoUrl || null;
  const passwordProvider = userInternal.providerData.find(
    ({ providerId }) => providerId === "password"
    /* ProviderId.PASSWORD */
  );
  if (passwordProvider) {
    passwordProvider.displayName = userInternal.displayName;
    passwordProvider.photoURL = userInternal.photoURL;
  }
  await userInternal._updateTokensIfNecessary(response);
}
function updateEmail(user, newEmail) {
  const userInternal = getModularInstance(user);
  if (_isFirebaseServerApp(userInternal.auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(userInternal.auth));
  }
  return updateEmailOrPassword(userInternal, newEmail, null);
}
function updatePassword(user, newPassword) {
  return updateEmailOrPassword(getModularInstance(user), null, newPassword);
}
async function updateEmailOrPassword(user, email, password) {
  const { auth: auth2 } = user;
  const idToken = await user.getIdToken();
  const request = {
    idToken,
    returnSecureToken: true
  };
  if (email) {
    request.email = email;
  }
  if (password) {
    request.password = password;
  }
  const response = await _logoutIfInvalidated(user, updateEmailPassword(auth2, request));
  await user._updateTokensIfNecessary(
    response,
    /* reload */
    true
  );
}
function _fromIdTokenResponse(idTokenResponse) {
  if (!idTokenResponse) {
    return null;
  }
  const { providerId } = idTokenResponse;
  const profile = idTokenResponse.rawUserInfo ? JSON.parse(idTokenResponse.rawUserInfo) : {};
  const isNewUser = idTokenResponse.isNewUser || idTokenResponse.kind === "identitytoolkit#SignupNewUserResponse";
  if (!providerId && idTokenResponse?.idToken) {
    const signInProvider = _parseToken(idTokenResponse.idToken)?.firebase?.["sign_in_provider"];
    if (signInProvider) {
      const filteredProviderId = signInProvider !== "anonymous" && signInProvider !== "custom" ? signInProvider : null;
      return new GenericAdditionalUserInfo(isNewUser, filteredProviderId);
    }
  }
  if (!providerId) {
    return null;
  }
  switch (providerId) {
    case "facebook.com":
      return new FacebookAdditionalUserInfo(isNewUser, profile);
    case "github.com":
      return new GithubAdditionalUserInfo(isNewUser, profile);
    case "google.com":
      return new GoogleAdditionalUserInfo(isNewUser, profile);
    case "twitter.com":
      return new TwitterAdditionalUserInfo(isNewUser, profile, idTokenResponse.screenName || null);
    case "custom":
    case "anonymous":
      return new GenericAdditionalUserInfo(isNewUser, null);
    default:
      return new GenericAdditionalUserInfo(isNewUser, providerId, profile);
  }
}
function getAdditionalUserInfo(userCredential) {
  const { user, _tokenResponse } = userCredential;
  if (user.isAnonymous && !_tokenResponse) {
    return {
      providerId: null,
      isNewUser: false,
      profile: null
    };
  }
  return _fromIdTokenResponse(_tokenResponse);
}
function setPersistence(auth2, persistence) {
  return getModularInstance(auth2).setPersistence(persistence);
}
function onIdTokenChanged(auth2, nextOrObserver, error, completed) {
  return getModularInstance(auth2).onIdTokenChanged(nextOrObserver, error, completed);
}
function beforeAuthStateChanged(auth2, callback, onAbort) {
  return getModularInstance(auth2).beforeAuthStateChanged(callback, onAbort);
}
function revokeAccessToken(auth2, token) {
  const authInternal = _castAuth(auth2);
  return authInternal.revokeAccessToken(token);
}
async function deleteUser(user) {
  return getModularInstance(user).delete();
}
function startEnrollPhoneMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaEnrollment:start", _addTidIfNecessary(auth2, request));
}
function finalizeEnrollPhoneMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaEnrollment:finalize", _addTidIfNecessary(auth2, request));
}
function startEnrollTotpMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaEnrollment:start", _addTidIfNecessary(auth2, request));
}
function finalizeEnrollTotpMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaEnrollment:finalize", _addTidIfNecessary(auth2, request));
}
function getDocumentCookie(name3) {
  const escapedName = name3.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  const matcher = RegExp(`${escapedName}=([^;]+)`);
  return document.cookie.match(matcher)?.[1] ?? null;
}
function getCookieName(key) {
  const isDevMode = window.location.protocol === "http:";
  return `${isDevMode ? "__dev_" : "__HOST-"}FIREBASE_${key.split(":")[3]}`;
}
function _allSettled(promises) {
  return Promise.all(promises.map(async (promise) => {
    try {
      const value = await promise;
      return {
        fulfilled: true,
        value
      };
    } catch (reason) {
      return {
        fulfilled: false,
        reason
      };
    }
  }));
}
function _generateEventId(prefix = "", digits = 10) {
  let random = "";
  for (let i = 0; i < digits; i++) {
    random += Math.floor(Math.random() * 10);
  }
  return prefix + random;
}
function _window() {
  return window;
}
function _setWindowLocation(url) {
  _window().location.href = url;
}
function _isWorker() {
  return typeof _window()["WorkerGlobalScope"] !== "undefined" && typeof _window()["importScripts"] === "function";
}
async function _getActiveServiceWorker() {
  if (!navigator?.serviceWorker) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.active;
  } catch {
    return null;
  }
}
function _getServiceWorkerController() {
  return navigator?.serviceWorker?.controller || null;
}
function _getWorkerGlobalScope() {
  return _isWorker() ? self : null;
}
function getObjectStore(db2, isReadWrite) {
  return db2.transaction([DB_OBJECTSTORE_NAME], isReadWrite ? "readwrite" : "readonly").objectStore(DB_OBJECTSTORE_NAME);
}
function _deleteDatabase() {
  const request = indexedDB.deleteDatabase(DB_NAME2);
  return new DBPromise(request).toPromise();
}
function _openDatabase() {
  const request = indexedDB.open(DB_NAME2, DB_VERSION2);
  return new Promise((resolve, reject) => {
    request.addEventListener("error", () => {
      reject(request.error);
    });
    request.addEventListener("upgradeneeded", () => {
      const db2 = request.result;
      try {
        db2.createObjectStore(DB_OBJECTSTORE_NAME, { keyPath: DB_DATA_KEYPATH });
      } catch (e) {
        reject(e);
      }
    });
    request.addEventListener("success", async () => {
      const db2 = request.result;
      if (!db2.objectStoreNames.contains(DB_OBJECTSTORE_NAME)) {
        db2.close();
        await _deleteDatabase();
        resolve(await _openDatabase());
      } else {
        resolve(db2);
      }
    });
  });
}
async function _putObject(db2, key, value) {
  const request = getObjectStore(db2, true).put({
    [DB_DATA_KEYPATH]: key,
    value
  });
  return new DBPromise(request).toPromise();
}
async function getObject(db2, key) {
  const request = getObjectStore(db2, false).get(key);
  const data = await new DBPromise(request).toPromise();
  return data === void 0 ? null : data.value;
}
function _deleteObject(db2, key) {
  const request = getObjectStore(db2, true).delete(key);
  return new DBPromise(request).toPromise();
}
function startSignInPhoneMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaSignIn:start", _addTidIfNecessary(auth2, request));
}
function finalizeSignInPhoneMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaSignIn:finalize", _addTidIfNecessary(auth2, request));
}
function finalizeSignInTotpMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaSignIn:finalize", _addTidIfNecessary(auth2, request));
}
function isHostLanguageValid(hl) {
  return hl.length <= 6 && /^\s*[a-zA-Z0-9\-]*\s*$/.test(hl);
}
function domReady() {
  let resolver = null;
  return new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }
    resolver = () => resolve();
    window.addEventListener("load", resolver);
  }).catch((e) => {
    if (resolver) {
      window.removeEventListener("load", resolver);
    }
    throw e;
  });
}
async function signInWithPhoneNumber(auth2, phoneNumber, appVerifier) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authInternal = _castAuth(auth2);
  const verificationId = await _verifyPhoneNumber(authInternal, phoneNumber, getModularInstance(appVerifier));
  return new ConfirmationResultImpl(verificationId, (cred) => signInWithCredential(authInternal, cred));
}
async function linkWithPhoneNumber(user, phoneNumber, appVerifier) {
  const userInternal = getModularInstance(user);
  await _assertLinkedStatus(
    false,
    userInternal,
    "phone"
    /* ProviderId.PHONE */
  );
  const verificationId = await _verifyPhoneNumber(userInternal.auth, phoneNumber, getModularInstance(appVerifier));
  return new ConfirmationResultImpl(verificationId, (cred) => linkWithCredential(userInternal, cred));
}
async function _verifyPhoneNumber(auth2, options, verifier) {
  if (!auth2._getRecaptchaConfig()) {
    try {
      await _initializeRecaptchaConfig(auth2);
    } catch (error) {
      console.log("Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.");
    }
  }
  try {
    let phoneInfoOptions;
    if (typeof options === "string") {
      phoneInfoOptions = {
        phoneNumber: options
      };
    } else {
      phoneInfoOptions = options;
    }
    if ("session" in phoneInfoOptions) {
      const session = phoneInfoOptions.session;
      if ("phoneNumber" in phoneInfoOptions) {
        _assert(
          session.type === "enroll",
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const startPhoneMfaEnrollmentRequest = {
          idToken: session.credential,
          phoneEnrollmentInfo: {
            phoneNumber: phoneInfoOptions.phoneNumber,
            clientType: "CLIENT_TYPE_WEB"
            /* RecaptchaClientType.WEB */
          }
        };
        const startEnrollPhoneMfaActionCallback = async (authInstance, request) => {
          if (request.phoneEnrollmentInfo.captchaResponse === FAKE_TOKEN) {
            _assert(
              verifier?.type === RECAPTCHA_VERIFIER_TYPE,
              authInstance,
              "argument-error"
              /* AuthErrorCode.ARGUMENT_ERROR */
            );
            const requestWithRecaptchaV2 = await injectRecaptchaV2Token(authInstance, request, verifier);
            return startEnrollPhoneMfa(authInstance, requestWithRecaptchaV2);
          }
          return startEnrollPhoneMfa(authInstance, request);
        };
        const startPhoneMfaEnrollmentResponse = handleRecaptchaFlow(
          auth2,
          startPhoneMfaEnrollmentRequest,
          "mfaSmsEnrollment",
          startEnrollPhoneMfaActionCallback,
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        );
        const response = await startPhoneMfaEnrollmentResponse.catch((error) => {
          return Promise.reject(error);
        });
        return response.phoneSessionInfo.sessionInfo;
      } else {
        _assert(
          session.type === "signin",
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const mfaEnrollmentId = phoneInfoOptions.multiFactorHint?.uid || phoneInfoOptions.multiFactorUid;
        _assert(
          mfaEnrollmentId,
          auth2,
          "missing-multi-factor-info"
          /* AuthErrorCode.MISSING_MFA_INFO */
        );
        const startPhoneMfaSignInRequest = {
          mfaPendingCredential: session.credential,
          mfaEnrollmentId,
          phoneSignInInfo: {
            clientType: "CLIENT_TYPE_WEB"
            /* RecaptchaClientType.WEB */
          }
        };
        const startSignInPhoneMfaActionCallback = async (authInstance, request) => {
          if (request.phoneSignInInfo.captchaResponse === FAKE_TOKEN) {
            _assert(
              verifier?.type === RECAPTCHA_VERIFIER_TYPE,
              authInstance,
              "argument-error"
              /* AuthErrorCode.ARGUMENT_ERROR */
            );
            const requestWithRecaptchaV2 = await injectRecaptchaV2Token(authInstance, request, verifier);
            return startSignInPhoneMfa(authInstance, requestWithRecaptchaV2);
          }
          return startSignInPhoneMfa(authInstance, request);
        };
        const startPhoneMfaSignInResponse = handleRecaptchaFlow(
          auth2,
          startPhoneMfaSignInRequest,
          "mfaSmsSignIn",
          startSignInPhoneMfaActionCallback,
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        );
        const response = await startPhoneMfaSignInResponse.catch((error) => {
          return Promise.reject(error);
        });
        return response.phoneResponseInfo.sessionInfo;
      }
    } else {
      const sendPhoneVerificationCodeRequest = {
        phoneNumber: phoneInfoOptions.phoneNumber,
        clientType: "CLIENT_TYPE_WEB"
        /* RecaptchaClientType.WEB */
      };
      const sendPhoneVerificationCodeActionCallback = async (authInstance, request) => {
        if (request.captchaResponse === FAKE_TOKEN) {
          _assert(
            verifier?.type === RECAPTCHA_VERIFIER_TYPE,
            authInstance,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          const requestWithRecaptchaV2 = await injectRecaptchaV2Token(authInstance, request, verifier);
          return sendPhoneVerificationCode(authInstance, requestWithRecaptchaV2);
        }
        return sendPhoneVerificationCode(authInstance, request);
      };
      const sendPhoneVerificationCodeResponse = handleRecaptchaFlow(
        auth2,
        sendPhoneVerificationCodeRequest,
        "sendVerificationCode",
        sendPhoneVerificationCodeActionCallback,
        "PHONE_PROVIDER"
        /* RecaptchaAuthProvider.PHONE_PROVIDER */
      );
      const response = await sendPhoneVerificationCodeResponse.catch((error) => {
        return Promise.reject(error);
      });
      return response.sessionInfo;
    }
  } finally {
    verifier?._reset();
  }
}
async function injectRecaptchaV2Token(auth2, request, recaptchaV2Verifier) {
  _assert(
    recaptchaV2Verifier.type === RECAPTCHA_VERIFIER_TYPE,
    auth2,
    "argument-error"
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  const recaptchaV2Token = await recaptchaV2Verifier.verify();
  _assert(
    typeof recaptchaV2Token === "string",
    auth2,
    "argument-error"
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  const newRequest = { ...request };
  if ("phoneEnrollmentInfo" in newRequest) {
    const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
    const captchaResponse = newRequest.phoneEnrollmentInfo.captchaResponse;
    const clientType = newRequest.phoneEnrollmentInfo.clientType;
    const recaptchaVersion = newRequest.phoneEnrollmentInfo.recaptchaVersion;
    Object.assign(newRequest, {
      "phoneEnrollmentInfo": {
        phoneNumber,
        recaptchaToken: recaptchaV2Token,
        captchaResponse,
        clientType,
        recaptchaVersion
      }
    });
    return newRequest;
  } else if ("phoneSignInInfo" in newRequest) {
    const captchaResponse = newRequest.phoneSignInInfo.captchaResponse;
    const clientType = newRequest.phoneSignInInfo.clientType;
    const recaptchaVersion = newRequest.phoneSignInInfo.recaptchaVersion;
    Object.assign(newRequest, {
      "phoneSignInInfo": {
        recaptchaToken: recaptchaV2Token,
        captchaResponse,
        clientType,
        recaptchaVersion
      }
    });
    return newRequest;
  } else {
    Object.assign(newRequest, { "recaptchaToken": recaptchaV2Token });
    return newRequest;
  }
}
function _withDefaultResolver(auth2, resolverOverride) {
  if (resolverOverride) {
    return _getInstance(resolverOverride);
  }
  _assert(
    auth2._popupRedirectResolver,
    auth2,
    "argument-error"
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  return auth2._popupRedirectResolver;
}
function _signIn(params) {
  return _signInWithCredential(params.auth, new IdpCredential(params), params.bypassAuthState);
}
function _reauth(params) {
  const { auth: auth2, user } = params;
  _assert(
    user,
    auth2,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return _reauthenticate(user, new IdpCredential(params), params.bypassAuthState);
}
async function _link(params) {
  const { auth: auth2, user } = params;
  _assert(
    user,
    auth2,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return _link$1(user, new IdpCredential(params), params.bypassAuthState);
}
async function signInWithPopup(auth2, provider, resolver) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_createError(
      auth2,
      "operation-not-supported-in-this-environment"
      /* AuthErrorCode.OPERATION_NOT_SUPPORTED */
    ));
  }
  const authInternal = _castAuth(auth2);
  _assertInstanceOf(auth2, provider, FederatedAuthProvider);
  const resolverInternal = _withDefaultResolver(authInternal, resolver);
  const action = new PopupOperation(authInternal, "signInViaPopup", provider, resolverInternal);
  return action.executeNotNull();
}
async function linkWithPopup(user, provider, resolver) {
  const userInternal = getModularInstance(user);
  _assertInstanceOf(userInternal.auth, provider, FederatedAuthProvider);
  const resolverInternal = _withDefaultResolver(userInternal.auth, resolver);
  const action = new PopupOperation(userInternal.auth, "linkViaPopup", provider, resolverInternal, userInternal);
  return action.executeNotNull();
}
async function _getAndClearPendingRedirectStatus(resolver, auth2) {
  const key = pendingRedirectKey(auth2);
  const persistence = resolverPersistence(resolver);
  if (!await persistence._isAvailable()) {
    return false;
  }
  const hasPendingRedirect = await persistence._get(key) === "true";
  await persistence._remove(key);
  return hasPendingRedirect;
}
async function _setPendingRedirectStatus(resolver, auth2) {
  return resolverPersistence(resolver)._set(pendingRedirectKey(auth2), "true");
}
function _overrideRedirectResult(auth2, result) {
  redirectOutcomeMap.set(auth2._key(), result);
}
function resolverPersistence(resolver) {
  return _getInstance(resolver._redirectPersistence);
}
function pendingRedirectKey(auth2) {
  return _persistenceKeyName(PENDING_REDIRECT_KEY, auth2.config.apiKey, auth2.name);
}
function signInWithRedirect(auth2, provider, resolver) {
  return _signInWithRedirect(auth2, provider, resolver);
}
async function _signInWithRedirect(auth2, provider, resolver) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authInternal = _castAuth(auth2);
  _assertInstanceOf(auth2, provider, FederatedAuthProvider);
  await authInternal._initializationPromise;
  const resolverInternal = _withDefaultResolver(authInternal, resolver);
  await _setPendingRedirectStatus(resolverInternal, authInternal);
  return resolverInternal._openRedirect(
    authInternal,
    provider,
    "signInViaRedirect"
    /* AuthEventType.SIGN_IN_VIA_REDIRECT */
  );
}
function linkWithRedirect(user, provider, resolver) {
  return _linkWithRedirect(user, provider, resolver);
}
async function _linkWithRedirect(user, provider, resolver) {
  const userInternal = getModularInstance(user);
  _assertInstanceOf(userInternal.auth, provider, FederatedAuthProvider);
  await userInternal.auth._initializationPromise;
  const resolverInternal = _withDefaultResolver(userInternal.auth, resolver);
  await _assertLinkedStatus(false, userInternal, provider.providerId);
  await _setPendingRedirectStatus(resolverInternal, userInternal.auth);
  const eventId = await prepareUserForRedirect(userInternal);
  return resolverInternal._openRedirect(userInternal.auth, provider, "linkViaRedirect", eventId);
}
async function getRedirectResult(auth2, resolver) {
  await _castAuth(auth2)._initializationPromise;
  return _getRedirectResult(auth2, resolver, false);
}
async function _getRedirectResult(auth2, resolverExtern, bypassAuthState = false) {
  if (_isFirebaseServerApp(auth2.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth2));
  }
  const authInternal = _castAuth(auth2);
  const resolver = _withDefaultResolver(authInternal, resolverExtern);
  const action = new RedirectAction(authInternal, resolver, bypassAuthState);
  const result = await action.execute();
  if (result && !bypassAuthState) {
    delete result.user._redirectEventId;
    await authInternal._persistUserIfCurrent(result.user);
    await authInternal._setRedirectUser(null, resolverExtern);
  }
  return result;
}
async function prepareUserForRedirect(user) {
  const eventId = _generateEventId(`${user.uid}:::`);
  user._redirectEventId = eventId;
  await user.auth._setRedirectUser(user);
  await user.auth._persistUserIfCurrent(user);
  return eventId;
}
function eventUid(e) {
  return [e.type, e.eventId, e.sessionId, e.tenantId].filter((v) => v).join("-");
}
function isNullRedirectEvent({ type, error }) {
  return type === "unknown" && error?.code === `auth/${"no-auth-event"}`;
}
function isRedirectEvent(event) {
  switch (event.type) {
    case "signInViaRedirect":
    case "linkViaRedirect":
    case "reauthViaRedirect":
      return true;
    case "unknown":
      return isNullRedirectEvent(event);
    default:
      return false;
  }
}
async function _getProjectConfig(auth2, request = {}) {
  return _performApiRequest(auth2, "GET", "/v1/projects", request);
}
async function _validateOrigin(auth2) {
  if (auth2.config.emulator) {
    return;
  }
  const { authorizedDomains } = await _getProjectConfig(auth2);
  for (const domain of authorizedDomains) {
    try {
      if (matchDomain(domain)) {
        return;
      }
    } catch {
    }
  }
  _fail(
    auth2,
    "unauthorized-domain"
    /* AuthErrorCode.INVALID_ORIGIN */
  );
}
function matchDomain(expected) {
  const currentUrl = _getCurrentUrl();
  const { protocol, hostname } = new URL(currentUrl);
  if (expected.startsWith("chrome-extension://")) {
    const ceUrl = new URL(expected);
    if (ceUrl.hostname === "" && hostname === "") {
      return protocol === "chrome-extension:" && expected.replace("chrome-extension://", "") === currentUrl.replace("chrome-extension://", "");
    }
    return protocol === "chrome-extension:" && ceUrl.hostname === hostname;
  }
  if (!HTTP_REGEX.test(protocol)) {
    return false;
  }
  if (IP_ADDRESS_REGEX.test(expected)) {
    return hostname === expected;
  }
  const escapedDomainPattern = expected.replace(/\./g, "\\.");
  const re = new RegExp("^(.+\\." + escapedDomainPattern + "|" + escapedDomainPattern + ")$", "i");
  return re.test(hostname);
}
function resetUnloadedGapiModules() {
  const beacon = _window().___jsl;
  if (beacon?.H) {
    for (const hint of Object.keys(beacon.H)) {
      beacon.H[hint].r = beacon.H[hint].r || [];
      beacon.H[hint].L = beacon.H[hint].L || [];
      beacon.H[hint].r = [...beacon.H[hint].L];
      if (beacon.CP) {
        for (let i = 0; i < beacon.CP.length; i++) {
          beacon.CP[i] = null;
        }
      }
    }
  }
}
function loadGapi(auth2) {
  return new Promise((resolve, reject) => {
    function loadGapiIframe() {
      resetUnloadedGapiModules();
      gapi.load("gapi.iframes", {
        callback: () => {
          resolve(gapi.iframes.getContext());
        },
        ontimeout: () => {
          resetUnloadedGapiModules();
          reject(_createError(
            auth2,
            "network-request-failed"
            /* AuthErrorCode.NETWORK_REQUEST_FAILED */
          ));
        },
        timeout: NETWORK_TIMEOUT.get()
      });
    }
    if (_window().gapi?.iframes?.Iframe) {
      resolve(gapi.iframes.getContext());
    } else if (!!_window().gapi?.load) {
      loadGapiIframe();
    } else {
      const cbName = _generateCallbackName("iframefcb");
      _window()[cbName] = () => {
        if (!!gapi.load) {
          loadGapiIframe();
        } else {
          reject(_createError(
            auth2,
            "network-request-failed"
            /* AuthErrorCode.NETWORK_REQUEST_FAILED */
          ));
        }
      };
      return _loadJS(`${_gapiScriptUrl()}?onload=${cbName}`).catch((e) => reject(e));
    }
  }).catch((error) => {
    cachedGApiLoader = null;
    throw error;
  });
}
function _loadGapi(auth2) {
  cachedGApiLoader = cachedGApiLoader || loadGapi(auth2);
  return cachedGApiLoader;
}
function getIframeUrl(auth2) {
  const config = auth2.config;
  _assert(
    config.authDomain,
    auth2,
    "auth-domain-config-required"
    /* AuthErrorCode.MISSING_AUTH_DOMAIN */
  );
  const url = config.emulator ? _emulatorUrl(config, EMULATED_IFRAME_PATH) : `https://${auth2.config.authDomain}/${IFRAME_PATH}`;
  const params = {
    apiKey: config.apiKey,
    appName: auth2.name,
    v: SDK_VERSION
  };
  const eid = EID_FROM_APIHOST.get(auth2.config.apiHost);
  if (eid) {
    params.eid = eid;
  }
  const frameworks = auth2._getFrameworks();
  if (frameworks.length) {
    params.fw = frameworks.join(",");
  }
  return `${url}?${querystring(params).slice(1)}`;
}
async function _openIframe(auth2) {
  const context = await _loadGapi(auth2);
  const gapi2 = _window().gapi;
  _assert(
    gapi2,
    auth2,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return context.open({
    where: document.body,
    url: getIframeUrl(auth2),
    messageHandlersFilter: gapi2.iframes.CROSS_ORIGIN_IFRAMES_FILTER,
    attributes: IFRAME_ATTRIBUTES,
    dontclear: true
  }, (iframe) => new Promise(async (resolve, reject) => {
    await iframe.restyle({
      // Prevent iframe from closing on mouse out.
      setHideOnLeave: false
    });
    const networkError = _createError(
      auth2,
      "network-request-failed"
      /* AuthErrorCode.NETWORK_REQUEST_FAILED */
    );
    const networkErrorTimer = _window().setTimeout(() => {
      reject(networkError);
    }, PING_TIMEOUT.get());
    function clearTimerAndResolve() {
      _window().clearTimeout(networkErrorTimer);
      resolve(iframe);
    }
    iframe.ping(clearTimerAndResolve).then(clearTimerAndResolve, () => {
      reject(networkError);
    });
  }));
}
function _open(auth2, url, name3, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  const top = Math.max((window.screen.availHeight - height) / 2, 0).toString();
  const left = Math.max((window.screen.availWidth - width) / 2, 0).toString();
  let target = "";
  const options = {
    ...BASE_POPUP_OPTIONS,
    width: width.toString(),
    height: height.toString(),
    top,
    left
  };
  const ua = getUA().toLowerCase();
  if (name3) {
    target = _isChromeIOS(ua) ? TARGET_BLANK : name3;
  }
  if (_isFirefox(ua)) {
    url = url || FIREFOX_EMPTY_URL;
    options.scrollbars = "yes";
  }
  const optionsString = Object.entries(options).reduce((accum, [key, value]) => `${accum}${key}=${value},`, "");
  if (_isIOSStandalone(ua) && target !== "_self") {
    openAsNewWindowIOS(url || "", target);
    return new AuthPopup(null);
  }
  const newWin = window.open(url || "", target, optionsString);
  _assert(
    newWin,
    auth2,
    "popup-blocked"
    /* AuthErrorCode.POPUP_BLOCKED */
  );
  try {
    newWin.focus();
  } catch (e) {
  }
  return new AuthPopup(newWin);
}
function openAsNewWindowIOS(url, target) {
  const el = document.createElement("a");
  el.href = url;
  el.target = target;
  const click = document.createEvent("MouseEvent");
  click.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 1, null);
  el.dispatchEvent(click);
}
async function _getRedirectUrl(auth2, provider, authType, redirectUrl, eventId, additionalParams) {
  _assert(
    auth2.config.authDomain,
    auth2,
    "auth-domain-config-required"
    /* AuthErrorCode.MISSING_AUTH_DOMAIN */
  );
  _assert(
    auth2.config.apiKey,
    auth2,
    "invalid-api-key"
    /* AuthErrorCode.INVALID_API_KEY */
  );
  const params = {
    apiKey: auth2.config.apiKey,
    appName: auth2.name,
    authType,
    redirectUrl,
    v: SDK_VERSION,
    eventId
  };
  if (provider instanceof FederatedAuthProvider) {
    provider.setDefaultLanguage(auth2.languageCode);
    params.providerId = provider.providerId || "";
    if (!isEmpty(provider.getCustomParameters())) {
      params.customParameters = JSON.stringify(provider.getCustomParameters());
    }
    for (const [key, value] of Object.entries(additionalParams || {})) {
      params[key] = value;
    }
  }
  if (provider instanceof BaseOAuthProvider) {
    const scopes = provider.getScopes().filter((scope) => scope !== "");
    if (scopes.length > 0) {
      params.scopes = scopes.join(",");
    }
  }
  if (auth2.tenantId) {
    params.tid = auth2.tenantId;
  }
  const paramsDict = params;
  for (const key of Object.keys(paramsDict)) {
    if (paramsDict[key] === void 0) {
      delete paramsDict[key];
    }
  }
  const appCheckToken = await auth2._getAppCheckToken();
  const appCheckTokenFragment = appCheckToken ? `#${FIREBASE_APP_CHECK_FRAGMENT_ID}=${encodeURIComponent(appCheckToken)}` : "";
  return `${getHandlerBase(auth2)}?${querystring(paramsDict).slice(1)}${appCheckTokenFragment}`;
}
function getHandlerBase({ config }) {
  if (!config.emulator) {
    return `https://${config.authDomain}/${WIDGET_PATH}`;
  }
  return _emulatorUrl(config, EMULATOR_WIDGET_PATH);
}
function _isEmptyString(input) {
  return typeof input === "undefined" || input?.length === 0;
}
function getVersionForPlatform(clientPlatform) {
  switch (clientPlatform) {
    case "Node":
      return "node";
    case "ReactNative":
      return "rn";
    case "Worker":
      return "webworker";
    case "Cordova":
      return "cordova";
    case "WebExtension":
      return "web-extension";
    default:
      return void 0;
  }
}
function registerAuth(clientPlatform) {
  _registerComponent(new Component(
    "auth",
    (container, { options: deps }) => {
      const app2 = container.getProvider("app").getImmediate();
      const heartbeatServiceProvider = container.getProvider("heartbeat");
      const appCheckServiceProvider = container.getProvider("app-check-internal");
      const { apiKey, authDomain } = app2.options;
      _assert(apiKey && !apiKey.includes(":"), "invalid-api-key", { appName: app2.name });
      const config = {
        apiKey,
        authDomain,
        clientPlatform,
        apiHost: "identitytoolkit.googleapis.com",
        tokenApiHost: "securetoken.googleapis.com",
        apiScheme: "https",
        sdkClientVersion: _getClientVersion(clientPlatform)
      };
      const authInstance = new AuthImpl(app2, heartbeatServiceProvider, appCheckServiceProvider, config);
      _initializeAuthInstance(authInstance, deps);
      return authInstance;
    },
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ).setInstanceCreatedCallback((container, _instanceIdentifier, _instance) => {
    const authInternalProvider = container.getProvider(
      "auth-internal"
      /* _ComponentName.AUTH_INTERNAL */
    );
    authInternalProvider.initialize();
  }));
  _registerComponent(new Component(
    "auth-internal",
    (container) => {
      const auth2 = _castAuth(container.getProvider(
        "auth"
        /* _ComponentName.AUTH */
      ).getImmediate());
      return ((auth3) => new AuthInterop(auth3))(auth2);
    },
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ));
  registerVersion(name2, version2, getVersionForPlatform(clientPlatform));
  registerVersion(name2, version2, "esm2020");
}
function getAuth(app2 = getApp()) {
  const provider = _getProvider(app2, "auth");
  if (provider.isInitialized()) {
    return provider.getImmediate();
  }
  const auth2 = initializeAuth(app2, {
    popupRedirectResolver: browserPopupRedirectResolver,
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence
    ]
  });
  const authTokenSyncPath = getExperimentalSetting("authTokenSyncURL");
  if (authTokenSyncPath && typeof isSecureContext === "boolean" && isSecureContext) {
    const authTokenSyncUrl = new URL(authTokenSyncPath, location.origin);
    if (location.origin === authTokenSyncUrl.origin) {
      const mintCookie = mintCookieFactory(authTokenSyncUrl.toString());
      beforeAuthStateChanged(auth2, mintCookie, () => mintCookie(auth2.currentUser));
      onIdTokenChanged(auth2, (user) => mintCookie(user));
    }
  }
  const authEmulatorHost = getDefaultEmulatorHost("auth");
  if (authEmulatorHost) {
    connectAuthEmulator(auth2, `http://${authEmulatorHost}`);
  }
  return auth2;
}
function getScriptParentElement() {
  return document.getElementsByTagName("head")?.[0] ?? document;
}
var prodErrorMap, _DEFAULT_AUTH_ERROR_FACTORY, logClient, Delay, FetchProvider, SERVER_ERROR_MAP, CookieAuthProxiedEndpoints, DEFAULT_API_TIMEOUT_MS, NetworkTimeout, RecaptchaConfig, ProactiveRefresh, UserMetadata, StsTokenManager, UserImpl, instanceCache, InMemoryPersistence, inMemoryPersistence, PersistenceUserManager, AuthMiddlewareQueue, MINIMUM_MIN_PASSWORD_LENGTH, PasswordPolicyImpl, AuthImpl, Subscription, externalJSProvider, _SOLVE_TIME_MS, _EXPIRATION_TIME_MS, _WIDGET_ID_START, MockReCaptcha, MockGreCAPTCHATopLevel, MockGreCAPTCHA, MockWidget, RECAPTCHA_ENTERPRISE_VERIFIER_TYPE, FAKE_TOKEN, RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME, RecaptchaEnterpriseVerifier, AuthCredential, EmailAuthCredential, IDP_REQUEST_URI$1, OAuthCredential, VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_, PhoneAuthCredential, ActionCodeURL, EmailAuthProvider, FederatedAuthProvider, BaseOAuthProvider, OAuthProvider, FacebookAuthProvider, GoogleAuthProvider, GithubAuthProvider, TwitterAuthProvider, UserCredentialImpl, MultiFactorError, GenericAdditionalUserInfo, FederatedAdditionalUserInfoWithUsername, FacebookAdditionalUserInfo, GithubAdditionalUserInfo, GoogleAdditionalUserInfo, TwitterAdditionalUserInfo, STORAGE_AVAILABLE_KEY, BrowserPersistenceClass, _POLLING_INTERVAL_MS$1, IE10_LOCAL_STORAGE_SYNC_DELAY, BrowserLocalPersistence, browserLocalPersistence, POLLING_INTERVAL_MS, CookiePersistence, BrowserSessionPersistence, browserSessionPersistence, Receiver, Sender, DB_NAME2, DB_VERSION2, DB_OBJECTSTORE_NAME, DB_DATA_KEYPATH, DBPromise, _POLLING_INTERVAL_MS, _TRANSACTION_RETRY_COUNT, IndexedDBLocalPersistence, indexedDBLocalPersistence, _JSLOAD_CALLBACK, NETWORK_TIMEOUT_DELAY, ReCaptchaLoaderImpl, MockReCaptchaLoaderImpl, RECAPTCHA_VERIFIER_TYPE, DEFAULT_PARAMS, RecaptchaVerifier, ConfirmationResultImpl, PhoneAuthProvider, IdpCredential, AbstractPopupRedirectOperation, _POLL_WINDOW_CLOSE_TIMEOUT, PopupOperation, PENDING_REDIRECT_KEY, redirectOutcomeMap, RedirectAction, EVENT_DUPLICATION_CACHE_DURATION_MS, AuthEventManager, IP_ADDRESS_REGEX, HTTP_REGEX, NETWORK_TIMEOUT, cachedGApiLoader, PING_TIMEOUT, IFRAME_PATH, EMULATED_IFRAME_PATH, IFRAME_ATTRIBUTES, EID_FROM_APIHOST, BASE_POPUP_OPTIONS, DEFAULT_WIDTH, DEFAULT_HEIGHT, TARGET_BLANK, FIREFOX_EMPTY_URL, AuthPopup, WIDGET_PATH, EMULATOR_WIDGET_PATH, FIREBASE_APP_CHECK_FRAGMENT_ID, WEB_STORAGE_SUPPORT_KEY, BrowserPopupRedirectResolver, browserPopupRedirectResolver, MultiFactorAssertionImpl, PhoneMultiFactorAssertionImpl, PhoneMultiFactorGenerator, TotpMultiFactorGenerator, TotpMultiFactorAssertionImpl, TotpSecret, name2, version2, AuthInterop, DEFAULT_ID_TOKEN_MAX_AGE, authIdTokenMaxAge, lastPostedIdToken, mintCookieFactory;
var init_index_4NFEPWkC = __esm({
  "node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js"() {
    init_index_esm4();
    init_index_esm();
    init_index_esm3();
    init_index_esm2();
    prodErrorMap = _prodErrorMap;
    _DEFAULT_AUTH_ERROR_FACTORY = new ErrorFactory("auth", "Firebase", _prodErrorMap());
    logClient = new Logger("@firebase/auth");
    Delay = class {
      constructor(shortDelay, longDelay) {
        this.shortDelay = shortDelay;
        this.longDelay = longDelay;
        debugAssert(longDelay > shortDelay, "Short delay should be less than long delay!");
        this.isMobile = isMobileCordova() || isReactNative();
      }
      get() {
        if (!_isOnline()) {
          return Math.min(5e3, this.shortDelay);
        }
        return this.isMobile ? this.longDelay : this.shortDelay;
      }
    };
    FetchProvider = class {
      static initialize(fetchImpl, headersImpl, responseImpl) {
        this.fetchImpl = fetchImpl;
        if (headersImpl) {
          this.headersImpl = headersImpl;
        }
        if (responseImpl) {
          this.responseImpl = responseImpl;
        }
      }
      static fetch() {
        if (this.fetchImpl) {
          return this.fetchImpl;
        }
        if (typeof self !== "undefined" && "fetch" in self) {
          return self.fetch;
        }
        if (typeof globalThis !== "undefined" && globalThis.fetch) {
          return globalThis.fetch;
        }
        if (typeof fetch !== "undefined") {
          return fetch;
        }
        debugFail("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
      }
      static headers() {
        if (this.headersImpl) {
          return this.headersImpl;
        }
        if (typeof self !== "undefined" && "Headers" in self) {
          return self.Headers;
        }
        if (typeof globalThis !== "undefined" && globalThis.Headers) {
          return globalThis.Headers;
        }
        if (typeof Headers !== "undefined") {
          return Headers;
        }
        debugFail("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
      }
      static response() {
        if (this.responseImpl) {
          return this.responseImpl;
        }
        if (typeof self !== "undefined" && "Response" in self) {
          return self.Response;
        }
        if (typeof globalThis !== "undefined" && globalThis.Response) {
          return globalThis.Response;
        }
        if (typeof Response !== "undefined") {
          return Response;
        }
        debugFail("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
      }
    };
    SERVER_ERROR_MAP = {
      // Custom token errors.
      [
        "CREDENTIAL_MISMATCH"
        /* ServerError.CREDENTIAL_MISMATCH */
      ]: "custom-token-mismatch",
      // This can only happen if the SDK sends a bad request.
      [
        "MISSING_CUSTOM_TOKEN"
        /* ServerError.MISSING_CUSTOM_TOKEN */
      ]: "internal-error",
      // Create Auth URI errors.
      [
        "INVALID_IDENTIFIER"
        /* ServerError.INVALID_IDENTIFIER */
      ]: "invalid-email",
      // This can only happen if the SDK sends a bad request.
      [
        "MISSING_CONTINUE_URI"
        /* ServerError.MISSING_CONTINUE_URI */
      ]: "internal-error",
      // Sign in with email and password errors (some apply to sign up too).
      [
        "INVALID_PASSWORD"
        /* ServerError.INVALID_PASSWORD */
      ]: "wrong-password",
      // This can only happen if the SDK sends a bad request.
      [
        "MISSING_PASSWORD"
        /* ServerError.MISSING_PASSWORD */
      ]: "missing-password",
      // Thrown if Email Enumeration Protection is enabled in the project and the email or password is
      // invalid.
      [
        "INVALID_LOGIN_CREDENTIALS"
        /* ServerError.INVALID_LOGIN_CREDENTIALS */
      ]: "invalid-credential",
      // Sign up with email and password errors.
      [
        "EMAIL_EXISTS"
        /* ServerError.EMAIL_EXISTS */
      ]: "email-already-in-use",
      [
        "PASSWORD_LOGIN_DISABLED"
        /* ServerError.PASSWORD_LOGIN_DISABLED */
      ]: "operation-not-allowed",
      // Verify assertion for sign in with credential errors:
      [
        "INVALID_IDP_RESPONSE"
        /* ServerError.INVALID_IDP_RESPONSE */
      ]: "invalid-credential",
      [
        "INVALID_PENDING_TOKEN"
        /* ServerError.INVALID_PENDING_TOKEN */
      ]: "invalid-credential",
      [
        "FEDERATED_USER_ID_ALREADY_LINKED"
        /* ServerError.FEDERATED_USER_ID_ALREADY_LINKED */
      ]: "credential-already-in-use",
      // This can only happen if the SDK sends a bad request.
      [
        "MISSING_REQ_TYPE"
        /* ServerError.MISSING_REQ_TYPE */
      ]: "internal-error",
      // Send Password reset email errors:
      [
        "EMAIL_NOT_FOUND"
        /* ServerError.EMAIL_NOT_FOUND */
      ]: "user-not-found",
      [
        "RESET_PASSWORD_EXCEED_LIMIT"
        /* ServerError.RESET_PASSWORD_EXCEED_LIMIT */
      ]: "too-many-requests",
      [
        "EXPIRED_OOB_CODE"
        /* ServerError.EXPIRED_OOB_CODE */
      ]: "expired-action-code",
      [
        "INVALID_OOB_CODE"
        /* ServerError.INVALID_OOB_CODE */
      ]: "invalid-action-code",
      // This can only happen if the SDK sends a bad request.
      [
        "MISSING_OOB_CODE"
        /* ServerError.MISSING_OOB_CODE */
      ]: "internal-error",
      // Operations that require ID token in request:
      [
        "CREDENTIAL_TOO_OLD_LOGIN_AGAIN"
        /* ServerError.CREDENTIAL_TOO_OLD_LOGIN_AGAIN */
      ]: "requires-recent-login",
      [
        "INVALID_ID_TOKEN"
        /* ServerError.INVALID_ID_TOKEN */
      ]: "invalid-user-token",
      [
        "TOKEN_EXPIRED"
        /* ServerError.TOKEN_EXPIRED */
      ]: "user-token-expired",
      [
        "USER_NOT_FOUND"
        /* ServerError.USER_NOT_FOUND */
      ]: "user-token-expired",
      // Other errors.
      [
        "TOO_MANY_ATTEMPTS_TRY_LATER"
        /* ServerError.TOO_MANY_ATTEMPTS_TRY_LATER */
      ]: "too-many-requests",
      [
        "PASSWORD_DOES_NOT_MEET_REQUIREMENTS"
        /* ServerError.PASSWORD_DOES_NOT_MEET_REQUIREMENTS */
      ]: "password-does-not-meet-requirements",
      // Phone Auth related errors.
      [
        "INVALID_CODE"
        /* ServerError.INVALID_CODE */
      ]: "invalid-verification-code",
      [
        "INVALID_SESSION_INFO"
        /* ServerError.INVALID_SESSION_INFO */
      ]: "invalid-verification-id",
      [
        "INVALID_TEMPORARY_PROOF"
        /* ServerError.INVALID_TEMPORARY_PROOF */
      ]: "invalid-credential",
      [
        "MISSING_SESSION_INFO"
        /* ServerError.MISSING_SESSION_INFO */
      ]: "missing-verification-id",
      [
        "SESSION_EXPIRED"
        /* ServerError.SESSION_EXPIRED */
      ]: "code-expired",
      // Other action code errors when additional settings passed.
      // MISSING_CONTINUE_URI is getting mapped to INTERNAL_ERROR above.
      // This is OK as this error will be caught by client side validation.
      [
        "MISSING_ANDROID_PACKAGE_NAME"
        /* ServerError.MISSING_ANDROID_PACKAGE_NAME */
      ]: "missing-android-pkg-name",
      [
        "UNAUTHORIZED_DOMAIN"
        /* ServerError.UNAUTHORIZED_DOMAIN */
      ]: "unauthorized-continue-uri",
      // getProjectConfig errors when clientId is passed.
      [
        "INVALID_OAUTH_CLIENT_ID"
        /* ServerError.INVALID_OAUTH_CLIENT_ID */
      ]: "invalid-oauth-client-id",
      // User actions (sign-up or deletion) disabled errors.
      [
        "ADMIN_ONLY_OPERATION"
        /* ServerError.ADMIN_ONLY_OPERATION */
      ]: "admin-restricted-operation",
      // Multi factor related errors.
      [
        "INVALID_MFA_PENDING_CREDENTIAL"
        /* ServerError.INVALID_MFA_PENDING_CREDENTIAL */
      ]: "invalid-multi-factor-session",
      [
        "MFA_ENROLLMENT_NOT_FOUND"
        /* ServerError.MFA_ENROLLMENT_NOT_FOUND */
      ]: "multi-factor-info-not-found",
      [
        "MISSING_MFA_ENROLLMENT_ID"
        /* ServerError.MISSING_MFA_ENROLLMENT_ID */
      ]: "missing-multi-factor-info",
      [
        "MISSING_MFA_PENDING_CREDENTIAL"
        /* ServerError.MISSING_MFA_PENDING_CREDENTIAL */
      ]: "missing-multi-factor-session",
      [
        "SECOND_FACTOR_EXISTS"
        /* ServerError.SECOND_FACTOR_EXISTS */
      ]: "second-factor-already-in-use",
      [
        "SECOND_FACTOR_LIMIT_EXCEEDED"
        /* ServerError.SECOND_FACTOR_LIMIT_EXCEEDED */
      ]: "maximum-second-factor-count-exceeded",
      // Blocking functions related errors.
      [
        "BLOCKING_FUNCTION_ERROR_RESPONSE"
        /* ServerError.BLOCKING_FUNCTION_ERROR_RESPONSE */
      ]: "internal-error",
      // Recaptcha related errors.
      [
        "RECAPTCHA_NOT_ENABLED"
        /* ServerError.RECAPTCHA_NOT_ENABLED */
      ]: "recaptcha-not-enabled",
      [
        "MISSING_RECAPTCHA_TOKEN"
        /* ServerError.MISSING_RECAPTCHA_TOKEN */
      ]: "missing-recaptcha-token",
      [
        "INVALID_RECAPTCHA_TOKEN"
        /* ServerError.INVALID_RECAPTCHA_TOKEN */
      ]: "invalid-recaptcha-token",
      [
        "INVALID_RECAPTCHA_ACTION"
        /* ServerError.INVALID_RECAPTCHA_ACTION */
      ]: "invalid-recaptcha-action",
      [
        "MISSING_CLIENT_TYPE"
        /* ServerError.MISSING_CLIENT_TYPE */
      ]: "missing-client-type",
      [
        "MISSING_RECAPTCHA_VERSION"
        /* ServerError.MISSING_RECAPTCHA_VERSION */
      ]: "missing-recaptcha-version",
      [
        "INVALID_RECAPTCHA_VERSION"
        /* ServerError.INVALID_RECAPTCHA_VERSION */
      ]: "invalid-recaptcha-version",
      [
        "INVALID_REQ_TYPE"
        /* ServerError.INVALID_REQ_TYPE */
      ]: "invalid-req-type"
      /* AuthErrorCode.INVALID_REQ_TYPE */
    };
    CookieAuthProxiedEndpoints = [
      "/v1/accounts:signInWithCustomToken",
      "/v1/accounts:signInWithEmailLink",
      "/v1/accounts:signInWithIdp",
      "/v1/accounts:signInWithPassword",
      "/v1/accounts:signInWithPhoneNumber",
      "/v1/token"
      /* Endpoint.TOKEN */
    ];
    DEFAULT_API_TIMEOUT_MS = new Delay(3e4, 6e4);
    NetworkTimeout = class {
      clearNetworkTimeout() {
        clearTimeout(this.timer);
      }
      constructor(auth2) {
        this.auth = auth2;
        this.timer = null;
        this.promise = new Promise((_, reject) => {
          this.timer = setTimeout(() => {
            return reject(_createError(
              this.auth,
              "network-request-failed"
              /* AuthErrorCode.NETWORK_REQUEST_FAILED */
            ));
          }, DEFAULT_API_TIMEOUT_MS.get());
        });
      }
    };
    RecaptchaConfig = class {
      constructor(response) {
        this.siteKey = "";
        this.recaptchaEnforcementState = [];
        if (response.recaptchaKey === void 0) {
          throw new Error("recaptchaKey undefined");
        }
        this.siteKey = response.recaptchaKey.split("/")[3];
        this.recaptchaEnforcementState = response.recaptchaEnforcementState;
      }
      /**
       * Returns the reCAPTCHA Enterprise enforcement state for the given provider.
       *
       * @param providerStr - The provider whose enforcement state is to be returned.
       * @returns The reCAPTCHA Enterprise enforcement state for the given provider.
       */
      getProviderEnforcementState(providerStr) {
        if (!this.recaptchaEnforcementState || this.recaptchaEnforcementState.length === 0) {
          return null;
        }
        for (const recaptchaEnforcementState of this.recaptchaEnforcementState) {
          if (recaptchaEnforcementState.provider && recaptchaEnforcementState.provider === providerStr) {
            return _parseEnforcementState(recaptchaEnforcementState.enforcementState);
          }
        }
        return null;
      }
      /**
       * Returns true if the reCAPTCHA Enterprise enforcement state for the provider is set to ENFORCE or AUDIT.
       *
       * @param providerStr - The provider whose enablement state is to be returned.
       * @returns Whether or not reCAPTCHA Enterprise protection is enabled for the given provider.
       */
      isProviderEnabled(providerStr) {
        return this.getProviderEnforcementState(providerStr) === "ENFORCE" || this.getProviderEnforcementState(providerStr) === "AUDIT";
      }
      /**
       * Returns true if reCAPTCHA Enterprise protection is enabled in at least one provider, otherwise
       * returns false.
       *
       * @returns Whether or not reCAPTCHA Enterprise protection is enabled for at least one provider.
       */
      isAnyProviderEnabled() {
        return this.isProviderEnabled(
          "EMAIL_PASSWORD_PROVIDER"
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        ) || this.isProviderEnabled(
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        );
      }
    };
    ProactiveRefresh = class {
      constructor(user) {
        this.user = user;
        this.isRunning = false;
        this.timerId = null;
        this.errorBackoff = 3e4;
      }
      _start() {
        if (this.isRunning) {
          return;
        }
        this.isRunning = true;
        this.schedule();
      }
      _stop() {
        if (!this.isRunning) {
          return;
        }
        this.isRunning = false;
        if (this.timerId !== null) {
          clearTimeout(this.timerId);
        }
      }
      getInterval(wasError) {
        if (wasError) {
          const interval = this.errorBackoff;
          this.errorBackoff = Math.min(
            this.errorBackoff * 2,
            96e4
            /* Duration.RETRY_BACKOFF_MAX */
          );
          return interval;
        } else {
          this.errorBackoff = 3e4;
          const expTime = this.user.stsTokenManager.expirationTime ?? 0;
          const interval = expTime - Date.now() - 3e5;
          return Math.max(0, interval);
        }
      }
      schedule(wasError = false) {
        if (!this.isRunning) {
          return;
        }
        const interval = this.getInterval(wasError);
        this.timerId = setTimeout(async () => {
          await this.iteration();
        }, interval);
      }
      async iteration() {
        try {
          await this.user.getIdToken(true);
        } catch (e) {
          if (e?.code === `auth/${"network-request-failed"}`) {
            this.schedule(
              /* wasError */
              true
            );
          }
          return;
        }
        this.schedule();
      }
    };
    UserMetadata = class {
      constructor(createdAt, lastLoginAt) {
        this.createdAt = createdAt;
        this.lastLoginAt = lastLoginAt;
        this._initializeTime();
      }
      _initializeTime() {
        this.lastSignInTime = utcTimestampToDateString(this.lastLoginAt);
        this.creationTime = utcTimestampToDateString(this.createdAt);
      }
      _copy(metadata) {
        this.createdAt = metadata.createdAt;
        this.lastLoginAt = metadata.lastLoginAt;
        this._initializeTime();
      }
      toJSON() {
        return {
          createdAt: this.createdAt,
          lastLoginAt: this.lastLoginAt
        };
      }
    };
    StsTokenManager = class _StsTokenManager {
      constructor() {
        this.refreshToken = null;
        this.accessToken = null;
        this.expirationTime = null;
      }
      get isExpired() {
        return !this.expirationTime || Date.now() > this.expirationTime - 3e4;
      }
      updateFromServerResponse(response) {
        _assert(
          response.idToken,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        _assert(
          typeof response.idToken !== "undefined",
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        _assert(
          typeof response.refreshToken !== "undefined",
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const expiresIn = "expiresIn" in response && typeof response.expiresIn !== "undefined" ? Number(response.expiresIn) : _tokenExpiresIn(response.idToken);
        this.updateTokensAndExpiration(response.idToken, response.refreshToken, expiresIn);
      }
      updateFromIdToken(idToken) {
        _assert(
          idToken.length !== 0,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const expiresIn = _tokenExpiresIn(idToken);
        this.updateTokensAndExpiration(idToken, null, expiresIn);
      }
      async getToken(auth2, forceRefresh = false) {
        if (!forceRefresh && this.accessToken && !this.isExpired) {
          return this.accessToken;
        }
        _assert(
          this.refreshToken,
          auth2,
          "user-token-expired"
          /* AuthErrorCode.TOKEN_EXPIRED */
        );
        if (this.refreshToken) {
          await this.refresh(auth2, this.refreshToken);
          return this.accessToken;
        }
        return null;
      }
      clearRefreshToken() {
        this.refreshToken = null;
      }
      async refresh(auth2, oldToken) {
        const { accessToken, refreshToken, expiresIn } = await requestStsToken(auth2, oldToken);
        this.updateTokensAndExpiration(accessToken, refreshToken, Number(expiresIn));
      }
      updateTokensAndExpiration(accessToken, refreshToken, expiresInSec) {
        this.refreshToken = refreshToken || null;
        this.accessToken = accessToken || null;
        this.expirationTime = Date.now() + expiresInSec * 1e3;
      }
      static fromJSON(appName, object) {
        const { refreshToken, accessToken, expirationTime } = object;
        const manager = new _StsTokenManager();
        if (refreshToken) {
          _assert(typeof refreshToken === "string", "internal-error", {
            appName
          });
          manager.refreshToken = refreshToken;
        }
        if (accessToken) {
          _assert(typeof accessToken === "string", "internal-error", {
            appName
          });
          manager.accessToken = accessToken;
        }
        if (expirationTime) {
          _assert(typeof expirationTime === "number", "internal-error", {
            appName
          });
          manager.expirationTime = expirationTime;
        }
        return manager;
      }
      toJSON() {
        return {
          refreshToken: this.refreshToken,
          accessToken: this.accessToken,
          expirationTime: this.expirationTime
        };
      }
      _assign(stsTokenManager) {
        this.accessToken = stsTokenManager.accessToken;
        this.refreshToken = stsTokenManager.refreshToken;
        this.expirationTime = stsTokenManager.expirationTime;
      }
      _clone() {
        return Object.assign(new _StsTokenManager(), this.toJSON());
      }
      _performRefresh() {
        return debugFail("not implemented");
      }
    };
    UserImpl = class _UserImpl {
      constructor({ uid, auth: auth2, stsTokenManager, ...opt }) {
        this.providerId = "firebase";
        this.proactiveRefresh = new ProactiveRefresh(this);
        this.reloadUserInfo = null;
        this.reloadListener = null;
        this.uid = uid;
        this.auth = auth2;
        this.stsTokenManager = stsTokenManager;
        this.accessToken = stsTokenManager.accessToken;
        this.displayName = opt.displayName || null;
        this.email = opt.email || null;
        this.emailVerified = opt.emailVerified || false;
        this.phoneNumber = opt.phoneNumber || null;
        this.photoURL = opt.photoURL || null;
        this.isAnonymous = opt.isAnonymous || false;
        this.tenantId = opt.tenantId || null;
        this.providerData = opt.providerData ? [...opt.providerData] : [];
        this.metadata = new UserMetadata(opt.createdAt || void 0, opt.lastLoginAt || void 0);
      }
      async getIdToken(forceRefresh) {
        const accessToken = await _logoutIfInvalidated(this, this.stsTokenManager.getToken(this.auth, forceRefresh));
        _assert(
          accessToken,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        if (this.accessToken !== accessToken) {
          this.accessToken = accessToken;
          await this.auth._persistUserIfCurrent(this);
          this.auth._notifyListenersIfCurrent(this);
        }
        return accessToken;
      }
      getIdTokenResult(forceRefresh) {
        return getIdTokenResult(this, forceRefresh);
      }
      reload() {
        return reload(this);
      }
      _assign(user) {
        if (this === user) {
          return;
        }
        _assert(
          this.uid === user.uid,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        this.displayName = user.displayName;
        this.photoURL = user.photoURL;
        this.email = user.email;
        this.emailVerified = user.emailVerified;
        this.phoneNumber = user.phoneNumber;
        this.isAnonymous = user.isAnonymous;
        this.tenantId = user.tenantId;
        this.providerData = user.providerData.map((userInfo) => ({ ...userInfo }));
        this.metadata._copy(user.metadata);
        this.stsTokenManager._assign(user.stsTokenManager);
      }
      _clone(auth2) {
        const newUser = new _UserImpl({
          ...this,
          auth: auth2,
          stsTokenManager: this.stsTokenManager._clone()
        });
        newUser.metadata._copy(this.metadata);
        return newUser;
      }
      _onReload(callback) {
        _assert(
          !this.reloadListener,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        this.reloadListener = callback;
        if (this.reloadUserInfo) {
          this._notifyReloadListener(this.reloadUserInfo);
          this.reloadUserInfo = null;
        }
      }
      _notifyReloadListener(userInfo) {
        if (this.reloadListener) {
          this.reloadListener(userInfo);
        } else {
          this.reloadUserInfo = userInfo;
        }
      }
      _startProactiveRefresh() {
        this.proactiveRefresh._start();
      }
      _stopProactiveRefresh() {
        this.proactiveRefresh._stop();
      }
      async _updateTokensIfNecessary(response, reload2 = false) {
        let tokensRefreshed = false;
        if (response.idToken && response.idToken !== this.stsTokenManager.accessToken) {
          this.stsTokenManager.updateFromServerResponse(response);
          tokensRefreshed = true;
        }
        if (reload2) {
          await _reloadWithoutSaving(this);
        }
        await this.auth._persistUserIfCurrent(this);
        if (tokensRefreshed) {
          this.auth._notifyListenersIfCurrent(this);
        }
      }
      async delete() {
        if (_isFirebaseServerApp(this.auth.app)) {
          return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this.auth));
        }
        const idToken = await this.getIdToken();
        await _logoutIfInvalidated(this, deleteAccount(this.auth, { idToken }));
        this.stsTokenManager.clearRefreshToken();
        return this.auth.signOut();
      }
      toJSON() {
        return {
          uid: this.uid,
          email: this.email || void 0,
          emailVerified: this.emailVerified,
          displayName: this.displayName || void 0,
          isAnonymous: this.isAnonymous,
          photoURL: this.photoURL || void 0,
          phoneNumber: this.phoneNumber || void 0,
          tenantId: this.tenantId || void 0,
          providerData: this.providerData.map((userInfo) => ({ ...userInfo })),
          stsTokenManager: this.stsTokenManager.toJSON(),
          // Redirect event ID must be maintained in case there is a pending
          // redirect event.
          _redirectEventId: this._redirectEventId,
          ...this.metadata.toJSON(),
          // Required for compatibility with the legacy SDK (go/firebase-auth-sdk-persistence-parsing):
          apiKey: this.auth.config.apiKey,
          appName: this.auth.name
          // Missing authDomain will be tolerated by the legacy SDK.
          // stsTokenManager.apiKey isn't actually required (despite the legacy SDK persisting it).
        };
      }
      get refreshToken() {
        return this.stsTokenManager.refreshToken || "";
      }
      static _fromJSON(auth2, object) {
        const displayName = object.displayName ?? void 0;
        const email = object.email ?? void 0;
        const phoneNumber = object.phoneNumber ?? void 0;
        const photoURL = object.photoURL ?? void 0;
        const tenantId = object.tenantId ?? void 0;
        const _redirectEventId = object._redirectEventId ?? void 0;
        const createdAt = object.createdAt ?? void 0;
        const lastLoginAt = object.lastLoginAt ?? void 0;
        const { uid, emailVerified, isAnonymous, providerData, stsTokenManager: plainObjectTokenManager } = object;
        _assert(
          uid && plainObjectTokenManager,
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const stsTokenManager = StsTokenManager.fromJSON(this.name, plainObjectTokenManager);
        _assert(
          typeof uid === "string",
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        assertStringOrUndefined(displayName, auth2.name);
        assertStringOrUndefined(email, auth2.name);
        _assert(
          typeof emailVerified === "boolean",
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        _assert(
          typeof isAnonymous === "boolean",
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        assertStringOrUndefined(phoneNumber, auth2.name);
        assertStringOrUndefined(photoURL, auth2.name);
        assertStringOrUndefined(tenantId, auth2.name);
        assertStringOrUndefined(_redirectEventId, auth2.name);
        assertStringOrUndefined(createdAt, auth2.name);
        assertStringOrUndefined(lastLoginAt, auth2.name);
        const user = new _UserImpl({
          uid,
          auth: auth2,
          email,
          emailVerified,
          displayName,
          isAnonymous,
          photoURL,
          phoneNumber,
          tenantId,
          stsTokenManager,
          createdAt,
          lastLoginAt
        });
        if (providerData && Array.isArray(providerData)) {
          user.providerData = providerData.map((userInfo) => ({ ...userInfo }));
        }
        if (_redirectEventId) {
          user._redirectEventId = _redirectEventId;
        }
        return user;
      }
      /**
       * Initialize a User from an idToken server response
       * @param auth
       * @param idTokenResponse
       */
      static async _fromIdTokenResponse(auth2, idTokenResponse, isAnonymous = false) {
        const stsTokenManager = new StsTokenManager();
        stsTokenManager.updateFromServerResponse(idTokenResponse);
        const user = new _UserImpl({
          uid: idTokenResponse.localId,
          auth: auth2,
          stsTokenManager,
          isAnonymous
        });
        await _reloadWithoutSaving(user);
        return user;
      }
      /**
       * Initialize a User from an idToken server response
       * @param auth
       * @param idTokenResponse
       */
      static async _fromGetAccountInfoResponse(auth2, response, idToken) {
        const coreAccount = response.users[0];
        _assert(
          coreAccount.localId !== void 0,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const providerData = coreAccount.providerUserInfo !== void 0 ? extractProviderData(coreAccount.providerUserInfo) : [];
        const isAnonymous = !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length;
        const stsTokenManager = new StsTokenManager();
        stsTokenManager.updateFromIdToken(idToken);
        const user = new _UserImpl({
          uid: coreAccount.localId,
          auth: auth2,
          stsTokenManager,
          isAnonymous
        });
        const updates = {
          uid: coreAccount.localId,
          displayName: coreAccount.displayName || null,
          photoURL: coreAccount.photoUrl || null,
          email: coreAccount.email || null,
          emailVerified: coreAccount.emailVerified || false,
          phoneNumber: coreAccount.phoneNumber || null,
          tenantId: coreAccount.tenantId || null,
          providerData,
          metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
          isAnonymous: !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length
        };
        Object.assign(user, updates);
        return user;
      }
    };
    instanceCache = /* @__PURE__ */ new Map();
    InMemoryPersistence = class {
      constructor() {
        this.type = "NONE";
        this.storage = {};
      }
      async _isAvailable() {
        return true;
      }
      async _set(key, value) {
        this.storage[key] = value;
      }
      async _get(key) {
        const value = this.storage[key];
        return value === void 0 ? null : value;
      }
      async _remove(key) {
        delete this.storage[key];
      }
      _addListener(_key, _listener) {
        return;
      }
      _removeListener(_key, _listener) {
        return;
      }
    };
    InMemoryPersistence.type = "NONE";
    inMemoryPersistence = InMemoryPersistence;
    PersistenceUserManager = class _PersistenceUserManager {
      constructor(persistence, auth2, userKey) {
        this.persistence = persistence;
        this.auth = auth2;
        this.userKey = userKey;
        const { config, name: name3 } = this.auth;
        this.fullUserKey = _persistenceKeyName(this.userKey, config.apiKey, name3);
        this.fullPersistenceKey = _persistenceKeyName("persistence", config.apiKey, name3);
        this.boundEventHandler = auth2._onStorageEvent.bind(auth2);
        try {
          this.persistence._addListener(this.fullUserKey, this.boundEventHandler);
        } catch {
        }
      }
      setCurrentUser(user) {
        return this.persistence._set(this.fullUserKey, user.toJSON());
      }
      async getCurrentUser() {
        const blob = await this.persistence._get(this.fullUserKey);
        if (!blob) {
          return null;
        }
        if (typeof blob === "string") {
          const response = await getAccountInfo(this.auth, { idToken: blob }).catch(() => void 0);
          if (!response) {
            return null;
          }
          return UserImpl._fromGetAccountInfoResponse(this.auth, response, blob);
        }
        return UserImpl._fromJSON(this.auth, blob);
      }
      removeCurrentUser() {
        return this.persistence._remove(this.fullUserKey);
      }
      savePersistenceForRedirect() {
        return this.persistence._set(this.fullPersistenceKey, this.persistence.type);
      }
      async setPersistence(newPersistence) {
        if (this.persistence === newPersistence) {
          return;
        }
        const currentUser = await this.getCurrentUser();
        await this.removeCurrentUser();
        this.persistence = newPersistence;
        if (currentUser) {
          return this.setCurrentUser(currentUser);
        }
      }
      delete() {
        try {
          this.persistence._removeListener(this.fullUserKey, this.boundEventHandler);
        } catch {
        }
      }
      static async create(auth2, persistenceHierarchy, userKey = "authUser") {
        if (!persistenceHierarchy.length) {
          return new _PersistenceUserManager(_getInstance(inMemoryPersistence), auth2, userKey);
        }
        const availablePersistences = (await Promise.all(persistenceHierarchy.map(async (persistence) => {
          try {
            if (await persistence._isAvailable()) {
              return persistence;
            }
          } catch {
            return void 0;
          }
          return void 0;
        }))).filter((persistence) => persistence);
        let selectedPersistence = availablePersistences[0] || _getInstance(inMemoryPersistence);
        const key = _persistenceKeyName(userKey, auth2.config.apiKey, auth2.name);
        let userToMigrate = null;
        for (const persistence of persistenceHierarchy) {
          try {
            const blob = await persistence._get(key);
            if (blob) {
              let user;
              if (typeof blob === "string") {
                const response = await getAccountInfo(auth2, {
                  idToken: blob
                }).catch(() => void 0);
                if (!response) {
                  break;
                }
                user = await UserImpl._fromGetAccountInfoResponse(auth2, response, blob);
              } else {
                user = UserImpl._fromJSON(auth2, blob);
              }
              if (persistence !== selectedPersistence) {
                userToMigrate = user;
              }
              selectedPersistence = persistence;
              break;
            }
          } catch {
          }
        }
        const migrationHierarchy = availablePersistences.filter((p) => p._shouldAllowMigration);
        if (!selectedPersistence._shouldAllowMigration || !migrationHierarchy.length) {
          return new _PersistenceUserManager(selectedPersistence, auth2, userKey);
        }
        selectedPersistence = migrationHierarchy[0];
        if (userToMigrate) {
          await selectedPersistence._set(key, userToMigrate.toJSON());
        }
        await Promise.all(persistenceHierarchy.map(async (persistence) => {
          if (persistence !== selectedPersistence) {
            try {
              await persistence._remove(key);
            } catch {
            }
          }
        }));
        return new _PersistenceUserManager(selectedPersistence, auth2, userKey);
      }
    };
    AuthMiddlewareQueue = class {
      constructor(auth2) {
        this.auth = auth2;
        this.queue = [];
      }
      pushCallback(callback, onAbort) {
        const wrappedCallback = (user) => new Promise((resolve, reject) => {
          try {
            const result = callback(user);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
        wrappedCallback.onAbort = onAbort;
        this.queue.push(wrappedCallback);
        const index = this.queue.length - 1;
        return () => {
          this.queue[index] = () => Promise.resolve();
        };
      }
      async runMiddleware(nextUser) {
        if (this.auth.currentUser === nextUser) {
          return;
        }
        const onAbortStack = [];
        try {
          for (const beforeStateCallback of this.queue) {
            await beforeStateCallback(nextUser);
            if (beforeStateCallback.onAbort) {
              onAbortStack.push(beforeStateCallback.onAbort);
            }
          }
        } catch (e) {
          onAbortStack.reverse();
          for (const onAbort of onAbortStack) {
            try {
              onAbort();
            } catch (_) {
            }
          }
          throw this.auth._errorFactory.create("login-blocked", {
            originalMessage: e?.message
          });
        }
      }
    };
    MINIMUM_MIN_PASSWORD_LENGTH = 6;
    PasswordPolicyImpl = class {
      constructor(response) {
        const responseOptions = response.customStrengthOptions;
        this.customStrengthOptions = {};
        this.customStrengthOptions.minPasswordLength = responseOptions.minPasswordLength ?? MINIMUM_MIN_PASSWORD_LENGTH;
        if (responseOptions.maxPasswordLength) {
          this.customStrengthOptions.maxPasswordLength = responseOptions.maxPasswordLength;
        }
        if (responseOptions.containsLowercaseCharacter !== void 0) {
          this.customStrengthOptions.containsLowercaseLetter = responseOptions.containsLowercaseCharacter;
        }
        if (responseOptions.containsUppercaseCharacter !== void 0) {
          this.customStrengthOptions.containsUppercaseLetter = responseOptions.containsUppercaseCharacter;
        }
        if (responseOptions.containsNumericCharacter !== void 0) {
          this.customStrengthOptions.containsNumericCharacter = responseOptions.containsNumericCharacter;
        }
        if (responseOptions.containsNonAlphanumericCharacter !== void 0) {
          this.customStrengthOptions.containsNonAlphanumericCharacter = responseOptions.containsNonAlphanumericCharacter;
        }
        this.enforcementState = response.enforcementState;
        if (this.enforcementState === "ENFORCEMENT_STATE_UNSPECIFIED") {
          this.enforcementState = "OFF";
        }
        this.allowedNonAlphanumericCharacters = response.allowedNonAlphanumericCharacters?.join("") ?? "";
        this.forceUpgradeOnSignin = response.forceUpgradeOnSignin ?? false;
        this.schemaVersion = response.schemaVersion;
      }
      validatePassword(password) {
        const status = {
          isValid: true,
          passwordPolicy: this
        };
        this.validatePasswordLengthOptions(password, status);
        this.validatePasswordCharacterOptions(password, status);
        status.isValid && (status.isValid = status.meetsMinPasswordLength ?? true);
        status.isValid && (status.isValid = status.meetsMaxPasswordLength ?? true);
        status.isValid && (status.isValid = status.containsLowercaseLetter ?? true);
        status.isValid && (status.isValid = status.containsUppercaseLetter ?? true);
        status.isValid && (status.isValid = status.containsNumericCharacter ?? true);
        status.isValid && (status.isValid = status.containsNonAlphanumericCharacter ?? true);
        return status;
      }
      /**
       * Validates that the password meets the length options for the policy.
       *
       * @param password Password to validate.
       * @param status Validation status.
       */
      validatePasswordLengthOptions(password, status) {
        const minPasswordLength = this.customStrengthOptions.minPasswordLength;
        const maxPasswordLength = this.customStrengthOptions.maxPasswordLength;
        if (minPasswordLength) {
          status.meetsMinPasswordLength = password.length >= minPasswordLength;
        }
        if (maxPasswordLength) {
          status.meetsMaxPasswordLength = password.length <= maxPasswordLength;
        }
      }
      /**
       * Validates that the password meets the character options for the policy.
       *
       * @param password Password to validate.
       * @param status Validation status.
       */
      validatePasswordCharacterOptions(password, status) {
        this.updatePasswordCharacterOptionsStatuses(
          status,
          /* containsLowercaseCharacter= */
          false,
          /* containsUppercaseCharacter= */
          false,
          /* containsNumericCharacter= */
          false,
          /* containsNonAlphanumericCharacter= */
          false
        );
        let passwordChar;
        for (let i = 0; i < password.length; i++) {
          passwordChar = password.charAt(i);
          this.updatePasswordCharacterOptionsStatuses(
            status,
            /* containsLowercaseCharacter= */
            passwordChar >= "a" && passwordChar <= "z",
            /* containsUppercaseCharacter= */
            passwordChar >= "A" && passwordChar <= "Z",
            /* containsNumericCharacter= */
            passwordChar >= "0" && passwordChar <= "9",
            /* containsNonAlphanumericCharacter= */
            this.allowedNonAlphanumericCharacters.includes(passwordChar)
          );
        }
      }
      /**
       * Updates the running validation status with the statuses for the character options.
       * Expected to be called each time a character is processed to update each option status
       * based on the current character.
       *
       * @param status Validation status.
       * @param containsLowercaseCharacter Whether the character is a lowercase letter.
       * @param containsUppercaseCharacter Whether the character is an uppercase letter.
       * @param containsNumericCharacter Whether the character is a numeric character.
       * @param containsNonAlphanumericCharacter Whether the character is a non-alphanumeric character.
       */
      updatePasswordCharacterOptionsStatuses(status, containsLowercaseCharacter, containsUppercaseCharacter, containsNumericCharacter, containsNonAlphanumericCharacter) {
        if (this.customStrengthOptions.containsLowercaseLetter) {
          status.containsLowercaseLetter || (status.containsLowercaseLetter = containsLowercaseCharacter);
        }
        if (this.customStrengthOptions.containsUppercaseLetter) {
          status.containsUppercaseLetter || (status.containsUppercaseLetter = containsUppercaseCharacter);
        }
        if (this.customStrengthOptions.containsNumericCharacter) {
          status.containsNumericCharacter || (status.containsNumericCharacter = containsNumericCharacter);
        }
        if (this.customStrengthOptions.containsNonAlphanumericCharacter) {
          status.containsNonAlphanumericCharacter || (status.containsNonAlphanumericCharacter = containsNonAlphanumericCharacter);
        }
      }
    };
    AuthImpl = class {
      constructor(app2, heartbeatServiceProvider, appCheckServiceProvider, config) {
        this.app = app2;
        this.heartbeatServiceProvider = heartbeatServiceProvider;
        this.appCheckServiceProvider = appCheckServiceProvider;
        this.config = config;
        this.currentUser = null;
        this.emulatorConfig = null;
        this.operations = Promise.resolve();
        this.authStateSubscription = new Subscription(this);
        this.idTokenSubscription = new Subscription(this);
        this.beforeStateQueue = new AuthMiddlewareQueue(this);
        this.redirectUser = null;
        this.isProactiveRefreshEnabled = false;
        this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION = 1;
        this._canInitEmulator = true;
        this._isInitialized = false;
        this._deleted = false;
        this._initializationPromise = null;
        this._popupRedirectResolver = null;
        this._errorFactory = _DEFAULT_AUTH_ERROR_FACTORY;
        this._agentRecaptchaConfig = null;
        this._tenantRecaptchaConfigs = {};
        this._projectPasswordPolicy = null;
        this._tenantPasswordPolicies = {};
        this._resolvePersistenceManagerAvailable = void 0;
        this.lastNotifiedUid = void 0;
        this.languageCode = null;
        this.tenantId = null;
        this.settings = { appVerificationDisabledForTesting: false };
        this.frameworks = [];
        this.name = app2.name;
        this.clientVersion = config.sdkClientVersion;
        this._persistenceManagerAvailable = new Promise((resolve) => this._resolvePersistenceManagerAvailable = resolve);
      }
      _initializeWithPersistence(persistenceHierarchy, popupRedirectResolver) {
        if (popupRedirectResolver) {
          this._popupRedirectResolver = _getInstance(popupRedirectResolver);
        }
        this._initializationPromise = this.queue(async () => {
          if (this._deleted) {
            return;
          }
          try {
            this.persistenceManager = await PersistenceUserManager.create(this, persistenceHierarchy);
          } catch (e) {
            _logWarn(`Failed to initialize persistence: ${e}`);
            this.persistenceManager = await PersistenceUserManager.create(this, []);
          } finally {
            this._resolvePersistenceManagerAvailable?.();
          }
          if (this._deleted) {
            return;
          }
          if (this._popupRedirectResolver?._shouldInitProactively) {
            try {
              await this._popupRedirectResolver._initialize(this);
            } catch (e) {
            }
          }
          try {
            await this.initializeCurrentUser(popupRedirectResolver);
          } catch (e) {
            _logWarn(`Failed to initialize current user: ${e}`);
            await this.directlySetCurrentUser(null).catch(() => {
            });
          }
          this.lastNotifiedUid = this.currentUser?.uid || null;
          if (this._deleted) {
            return;
          }
          this._isInitialized = true;
        });
        return this._initializationPromise;
      }
      /**
       * If the persistence is changed in another window, the user manager will let us know
       */
      async _onStorageEvent() {
        if (this._deleted) {
          return;
        }
        const user = await this.assertedPersistence.getCurrentUser();
        if (!this.currentUser && !user) {
          return;
        }
        if (this.currentUser && user && this.currentUser.uid === user.uid) {
          this._currentUser._assign(user);
          await this.currentUser.getIdToken();
          return;
        }
        await this._updateCurrentUser(
          user,
          /* skipBeforeStateCallbacks */
          true
        );
      }
      async initializeCurrentUserFromIdToken(idToken) {
        try {
          const response = await getAccountInfo(this, { idToken });
          const user = await UserImpl._fromGetAccountInfoResponse(this, response, idToken);
          await this.directlySetCurrentUser(user);
        } catch (err) {
          console.warn("FirebaseServerApp could not login user with provided authIdToken: ", err);
          await this.directlySetCurrentUser(null);
        }
      }
      async initializeCurrentUser(popupRedirectResolver) {
        if (_isFirebaseServerApp(this.app)) {
          const idToken = this.app.settings.authIdToken;
          if (idToken) {
            return new Promise((resolve) => {
              setTimeout(() => this.initializeCurrentUserFromIdToken(idToken).then(resolve, resolve));
            });
          } else {
            return this.directlySetCurrentUser(null);
          }
        }
        const previouslyStoredUser = await this.assertedPersistence.getCurrentUser();
        let futureCurrentUser = previouslyStoredUser;
        let needsTocheckMiddleware = false;
        if (popupRedirectResolver && this.config.authDomain) {
          await this.getOrInitRedirectPersistenceManager();
          const redirectUserEventId = this.redirectUser?._redirectEventId;
          const storedUserEventId = futureCurrentUser?._redirectEventId;
          const result = await this.tryRedirectSignIn(popupRedirectResolver);
          if ((!redirectUserEventId || redirectUserEventId === storedUserEventId) && result?.user) {
            futureCurrentUser = result.user;
            needsTocheckMiddleware = true;
          }
        }
        if (!futureCurrentUser) {
          return this.directlySetCurrentUser(null);
        }
        if (!futureCurrentUser._redirectEventId) {
          if (needsTocheckMiddleware) {
            try {
              await this.beforeStateQueue.runMiddleware(futureCurrentUser);
            } catch (e) {
              futureCurrentUser = previouslyStoredUser;
              this._popupRedirectResolver._overrideRedirectResult(this, () => Promise.reject(e));
            }
          }
          if (futureCurrentUser) {
            return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
          } else {
            return this.directlySetCurrentUser(null);
          }
        }
        _assert(
          this._popupRedirectResolver,
          this,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        await this.getOrInitRedirectPersistenceManager();
        if (this.redirectUser && this.redirectUser._redirectEventId === futureCurrentUser._redirectEventId) {
          return this.directlySetCurrentUser(futureCurrentUser);
        }
        return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
      }
      async tryRedirectSignIn(redirectResolver) {
        let result = null;
        try {
          result = await this._popupRedirectResolver._completeRedirectFn(this, redirectResolver, true);
        } catch (e) {
          await this._setRedirectUser(null);
        }
        return result;
      }
      async reloadAndSetCurrentUserOrClear(user) {
        try {
          await _reloadWithoutSaving(user);
        } catch (e) {
          if (e?.code !== `auth/${"network-request-failed"}`) {
            return this.directlySetCurrentUser(null);
          }
        }
        return this.directlySetCurrentUser(user);
      }
      useDeviceLanguage() {
        this.languageCode = _getUserLanguage();
      }
      async _delete() {
        this._deleted = true;
      }
      async updateCurrentUser(userExtern) {
        if (_isFirebaseServerApp(this.app)) {
          return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
        }
        const user = userExtern ? getModularInstance(userExtern) : null;
        if (user) {
          _assert(
            user.auth.config.apiKey === this.config.apiKey,
            this,
            "invalid-user-token"
            /* AuthErrorCode.INVALID_AUTH */
          );
        }
        return this._updateCurrentUser(user && user._clone(this));
      }
      async _updateCurrentUser(user, skipBeforeStateCallbacks = false) {
        if (this._deleted) {
          return;
        }
        if (user) {
          _assert(
            this.tenantId === user.tenantId,
            this,
            "tenant-id-mismatch"
            /* AuthErrorCode.TENANT_ID_MISMATCH */
          );
        }
        if (!skipBeforeStateCallbacks) {
          await this.beforeStateQueue.runMiddleware(user);
        }
        return this.queue(async () => {
          await this.directlySetCurrentUser(user);
          this.notifyAuthListeners();
        });
      }
      async signOut() {
        if (_isFirebaseServerApp(this.app)) {
          return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
        }
        await this.beforeStateQueue.runMiddleware(null);
        if (this.redirectPersistenceManager || this._popupRedirectResolver) {
          await this._setRedirectUser(null);
        }
        return this._updateCurrentUser(
          null,
          /* skipBeforeStateCallbacks */
          true
        );
      }
      setPersistence(persistence) {
        if (_isFirebaseServerApp(this.app)) {
          return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
        }
        return this.queue(async () => {
          await this.assertedPersistence.setPersistence(_getInstance(persistence));
        });
      }
      _getRecaptchaConfig() {
        if (this.tenantId == null) {
          return this._agentRecaptchaConfig;
        } else {
          return this._tenantRecaptchaConfigs[this.tenantId];
        }
      }
      async validatePassword(password) {
        if (!this._getPasswordPolicyInternal()) {
          await this._updatePasswordPolicy();
        }
        const passwordPolicy = this._getPasswordPolicyInternal();
        if (passwordPolicy.schemaVersion !== this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION) {
          return Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version", {}));
        }
        return passwordPolicy.validatePassword(password);
      }
      _getPasswordPolicyInternal() {
        if (this.tenantId === null) {
          return this._projectPasswordPolicy;
        } else {
          return this._tenantPasswordPolicies[this.tenantId];
        }
      }
      async _updatePasswordPolicy() {
        const response = await _getPasswordPolicy(this);
        const passwordPolicy = new PasswordPolicyImpl(response);
        if (this.tenantId === null) {
          this._projectPasswordPolicy = passwordPolicy;
        } else {
          this._tenantPasswordPolicies[this.tenantId] = passwordPolicy;
        }
      }
      _getPersistenceType() {
        return this.assertedPersistence.persistence.type;
      }
      _getPersistence() {
        return this.assertedPersistence.persistence;
      }
      _updateErrorMap(errorMap) {
        this._errorFactory = new ErrorFactory("auth", "Firebase", errorMap());
      }
      onAuthStateChanged(nextOrObserver, error, completed) {
        return this.registerStateListener(this.authStateSubscription, nextOrObserver, error, completed);
      }
      beforeAuthStateChanged(callback, onAbort) {
        return this.beforeStateQueue.pushCallback(callback, onAbort);
      }
      onIdTokenChanged(nextOrObserver, error, completed) {
        return this.registerStateListener(this.idTokenSubscription, nextOrObserver, error, completed);
      }
      authStateReady() {
        return new Promise((resolve, reject) => {
          if (this.currentUser) {
            resolve();
          } else {
            const unsubscribe = this.onAuthStateChanged(() => {
              unsubscribe();
              resolve();
            }, reject);
          }
        });
      }
      /**
       * Revokes the given access token. Currently only supports Apple OAuth access tokens.
       */
      async revokeAccessToken(token) {
        if (this.currentUser) {
          const idToken = await this.currentUser.getIdToken();
          const request = {
            providerId: "apple.com",
            tokenType: "ACCESS_TOKEN",
            token,
            idToken
          };
          if (this.tenantId != null) {
            request.tenantId = this.tenantId;
          }
          await revokeToken(this, request);
        }
      }
      toJSON() {
        return {
          apiKey: this.config.apiKey,
          authDomain: this.config.authDomain,
          appName: this.name,
          currentUser: this._currentUser?.toJSON()
        };
      }
      async _setRedirectUser(user, popupRedirectResolver) {
        const redirectManager = await this.getOrInitRedirectPersistenceManager(popupRedirectResolver);
        return user === null ? redirectManager.removeCurrentUser() : redirectManager.setCurrentUser(user);
      }
      async getOrInitRedirectPersistenceManager(popupRedirectResolver) {
        if (!this.redirectPersistenceManager) {
          const resolver = popupRedirectResolver && _getInstance(popupRedirectResolver) || this._popupRedirectResolver;
          _assert(
            resolver,
            this,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          this.redirectPersistenceManager = await PersistenceUserManager.create(
            this,
            [_getInstance(resolver._redirectPersistence)],
            "redirectUser"
            /* KeyName.REDIRECT_USER */
          );
          this.redirectUser = await this.redirectPersistenceManager.getCurrentUser();
        }
        return this.redirectPersistenceManager;
      }
      async _redirectUserForId(id) {
        if (this._isInitialized) {
          await this.queue(async () => {
          });
        }
        if (this._currentUser?._redirectEventId === id) {
          return this._currentUser;
        }
        if (this.redirectUser?._redirectEventId === id) {
          return this.redirectUser;
        }
        return null;
      }
      async _persistUserIfCurrent(user) {
        if (user === this.currentUser) {
          return this.queue(async () => this.directlySetCurrentUser(user));
        }
      }
      /** Notifies listeners only if the user is current */
      _notifyListenersIfCurrent(user) {
        if (user === this.currentUser) {
          this.notifyAuthListeners();
        }
      }
      _key() {
        return `${this.config.authDomain}:${this.config.apiKey}:${this.name}`;
      }
      _startProactiveRefresh() {
        this.isProactiveRefreshEnabled = true;
        if (this.currentUser) {
          this._currentUser._startProactiveRefresh();
        }
      }
      _stopProactiveRefresh() {
        this.isProactiveRefreshEnabled = false;
        if (this.currentUser) {
          this._currentUser._stopProactiveRefresh();
        }
      }
      /** Returns the current user cast as the internal type */
      get _currentUser() {
        return this.currentUser;
      }
      notifyAuthListeners() {
        if (!this._isInitialized) {
          return;
        }
        this.idTokenSubscription.next(this.currentUser);
        const currentUid = this.currentUser?.uid ?? null;
        if (this.lastNotifiedUid !== currentUid) {
          this.lastNotifiedUid = currentUid;
          this.authStateSubscription.next(this.currentUser);
        }
      }
      registerStateListener(subscription, nextOrObserver, error, completed) {
        if (this._deleted) {
          return () => {
          };
        }
        const cb = typeof nextOrObserver === "function" ? nextOrObserver : nextOrObserver.next.bind(nextOrObserver);
        let isUnsubscribed = false;
        const promise = this._isInitialized ? Promise.resolve() : this._initializationPromise;
        _assert(
          promise,
          this,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        promise.then(() => {
          if (isUnsubscribed) {
            return;
          }
          cb(this.currentUser);
        }).catch((err) => {
          if (isUnsubscribed) {
            return;
          }
          if (typeof nextOrObserver !== "function" && nextOrObserver.error) {
            nextOrObserver.error(err);
          } else if (error) {
            error(err);
          } else {
            throw err;
          }
        });
        if (typeof nextOrObserver === "function") {
          const unsubscribe = subscription.addObserver(nextOrObserver, error, completed);
          return () => {
            isUnsubscribed = true;
            unsubscribe();
          };
        } else {
          const unsubscribe = subscription.addObserver(nextOrObserver);
          return () => {
            isUnsubscribed = true;
            unsubscribe();
          };
        }
      }
      /**
       * Unprotected (from race conditions) method to set the current user. This
       * should only be called from within a queued callback. This is necessary
       * because the queue shouldn't rely on another queued callback.
       */
      async directlySetCurrentUser(user) {
        if (this.currentUser && this.currentUser !== user) {
          this._currentUser._stopProactiveRefresh();
        }
        if (user && this.isProactiveRefreshEnabled) {
          user._startProactiveRefresh();
        }
        this.currentUser = user;
        if (this.persistenceManager) {
          try {
            if (user) {
              await this.persistenceManager.setCurrentUser(user);
            } else {
              await this.persistenceManager.removeCurrentUser();
            }
          } catch (e) {
            const originalMessage = e?.message || String(e);
            const error = _errorWithCustomMessage(this, "internal-error", `An internal AuthError has occurred: ${originalMessage}`);
            error.customData = { originalError: e };
            throw error;
          }
        }
      }
      queue(action) {
        this.operations = this.operations.then(action, action);
        return this.operations;
      }
      get assertedPersistence() {
        _assert(
          this.persistenceManager,
          this,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        return this.persistenceManager;
      }
      _logFramework(framework) {
        if (!framework || this.frameworks.includes(framework)) {
          return;
        }
        this.frameworks.push(framework);
        this.frameworks.sort();
        this.clientVersion = _getClientVersion(this.config.clientPlatform, this._getFrameworks());
      }
      _getFrameworks() {
        return this.frameworks;
      }
      async _getAdditionalHeaders() {
        const headers = {
          [
            "X-Client-Version"
            /* HttpHeader.X_CLIENT_VERSION */
          ]: this.clientVersion
        };
        if (this.app.options.appId) {
          headers[
            "X-Firebase-gmpid"
            /* HttpHeader.X_FIREBASE_GMPID */
          ] = this.app.options.appId;
        }
        const heartbeatsHeader = await this.heartbeatServiceProvider.getImmediate({
          optional: true
        })?.getHeartbeatsHeader();
        if (heartbeatsHeader) {
          headers[
            "X-Firebase-Client"
            /* HttpHeader.X_FIREBASE_CLIENT */
          ] = heartbeatsHeader;
        }
        const appCheckToken = await this._getAppCheckToken();
        if (appCheckToken) {
          headers[
            "X-Firebase-AppCheck"
            /* HttpHeader.X_FIREBASE_APP_CHECK */
          ] = appCheckToken;
        }
        return headers;
      }
      async _getAppCheckToken() {
        if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) {
          return this.app.settings.appCheckToken;
        }
        const appCheckTokenResult = await this.appCheckServiceProvider.getImmediate({ optional: true })?.getToken();
        if (appCheckTokenResult?.error) {
          _logWarn(`Error while retrieving App Check token: ${appCheckTokenResult.error}`);
        }
        return appCheckTokenResult?.token;
      }
    };
    Subscription = class {
      constructor(auth2) {
        this.auth = auth2;
        this.observer = null;
        this.addObserver = createSubscribe((observer) => this.observer = observer);
      }
      get next() {
        _assert(
          this.observer,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        return this.observer.next.bind(this.observer);
      }
    };
    externalJSProvider = {
      async loadJS() {
        throw new Error("Unable to load external scripts");
      },
      recaptchaV2Script: "",
      recaptchaEnterpriseScript: "",
      gapiScript: ""
    };
    _SOLVE_TIME_MS = 500;
    _EXPIRATION_TIME_MS = 6e4;
    _WIDGET_ID_START = 1e12;
    MockReCaptcha = class {
      constructor(auth2) {
        this.auth = auth2;
        this.counter = _WIDGET_ID_START;
        this._widgets = /* @__PURE__ */ new Map();
      }
      render(container, parameters) {
        const id = this.counter;
        this._widgets.set(id, new MockWidget(container, this.auth.name, parameters || {}));
        this.counter++;
        return id;
      }
      reset(optWidgetId) {
        const id = optWidgetId || _WIDGET_ID_START;
        void this._widgets.get(id)?.delete();
        this._widgets.delete(id);
      }
      getResponse(optWidgetId) {
        const id = optWidgetId || _WIDGET_ID_START;
        return this._widgets.get(id)?.getResponse() || "";
      }
      async execute(optWidgetId) {
        const id = optWidgetId || _WIDGET_ID_START;
        void this._widgets.get(id)?.execute();
        return "";
      }
    };
    MockGreCAPTCHATopLevel = class {
      constructor() {
        this.enterprise = new MockGreCAPTCHA();
      }
      ready(callback) {
        callback();
      }
      execute(_siteKey, _options) {
        return Promise.resolve("token");
      }
      render(_container, _parameters) {
        return "";
      }
    };
    MockGreCAPTCHA = class {
      ready(callback) {
        callback();
      }
      execute(_siteKey, _options) {
        return Promise.resolve("token");
      }
      render(_container, _parameters) {
        return "";
      }
    };
    MockWidget = class {
      constructor(containerOrId, appName, params) {
        this.params = params;
        this.timerId = null;
        this.deleted = false;
        this.responseToken = null;
        this.clickHandler = () => {
          this.execute();
        };
        const container = typeof containerOrId === "string" ? document.getElementById(containerOrId) : containerOrId;
        _assert(container, "argument-error", { appName });
        this.container = container;
        this.isVisible = this.params.size !== "invisible";
        if (this.isVisible) {
          this.execute();
        } else {
          this.container.addEventListener("click", this.clickHandler);
        }
      }
      getResponse() {
        this.checkIfDeleted();
        return this.responseToken;
      }
      delete() {
        this.checkIfDeleted();
        this.deleted = true;
        if (this.timerId) {
          clearTimeout(this.timerId);
          this.timerId = null;
        }
        this.container.removeEventListener("click", this.clickHandler);
      }
      execute() {
        this.checkIfDeleted();
        if (this.timerId) {
          return;
        }
        this.timerId = window.setTimeout(() => {
          this.responseToken = generateRandomAlphaNumericString(50);
          const { callback, "expired-callback": expiredCallback } = this.params;
          if (callback) {
            try {
              callback(this.responseToken);
            } catch (e) {
            }
          }
          this.timerId = window.setTimeout(() => {
            this.timerId = null;
            this.responseToken = null;
            if (expiredCallback) {
              try {
                expiredCallback();
              } catch (e) {
              }
            }
            if (this.isVisible) {
              this.execute();
            }
          }, _EXPIRATION_TIME_MS);
        }, _SOLVE_TIME_MS);
      }
      checkIfDeleted() {
        if (this.deleted) {
          throw new Error("reCAPTCHA mock was already deleted!");
        }
      }
    };
    RECAPTCHA_ENTERPRISE_VERIFIER_TYPE = "recaptcha-enterprise";
    FAKE_TOKEN = "NO_RECAPTCHA";
    RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME = "onFirebaseAuthREInstanceReady";
    RecaptchaEnterpriseVerifier = class _RecaptchaEnterpriseVerifier {
      /**
       *
       * @param authExtern - The corresponding Firebase {@link Auth} instance.
       *
       */
      constructor(authExtern) {
        this.type = RECAPTCHA_ENTERPRISE_VERIFIER_TYPE;
        this.auth = _castAuth(authExtern);
      }
      /**
       * Executes the verification process.
       *
       * @returns A Promise for a token that can be used to assert the validity of a request.
       */
      async verify(action = "verify", forceRefresh = false) {
        async function retrieveSiteKey(auth2) {
          if (!forceRefresh) {
            if (auth2.tenantId == null && auth2._agentRecaptchaConfig != null) {
              return auth2._agentRecaptchaConfig.siteKey;
            }
            if (auth2.tenantId != null && auth2._tenantRecaptchaConfigs[auth2.tenantId] !== void 0) {
              return auth2._tenantRecaptchaConfigs[auth2.tenantId].siteKey;
            }
          }
          return new Promise(async (resolve, reject) => {
            getRecaptchaConfig(auth2, {
              clientType: "CLIENT_TYPE_WEB",
              version: "RECAPTCHA_ENTERPRISE"
              /* RecaptchaVersion.ENTERPRISE */
            }).then((response) => {
              if (response.recaptchaKey === void 0) {
                reject(new Error("recaptcha Enterprise site key undefined"));
              } else {
                const config = new RecaptchaConfig(response);
                if (auth2.tenantId == null) {
                  auth2._agentRecaptchaConfig = config;
                } else {
                  auth2._tenantRecaptchaConfigs[auth2.tenantId] = config;
                }
                return resolve(config.siteKey);
              }
            }).catch((error) => {
              reject(error);
            });
          });
        }
        function retrieveRecaptchaToken(siteKey, resolve, reject) {
          const grecaptcha = window.grecaptcha;
          if (isEnterprise(grecaptcha)) {
            grecaptcha.enterprise.ready(() => {
              grecaptcha.enterprise.execute(siteKey, { action }).then((token) => {
                resolve(token);
              }).catch(() => {
                resolve(FAKE_TOKEN);
              });
            });
          } else {
            reject(Error("No reCAPTCHA enterprise script loaded."));
          }
        }
        if (this.auth.settings.appVerificationDisabledForTesting) {
          const mockRecaptcha = new MockGreCAPTCHATopLevel();
          return mockRecaptcha.execute("siteKey", { action: "verify" });
        }
        return new Promise((resolve, reject) => {
          retrieveSiteKey(this.auth).then(async (siteKey) => {
            if (!forceRefresh && isEnterprise(window.grecaptcha) && // If download has already been initiated, do not trigger another
            // download, await the promise here.
            _RecaptchaEnterpriseVerifier.scriptInjectionDeferred) {
              await _RecaptchaEnterpriseVerifier.scriptInjectionDeferred.promise;
              retrieveRecaptchaToken(siteKey, resolve, reject);
            } else {
              if (typeof window === "undefined") {
                reject(new Error("RecaptchaVerifier is only supported in browser"));
                return;
              }
              let url = _recaptchaEnterpriseScriptUrl();
              if (url.length !== 0) {
                url += siteKey + `&onload=${RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME}`;
              }
              _RecaptchaEnterpriseVerifier.scriptInjectionDeferred = new Deferred();
              window[RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME] = () => {
                _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.resolve();
              };
              _loadJS(url).then(() => _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.promise).then(() => {
                retrieveRecaptchaToken(siteKey, resolve, reject);
              }).catch((error) => {
                reject(error);
              });
            }
          }).catch((error) => {
            reject(error);
          });
        });
      }
    };
    RecaptchaEnterpriseVerifier.scriptInjectionDeferred = null;
    AuthCredential = class {
      /** @internal */
      constructor(providerId, signInMethod) {
        this.providerId = providerId;
        this.signInMethod = signInMethod;
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns a JSON-serializable representation of this object.
       */
      toJSON() {
        return debugFail("not implemented");
      }
      /** @internal */
      _getIdTokenResponse(_auth) {
        return debugFail("not implemented");
      }
      /** @internal */
      _linkToIdToken(_auth, _idToken) {
        return debugFail("not implemented");
      }
      /** @internal */
      _getReauthenticationResolver(_auth) {
        return debugFail("not implemented");
      }
    };
    EmailAuthCredential = class _EmailAuthCredential extends AuthCredential {
      /** @internal */
      constructor(_email, _password, signInMethod, _tenantId = null) {
        super("password", signInMethod);
        this._email = _email;
        this._password = _password;
        this._tenantId = _tenantId;
      }
      /** @internal */
      static _fromEmailAndPassword(email, password) {
        return new _EmailAuthCredential(
          email,
          password,
          "password"
          /* SignInMethod.EMAIL_PASSWORD */
        );
      }
      /** @internal */
      static _fromEmailAndCode(email, oobCode, tenantId = null) {
        return new _EmailAuthCredential(email, oobCode, "emailLink", tenantId);
      }
      /** {@inheritdoc AuthCredential.toJSON} */
      toJSON() {
        return {
          email: this._email,
          password: this._password,
          signInMethod: this.signInMethod,
          tenantId: this._tenantId
        };
      }
      /**
       * Static method to deserialize a JSON representation of an object into an {@link  AuthCredential}.
       *
       * @param json - Either `object` or the stringified representation of the object. When string is
       * provided, `JSON.parse` would be called first.
       *
       * @returns If the JSON input does not represent an {@link AuthCredential}, null is returned.
       */
      static fromJSON(json) {
        const obj = typeof json === "string" ? JSON.parse(json) : json;
        if (obj?.email && obj?.password) {
          if (obj.signInMethod === "password") {
            return this._fromEmailAndPassword(obj.email, obj.password);
          } else if (obj.signInMethod === "emailLink") {
            return this._fromEmailAndCode(obj.email, obj.password, obj.tenantId);
          }
        }
        return null;
      }
      /** @internal */
      async _getIdTokenResponse(auth2) {
        switch (this.signInMethod) {
          case "password":
            const request = {
              returnSecureToken: true,
              email: this._email,
              password: this._password,
              clientType: "CLIENT_TYPE_WEB"
              /* RecaptchaClientType.WEB */
            };
            return handleRecaptchaFlow(
              auth2,
              request,
              "signInWithPassword",
              signInWithPassword,
              "EMAIL_PASSWORD_PROVIDER"
              /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
            );
          case "emailLink":
            return signInWithEmailLink$1(auth2, {
              email: this._email,
              oobCode: this._password
            });
          default:
            _fail(
              auth2,
              "internal-error"
              /* AuthErrorCode.INTERNAL_ERROR */
            );
        }
      }
      /** @internal */
      async _linkToIdToken(auth2, idToken) {
        switch (this.signInMethod) {
          case "password":
            const request = {
              idToken,
              returnSecureToken: true,
              email: this._email,
              password: this._password,
              clientType: "CLIENT_TYPE_WEB"
              /* RecaptchaClientType.WEB */
            };
            return handleRecaptchaFlow(
              auth2,
              request,
              "signUpPassword",
              linkEmailPassword,
              "EMAIL_PASSWORD_PROVIDER"
              /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
            );
          case "emailLink":
            return signInWithEmailLinkForLinking(auth2, {
              idToken,
              email: this._email,
              oobCode: this._password
            });
          default:
            _fail(
              auth2,
              "internal-error"
              /* AuthErrorCode.INTERNAL_ERROR */
            );
        }
      }
      /** @internal */
      _getReauthenticationResolver(auth2) {
        return this._getIdTokenResponse(auth2);
      }
    };
    IDP_REQUEST_URI$1 = "http://localhost";
    OAuthCredential = class _OAuthCredential extends AuthCredential {
      constructor() {
        super(...arguments);
        this.pendingToken = null;
      }
      /** @internal */
      static _fromParams(params) {
        const cred = new _OAuthCredential(params.providerId, params.signInMethod);
        if (params.idToken || params.accessToken) {
          if (params.idToken) {
            cred.idToken = params.idToken;
          }
          if (params.accessToken) {
            cred.accessToken = params.accessToken;
          }
          if (params.nonce && !params.pendingToken) {
            cred.nonce = params.nonce;
          }
          if (params.pendingToken) {
            cred.pendingToken = params.pendingToken;
          }
        } else if (params.oauthToken && params.oauthTokenSecret) {
          cred.accessToken = params.oauthToken;
          cred.secret = params.oauthTokenSecret;
        } else {
          _fail(
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
        }
        return cred;
      }
      /** {@inheritdoc AuthCredential.toJSON}  */
      toJSON() {
        return {
          idToken: this.idToken,
          accessToken: this.accessToken,
          secret: this.secret,
          nonce: this.nonce,
          pendingToken: this.pendingToken,
          providerId: this.providerId,
          signInMethod: this.signInMethod
        };
      }
      /**
       * Static method to deserialize a JSON representation of an object into an
       * {@link  AuthCredential}.
       *
       * @param json - Input can be either Object or the stringified representation of the object.
       * When string is provided, JSON.parse would be called first.
       *
       * @returns If the JSON input does not represent an {@link  AuthCredential}, null is returned.
       */
      static fromJSON(json) {
        const obj = typeof json === "string" ? JSON.parse(json) : json;
        const { providerId, signInMethod, ...rest } = obj;
        if (!providerId || !signInMethod) {
          return null;
        }
        const cred = new _OAuthCredential(providerId, signInMethod);
        cred.idToken = rest.idToken || void 0;
        cred.accessToken = rest.accessToken || void 0;
        cred.secret = rest.secret;
        cred.nonce = rest.nonce;
        cred.pendingToken = rest.pendingToken || null;
        return cred;
      }
      /** @internal */
      _getIdTokenResponse(auth2) {
        const request = this.buildRequest();
        return signInWithIdp(auth2, request);
      }
      /** @internal */
      _linkToIdToken(auth2, idToken) {
        const request = this.buildRequest();
        request.idToken = idToken;
        return signInWithIdp(auth2, request);
      }
      /** @internal */
      _getReauthenticationResolver(auth2) {
        const request = this.buildRequest();
        request.autoCreate = false;
        return signInWithIdp(auth2, request);
      }
      buildRequest() {
        const request = {
          requestUri: IDP_REQUEST_URI$1,
          returnSecureToken: true
        };
        if (this.pendingToken) {
          request.pendingToken = this.pendingToken;
        } else {
          const postBody = {};
          if (this.idToken) {
            postBody["id_token"] = this.idToken;
          }
          if (this.accessToken) {
            postBody["access_token"] = this.accessToken;
          }
          if (this.secret) {
            postBody["oauth_token_secret"] = this.secret;
          }
          postBody["providerId"] = this.providerId;
          if (this.nonce && !this.pendingToken) {
            postBody["nonce"] = this.nonce;
          }
          request.postBody = querystring(postBody);
        }
        return request;
      }
    };
    VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_ = {
      [
        "USER_NOT_FOUND"
        /* ServerError.USER_NOT_FOUND */
      ]: "user-not-found"
      /* AuthErrorCode.USER_DELETED */
    };
    PhoneAuthCredential = class _PhoneAuthCredential extends AuthCredential {
      constructor(params) {
        super(
          "phone",
          "phone"
          /* SignInMethod.PHONE */
        );
        this.params = params;
      }
      /** @internal */
      static _fromVerification(verificationId, verificationCode) {
        return new _PhoneAuthCredential({ verificationId, verificationCode });
      }
      /** @internal */
      static _fromTokenResponse(phoneNumber, temporaryProof) {
        return new _PhoneAuthCredential({ phoneNumber, temporaryProof });
      }
      /** @internal */
      _getIdTokenResponse(auth2) {
        return signInWithPhoneNumber$1(auth2, this._makeVerificationRequest());
      }
      /** @internal */
      _linkToIdToken(auth2, idToken) {
        return linkWithPhoneNumber$1(auth2, {
          idToken,
          ...this._makeVerificationRequest()
        });
      }
      /** @internal */
      _getReauthenticationResolver(auth2) {
        return verifyPhoneNumberForExisting(auth2, this._makeVerificationRequest());
      }
      /** @internal */
      _makeVerificationRequest() {
        const { temporaryProof, phoneNumber, verificationId, verificationCode } = this.params;
        if (temporaryProof && phoneNumber) {
          return { temporaryProof, phoneNumber };
        }
        return {
          sessionInfo: verificationId,
          code: verificationCode
        };
      }
      /** {@inheritdoc AuthCredential.toJSON} */
      toJSON() {
        const obj = {
          providerId: this.providerId
        };
        if (this.params.phoneNumber) {
          obj.phoneNumber = this.params.phoneNumber;
        }
        if (this.params.temporaryProof) {
          obj.temporaryProof = this.params.temporaryProof;
        }
        if (this.params.verificationCode) {
          obj.verificationCode = this.params.verificationCode;
        }
        if (this.params.verificationId) {
          obj.verificationId = this.params.verificationId;
        }
        return obj;
      }
      /** Generates a phone credential based on a plain object or a JSON string. */
      static fromJSON(json) {
        if (typeof json === "string") {
          json = JSON.parse(json);
        }
        const { verificationId, verificationCode, phoneNumber, temporaryProof } = json;
        if (!verificationCode && !verificationId && !phoneNumber && !temporaryProof) {
          return null;
        }
        return new _PhoneAuthCredential({
          verificationId,
          verificationCode,
          phoneNumber,
          temporaryProof
        });
      }
    };
    ActionCodeURL = class _ActionCodeURL {
      /**
       * @param actionLink - The link from which to extract the URL.
       * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
       *
       * @internal
       */
      constructor(actionLink) {
        const searchParams = querystringDecode(extractQuerystring(actionLink));
        const apiKey = searchParams[
          "apiKey"
          /* QueryField.API_KEY */
        ] ?? null;
        const code = searchParams[
          "oobCode"
          /* QueryField.CODE */
        ] ?? null;
        const operation = parseMode(searchParams[
          "mode"
          /* QueryField.MODE */
        ] ?? null);
        _assert(
          apiKey && code && operation,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        this.apiKey = apiKey;
        this.operation = operation;
        this.code = code;
        this.continueUrl = searchParams[
          "continueUrl"
          /* QueryField.CONTINUE_URL */
        ] ?? null;
        this.languageCode = searchParams[
          "lang"
          /* QueryField.LANGUAGE_CODE */
        ] ?? null;
        this.tenantId = searchParams[
          "tenantId"
          /* QueryField.TENANT_ID */
        ] ?? null;
      }
      /**
       * Parses the email action link string and returns an {@link ActionCodeURL} if the link is valid,
       * otherwise returns null.
       *
       * @param link  - The email action link string.
       * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
       *
       * @public
       */
      static parseLink(link) {
        const actionLink = parseDeepLink(link);
        try {
          return new _ActionCodeURL(actionLink);
        } catch {
          return null;
        }
      }
    };
    EmailAuthProvider = class _EmailAuthProvider {
      constructor() {
        this.providerId = _EmailAuthProvider.PROVIDER_ID;
      }
      /**
       * Initialize an {@link AuthCredential} using an email and password.
       *
       * @example
       * ```javascript
       * const authCredential = EmailAuthProvider.credential(email, password);
       * const userCredential = await signInWithCredential(auth, authCredential);
       * ```
       *
       * @example
       * ```javascript
       * const userCredential = await signInWithEmailAndPassword(auth, email, password);
       * ```
       *
       * @param email - Email address.
       * @param password - User account password.
       * @returns The auth provider credential.
       */
      static credential(email, password) {
        return EmailAuthCredential._fromEmailAndPassword(email, password);
      }
      /**
       * Initialize an {@link AuthCredential} using an email and an email link after a sign in with
       * email link operation.
       *
       * @example
       * ```javascript
       * const authCredential = EmailAuthProvider.credentialWithLink(auth, email, emailLink);
       * const userCredential = await signInWithCredential(auth, authCredential);
       * ```
       *
       * @example
       * ```javascript
       * await sendSignInLinkToEmail(auth, email);
       * // Obtain emailLink from user.
       * const userCredential = await signInWithEmailLink(auth, email, emailLink);
       * ```
       *
       * @param auth - The {@link Auth} instance used to verify the link.
       * @param email - Email address.
       * @param emailLink - Sign-in email link.
       * @returns - The auth provider credential.
       */
      static credentialWithLink(email, emailLink) {
        const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
        _assert(
          actionCodeUrl,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        return EmailAuthCredential._fromEmailAndCode(email, actionCodeUrl.code, actionCodeUrl.tenantId);
      }
    };
    EmailAuthProvider.PROVIDER_ID = "password";
    EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD = "password";
    EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD = "emailLink";
    FederatedAuthProvider = class {
      /**
       * Constructor for generic OAuth providers.
       *
       * @param providerId - Provider for which credentials should be generated.
       */
      constructor(providerId) {
        this.providerId = providerId;
        this.defaultLanguageCode = null;
        this.customParameters = {};
      }
      /**
       * Set the language gode.
       *
       * @param languageCode - language code
       */
      setDefaultLanguage(languageCode) {
        this.defaultLanguageCode = languageCode;
      }
      /**
       * Sets the OAuth custom parameters to pass in an OAuth request for popup and redirect sign-in
       * operations.
       *
       * @remarks
       * For a detailed list, check the reserved required OAuth 2.0 parameters such as `client_id`,
       * `redirect_uri`, `scope`, `response_type`, and `state` are not allowed and will be ignored.
       *
       * @param customOAuthParameters - The custom OAuth parameters to pass in the OAuth request.
       */
      setCustomParameters(customOAuthParameters) {
        this.customParameters = customOAuthParameters;
        return this;
      }
      /**
       * Retrieve the current list of {@link CustomParameters}.
       */
      getCustomParameters() {
        return this.customParameters;
      }
    };
    BaseOAuthProvider = class extends FederatedAuthProvider {
      constructor() {
        super(...arguments);
        this.scopes = [];
      }
      /**
       * Add an OAuth scope to the credential.
       *
       * @param scope - Provider OAuth scope to add.
       */
      addScope(scope) {
        if (!this.scopes.includes(scope)) {
          this.scopes.push(scope);
        }
        return this;
      }
      /**
       * Retrieve the current list of OAuth scopes.
       */
      getScopes() {
        return [...this.scopes];
      }
    };
    OAuthProvider = class _OAuthProvider extends BaseOAuthProvider {
      /**
       * Creates an {@link OAuthCredential} from a JSON string or a plain object.
       * @param json - A plain object or a JSON string
       */
      static credentialFromJSON(json) {
        const obj = typeof json === "string" ? JSON.parse(json) : json;
        _assert(
          "providerId" in obj && "signInMethod" in obj,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        return OAuthCredential._fromParams(obj);
      }
      /**
       * Creates a {@link OAuthCredential} from a generic OAuth provider's access token or ID token.
       *
       * @remarks
       * The raw nonce is required when an ID token with a nonce field is provided. The SHA-256 hash of
       * the raw nonce must match the nonce field in the ID token.
       *
       * @example
       * ```javascript
       * // `googleUser` from the onsuccess Google Sign In callback.
       * // Initialize a generate OAuth provider with a `google.com` providerId.
       * const provider = new OAuthProvider('google.com');
       * const credential = provider.credential({
       *   idToken: googleUser.getAuthResponse().id_token,
       * });
       * const result = await signInWithCredential(credential);
       * ```
       *
       * @param params - Either the options object containing the ID token, access token and raw nonce
       * or the ID token string.
       */
      credential(params) {
        return this._credential({ ...params, nonce: params.rawNonce });
      }
      /** An internal credential method that accepts more permissive options */
      _credential(params) {
        _assert(
          params.idToken || params.accessToken,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        return OAuthCredential._fromParams({
          ...params,
          providerId: this.providerId,
          signInMethod: this.providerId
        });
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromResult(userCredential) {
        return _OAuthProvider.oauthCredentialFromTaggedObject(userCredential);
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
       * thrown during a sign-in, link, or reauthenticate operation.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromError(error) {
        return _OAuthProvider.oauthCredentialFromTaggedObject(error.customData || {});
      }
      static oauthCredentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
        if (!tokenResponse) {
          return null;
        }
        const { oauthIdToken, oauthAccessToken, oauthTokenSecret, pendingToken, nonce, providerId } = tokenResponse;
        if (!oauthAccessToken && !oauthTokenSecret && !oauthIdToken && !pendingToken) {
          return null;
        }
        if (!providerId) {
          return null;
        }
        try {
          return new _OAuthProvider(providerId)._credential({
            idToken: oauthIdToken,
            accessToken: oauthAccessToken,
            nonce,
            pendingToken
          });
        } catch (e) {
          return null;
        }
      }
    };
    FacebookAuthProvider = class _FacebookAuthProvider extends BaseOAuthProvider {
      constructor() {
        super(
          "facebook.com"
          /* ProviderId.FACEBOOK */
        );
      }
      /**
       * Creates a credential for Facebook.
       *
       * @example
       * ```javascript
       * // `event` from the Facebook auth.authResponseChange callback.
       * const credential = FacebookAuthProvider.credential(event.authResponse.accessToken);
       * const result = await signInWithCredential(credential);
       * ```
       *
       * @param accessToken - Facebook access token.
       */
      static credential(accessToken) {
        return OAuthCredential._fromParams({
          providerId: _FacebookAuthProvider.PROVIDER_ID,
          signInMethod: _FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD,
          accessToken
        });
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromResult(userCredential) {
        return _FacebookAuthProvider.credentialFromTaggedObject(userCredential);
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
       * thrown during a sign-in, link, or reauthenticate operation.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromError(error) {
        return _FacebookAuthProvider.credentialFromTaggedObject(error.customData || {});
      }
      static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
        if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
          return null;
        }
        if (!tokenResponse.oauthAccessToken) {
          return null;
        }
        try {
          return _FacebookAuthProvider.credential(tokenResponse.oauthAccessToken);
        } catch {
          return null;
        }
      }
    };
    FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD = "facebook.com";
    FacebookAuthProvider.PROVIDER_ID = "facebook.com";
    GoogleAuthProvider = class _GoogleAuthProvider extends BaseOAuthProvider {
      constructor() {
        super(
          "google.com"
          /* ProviderId.GOOGLE */
        );
        this.addScope("profile");
      }
      /**
       * Creates a credential for Google. At least one of ID token and access token is required.
       *
       * @example
       * ```javascript
       * // \`googleUser\` from the onsuccess Google Sign In callback.
       * const credential = GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
       * const result = await signInWithCredential(credential);
       * ```
       *
       * @param idToken - Google ID token.
       * @param accessToken - Google access token.
       */
      static credential(idToken, accessToken) {
        return OAuthCredential._fromParams({
          providerId: _GoogleAuthProvider.PROVIDER_ID,
          signInMethod: _GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD,
          idToken,
          accessToken
        });
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromResult(userCredential) {
        return _GoogleAuthProvider.credentialFromTaggedObject(userCredential);
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
       * thrown during a sign-in, link, or reauthenticate operation.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromError(error) {
        return _GoogleAuthProvider.credentialFromTaggedObject(error.customData || {});
      }
      static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
        if (!tokenResponse) {
          return null;
        }
        const { oauthIdToken, oauthAccessToken } = tokenResponse;
        if (!oauthIdToken && !oauthAccessToken) {
          return null;
        }
        try {
          return _GoogleAuthProvider.credential(oauthIdToken, oauthAccessToken);
        } catch {
          return null;
        }
      }
    };
    GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD = "google.com";
    GoogleAuthProvider.PROVIDER_ID = "google.com";
    GithubAuthProvider = class _GithubAuthProvider extends BaseOAuthProvider {
      constructor() {
        super(
          "github.com"
          /* ProviderId.GITHUB */
        );
      }
      /**
       * Creates a credential for GitHub.
       *
       * @param accessToken - GitHub access token.
       */
      static credential(accessToken) {
        return OAuthCredential._fromParams({
          providerId: _GithubAuthProvider.PROVIDER_ID,
          signInMethod: _GithubAuthProvider.GITHUB_SIGN_IN_METHOD,
          accessToken
        });
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromResult(userCredential) {
        return _GithubAuthProvider.credentialFromTaggedObject(userCredential);
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
       * thrown during a sign-in, link, or reauthenticate operation.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromError(error) {
        return _GithubAuthProvider.credentialFromTaggedObject(error.customData || {});
      }
      static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
        if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
          return null;
        }
        if (!tokenResponse.oauthAccessToken) {
          return null;
        }
        try {
          return _GithubAuthProvider.credential(tokenResponse.oauthAccessToken);
        } catch {
          return null;
        }
      }
    };
    GithubAuthProvider.GITHUB_SIGN_IN_METHOD = "github.com";
    GithubAuthProvider.PROVIDER_ID = "github.com";
    TwitterAuthProvider = class _TwitterAuthProvider extends BaseOAuthProvider {
      constructor() {
        super(
          "twitter.com"
          /* ProviderId.TWITTER */
        );
      }
      /**
       * Creates a credential for Twitter.
       *
       * @param token - Twitter access token.
       * @param secret - Twitter secret.
       */
      static credential(token, secret) {
        return OAuthCredential._fromParams({
          providerId: _TwitterAuthProvider.PROVIDER_ID,
          signInMethod: _TwitterAuthProvider.TWITTER_SIGN_IN_METHOD,
          oauthToken: token,
          oauthTokenSecret: secret
        });
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromResult(userCredential) {
        return _TwitterAuthProvider.credentialFromTaggedObject(userCredential);
      }
      /**
       * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
       * thrown during a sign-in, link, or reauthenticate operation.
       *
       * @param userCredential - The user credential.
       */
      static credentialFromError(error) {
        return _TwitterAuthProvider.credentialFromTaggedObject(error.customData || {});
      }
      static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
        if (!tokenResponse) {
          return null;
        }
        const { oauthAccessToken, oauthTokenSecret } = tokenResponse;
        if (!oauthAccessToken || !oauthTokenSecret) {
          return null;
        }
        try {
          return _TwitterAuthProvider.credential(oauthAccessToken, oauthTokenSecret);
        } catch {
          return null;
        }
      }
    };
    TwitterAuthProvider.TWITTER_SIGN_IN_METHOD = "twitter.com";
    TwitterAuthProvider.PROVIDER_ID = "twitter.com";
    UserCredentialImpl = class _UserCredentialImpl {
      constructor(params) {
        this.user = params.user;
        this.providerId = params.providerId;
        this._tokenResponse = params._tokenResponse;
        this.operationType = params.operationType;
      }
      static async _fromIdTokenResponse(auth2, operationType, idTokenResponse, isAnonymous = false) {
        const user = await UserImpl._fromIdTokenResponse(auth2, idTokenResponse, isAnonymous);
        const providerId = providerIdForResponse(idTokenResponse);
        const userCred = new _UserCredentialImpl({
          user,
          providerId,
          _tokenResponse: idTokenResponse,
          operationType
        });
        return userCred;
      }
      static async _forOperation(user, operationType, response) {
        await user._updateTokensIfNecessary(
          response,
          /* reload */
          true
        );
        const providerId = providerIdForResponse(response);
        return new _UserCredentialImpl({
          user,
          providerId,
          _tokenResponse: response,
          operationType
        });
      }
    };
    MultiFactorError = class _MultiFactorError extends FirebaseError {
      constructor(auth2, error, operationType, user) {
        super(error.code, error.message);
        this.operationType = operationType;
        this.user = user;
        Object.setPrototypeOf(this, _MultiFactorError.prototype);
        this.customData = {
          appName: auth2.name,
          tenantId: auth2.tenantId ?? void 0,
          _serverResponse: error.customData._serverResponse,
          operationType
        };
      }
      static _fromErrorAndOperation(auth2, error, operationType, user) {
        return new _MultiFactorError(auth2, error, operationType, user);
      }
    };
    GenericAdditionalUserInfo = class {
      constructor(isNewUser, providerId, profile = {}) {
        this.isNewUser = isNewUser;
        this.providerId = providerId;
        this.profile = profile;
      }
    };
    FederatedAdditionalUserInfoWithUsername = class extends GenericAdditionalUserInfo {
      constructor(isNewUser, providerId, profile, username) {
        super(isNewUser, providerId, profile);
        this.username = username;
      }
    };
    FacebookAdditionalUserInfo = class extends GenericAdditionalUserInfo {
      constructor(isNewUser, profile) {
        super(isNewUser, "facebook.com", profile);
      }
    };
    GithubAdditionalUserInfo = class extends FederatedAdditionalUserInfoWithUsername {
      constructor(isNewUser, profile) {
        super(isNewUser, "github.com", profile, typeof profile?.login === "string" ? profile?.login : null);
      }
    };
    GoogleAdditionalUserInfo = class extends GenericAdditionalUserInfo {
      constructor(isNewUser, profile) {
        super(isNewUser, "google.com", profile);
      }
    };
    TwitterAdditionalUserInfo = class extends FederatedAdditionalUserInfoWithUsername {
      constructor(isNewUser, profile, screenName) {
        super(isNewUser, "twitter.com", profile, screenName);
      }
    };
    STORAGE_AVAILABLE_KEY = "__sak";
    BrowserPersistenceClass = class {
      constructor(storageRetriever, type) {
        this.storageRetriever = storageRetriever;
        this.type = type;
      }
      _isAvailable() {
        try {
          if (!this.storage) {
            return Promise.resolve(false);
          }
          this.storage.setItem(STORAGE_AVAILABLE_KEY, "1");
          this.storage.removeItem(STORAGE_AVAILABLE_KEY);
          return Promise.resolve(true);
        } catch {
          return Promise.resolve(false);
        }
      }
      _set(key, value) {
        this.storage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
      }
      _get(key) {
        const json = this.storage.getItem(key);
        return Promise.resolve(json ? JSON.parse(json) : null);
      }
      _remove(key) {
        this.storage.removeItem(key);
        return Promise.resolve();
      }
      get storage() {
        return this.storageRetriever();
      }
    };
    _POLLING_INTERVAL_MS$1 = 1e3;
    IE10_LOCAL_STORAGE_SYNC_DELAY = 10;
    BrowserLocalPersistence = class extends BrowserPersistenceClass {
      constructor() {
        super(
          () => window.localStorage,
          "LOCAL"
          /* PersistenceType.LOCAL */
        );
        this.boundEventHandler = (event, poll) => this.onStorageEvent(event, poll);
        this.listeners = {};
        this.localCache = {};
        this.pollTimer = null;
        this.fallbackToPolling = _isMobileBrowser();
        this._shouldAllowMigration = true;
      }
      forAllChangedKeys(cb) {
        for (const key of Object.keys(this.listeners)) {
          const newValue = this.storage.getItem(key);
          const oldValue = this.localCache[key];
          if (newValue !== oldValue) {
            cb(key, oldValue, newValue);
          }
        }
      }
      onStorageEvent(event, poll = false) {
        if (!event.key) {
          this.forAllChangedKeys((key2, _oldValue, newValue) => {
            this.notifyListeners(key2, newValue);
          });
          return;
        }
        const key = event.key;
        if (poll) {
          this.detachListener();
        } else {
          this.stopPolling();
        }
        const triggerListeners = () => {
          const storedValue2 = this.storage.getItem(key);
          if (!poll && this.localCache[key] === storedValue2) {
            return;
          }
          this.notifyListeners(key, storedValue2);
        };
        const storedValue = this.storage.getItem(key);
        if (_isIE10() && storedValue !== event.newValue && event.newValue !== event.oldValue) {
          setTimeout(triggerListeners, IE10_LOCAL_STORAGE_SYNC_DELAY);
        } else {
          triggerListeners();
        }
      }
      notifyListeners(key, value) {
        this.localCache[key] = value;
        const listeners = this.listeners[key];
        if (listeners) {
          for (const listener of Array.from(listeners)) {
            listener(value ? JSON.parse(value) : value);
          }
        }
      }
      startPolling() {
        this.stopPolling();
        this.pollTimer = setInterval(() => {
          this.forAllChangedKeys((key, oldValue, newValue) => {
            this.onStorageEvent(
              new StorageEvent("storage", {
                key,
                oldValue,
                newValue
              }),
              /* poll */
              true
            );
          });
        }, _POLLING_INTERVAL_MS$1);
      }
      stopPolling() {
        if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
      }
      attachListener() {
        window.addEventListener("storage", this.boundEventHandler);
      }
      detachListener() {
        window.removeEventListener("storage", this.boundEventHandler);
      }
      _addListener(key, listener) {
        if (Object.keys(this.listeners).length === 0) {
          if (this.fallbackToPolling) {
            this.startPolling();
          } else {
            this.attachListener();
          }
        }
        if (!this.listeners[key]) {
          this.listeners[key] = /* @__PURE__ */ new Set();
          this.localCache[key] = this.storage.getItem(key);
        }
        this.listeners[key].add(listener);
      }
      _removeListener(key, listener) {
        if (this.listeners[key]) {
          this.listeners[key].delete(listener);
          if (this.listeners[key].size === 0) {
            delete this.listeners[key];
          }
        }
        if (Object.keys(this.listeners).length === 0) {
          this.detachListener();
          this.stopPolling();
        }
      }
      // Update local cache on base operations:
      async _set(key, value) {
        await super._set(key, value);
        this.localCache[key] = JSON.stringify(value);
      }
      async _get(key) {
        const value = await super._get(key);
        this.localCache[key] = JSON.stringify(value);
        return value;
      }
      async _remove(key) {
        await super._remove(key);
        delete this.localCache[key];
      }
    };
    BrowserLocalPersistence.type = "LOCAL";
    browserLocalPersistence = BrowserLocalPersistence;
    POLLING_INTERVAL_MS = 1e3;
    CookiePersistence = class {
      constructor() {
        this.type = "COOKIE";
        this.listenerUnsubscribes = /* @__PURE__ */ new Map();
      }
      // used to get the URL to the backend to proxy to
      _getFinalTarget(originalUrl) {
        if (typeof window === void 0) {
          return originalUrl;
        }
        const url = new URL(`${window.location.origin}/__cookies__`);
        url.searchParams.set("finalTarget", originalUrl);
        return url;
      }
      // To be a usable persistence method in a chain browserCookiePersistence ensures that
      // prerequisites have been met, namely that we're in a secureContext, navigator and document are
      // available and cookies are enabled. Not all UAs support these method, so fallback accordingly.
      async _isAvailable() {
        if (typeof isSecureContext === "boolean" && !isSecureContext) {
          return false;
        }
        if (typeof navigator === "undefined" || typeof document === "undefined") {
          return false;
        }
        return navigator.cookieEnabled ?? true;
      }
      // Set should be a noop as we expect middleware to handle this
      async _set(_key, _value) {
        return;
      }
      // Attempt to get the cookie from cookieStore, fallback to document.cookie
      async _get(key) {
        if (!this._isAvailable()) {
          return null;
        }
        const name3 = getCookieName(key);
        if (window.cookieStore) {
          const cookie = await window.cookieStore.get(name3);
          return cookie?.value;
        }
        return getDocumentCookie(name3);
      }
      // Log out by overriding the idToken with a sentinel value of ""
      async _remove(key) {
        if (!this._isAvailable()) {
          return;
        }
        const existingValue = await this._get(key);
        if (!existingValue) {
          return;
        }
        const name3 = getCookieName(key);
        document.cookie = `${name3}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`;
        await fetch(`/__cookies__`, { method: "DELETE" }).catch(() => void 0);
      }
      // Listen for cookie changes, both cookieStore and fallback to polling document.cookie
      _addListener(key, listener) {
        if (!this._isAvailable()) {
          return;
        }
        const name3 = getCookieName(key);
        if (window.cookieStore) {
          const cb = ((event) => {
            const changedCookie = event.changed.find((change) => change.name === name3);
            if (changedCookie) {
              listener(changedCookie.value);
            }
            const deletedCookie = event.deleted.find((change) => change.name === name3);
            if (deletedCookie) {
              listener(null);
            }
          });
          const unsubscribe2 = () => window.cookieStore.removeEventListener("change", cb);
          this.listenerUnsubscribes.set(listener, unsubscribe2);
          return window.cookieStore.addEventListener("change", cb);
        }
        let lastValue = getDocumentCookie(name3);
        const interval = setInterval(() => {
          const currentValue = getDocumentCookie(name3);
          if (currentValue !== lastValue) {
            listener(currentValue);
            lastValue = currentValue;
          }
        }, POLLING_INTERVAL_MS);
        const unsubscribe = () => clearInterval(interval);
        this.listenerUnsubscribes.set(listener, unsubscribe);
      }
      _removeListener(_key, listener) {
        const unsubscribe = this.listenerUnsubscribes.get(listener);
        if (!unsubscribe) {
          return;
        }
        unsubscribe();
        this.listenerUnsubscribes.delete(listener);
      }
    };
    CookiePersistence.type = "COOKIE";
    BrowserSessionPersistence = class extends BrowserPersistenceClass {
      constructor() {
        super(
          () => window.sessionStorage,
          "SESSION"
          /* PersistenceType.SESSION */
        );
      }
      _addListener(_key, _listener) {
        return;
      }
      _removeListener(_key, _listener) {
        return;
      }
    };
    BrowserSessionPersistence.type = "SESSION";
    browserSessionPersistence = BrowserSessionPersistence;
    Receiver = class _Receiver {
      constructor(eventTarget) {
        this.eventTarget = eventTarget;
        this.handlersMap = {};
        this.boundEventHandler = this.handleEvent.bind(this);
      }
      /**
       * Obtain an instance of a Receiver for a given event target, if none exists it will be created.
       *
       * @param eventTarget - An event target (such as window or self) through which the underlying
       * messages will be received.
       */
      static _getInstance(eventTarget) {
        const existingInstance = this.receivers.find((receiver) => receiver.isListeningto(eventTarget));
        if (existingInstance) {
          return existingInstance;
        }
        const newInstance = new _Receiver(eventTarget);
        this.receivers.push(newInstance);
        return newInstance;
      }
      isListeningto(eventTarget) {
        return this.eventTarget === eventTarget;
      }
      /**
       * Fans out a MessageEvent to the appropriate listeners.
       *
       * @remarks
       * Sends an {@link Status.ACK} upon receipt and a {@link Status.DONE} once all handlers have
       * finished processing.
       *
       * @param event - The MessageEvent.
       *
       */
      async handleEvent(event) {
        const messageEvent = event;
        const { eventId, eventType, data } = messageEvent.data;
        const handlers = this.handlersMap[eventType];
        if (!handlers?.size) {
          return;
        }
        messageEvent.ports[0].postMessage({
          status: "ack",
          eventId,
          eventType
        });
        const promises = Array.from(handlers).map(async (handler) => handler(messageEvent.origin, data));
        const response = await _allSettled(promises);
        messageEvent.ports[0].postMessage({
          status: "done",
          eventId,
          eventType,
          response
        });
      }
      /**
       * Subscribe an event handler for a particular event.
       *
       * @param eventType - Event name to subscribe to.
       * @param eventHandler - The event handler which should receive the events.
       *
       */
      _subscribe(eventType, eventHandler) {
        if (Object.keys(this.handlersMap).length === 0) {
          this.eventTarget.addEventListener("message", this.boundEventHandler);
        }
        if (!this.handlersMap[eventType]) {
          this.handlersMap[eventType] = /* @__PURE__ */ new Set();
        }
        this.handlersMap[eventType].add(eventHandler);
      }
      /**
       * Unsubscribe an event handler from a particular event.
       *
       * @param eventType - Event name to unsubscribe from.
       * @param eventHandler - Optional event handler, if none provided, unsubscribe all handlers on this event.
       *
       */
      _unsubscribe(eventType, eventHandler) {
        if (this.handlersMap[eventType] && eventHandler) {
          this.handlersMap[eventType].delete(eventHandler);
        }
        if (!eventHandler || this.handlersMap[eventType].size === 0) {
          delete this.handlersMap[eventType];
        }
        if (Object.keys(this.handlersMap).length === 0) {
          this.eventTarget.removeEventListener("message", this.boundEventHandler);
        }
      }
    };
    Receiver.receivers = [];
    Sender = class {
      constructor(target) {
        this.target = target;
        this.handlers = /* @__PURE__ */ new Set();
      }
      /**
       * Unsubscribe the handler and remove it from our tracking Set.
       *
       * @param handler - The handler to unsubscribe.
       */
      removeMessageHandler(handler) {
        if (handler.messageChannel) {
          handler.messageChannel.port1.removeEventListener("message", handler.onMessage);
          handler.messageChannel.port1.close();
        }
        this.handlers.delete(handler);
      }
      /**
       * Send a message to the Receiver located at {@link target}.
       *
       * @remarks
       * We'll first wait a bit for an ACK , if we get one we will wait significantly longer until the
       * receiver has had a chance to fully process the event.
       *
       * @param eventType - Type of event to send.
       * @param data - The payload of the event.
       * @param timeout - Timeout for waiting on an ACK from the receiver.
       *
       * @returns An array of settled promises from all the handlers that were listening on the receiver.
       */
      async _send(eventType, data, timeout = 50) {
        const messageChannel = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
        if (!messageChannel) {
          throw new Error(
            "connection_unavailable"
            /* _MessageError.CONNECTION_UNAVAILABLE */
          );
        }
        let completionTimer;
        let handler;
        return new Promise((resolve, reject) => {
          const eventId = _generateEventId("", 20);
          messageChannel.port1.start();
          const ackTimer = setTimeout(() => {
            reject(new Error(
              "unsupported_event"
              /* _MessageError.UNSUPPORTED_EVENT */
            ));
          }, timeout);
          handler = {
            messageChannel,
            onMessage(event) {
              const messageEvent = event;
              if (messageEvent.data.eventId !== eventId) {
                return;
              }
              switch (messageEvent.data.status) {
                case "ack":
                  clearTimeout(ackTimer);
                  completionTimer = setTimeout(
                    () => {
                      reject(new Error(
                        "timeout"
                        /* _MessageError.TIMEOUT */
                      ));
                    },
                    3e3
                    /* _TimeoutDuration.COMPLETION */
                  );
                  break;
                case "done":
                  clearTimeout(completionTimer);
                  resolve(messageEvent.data.response);
                  break;
                default:
                  clearTimeout(ackTimer);
                  clearTimeout(completionTimer);
                  reject(new Error(
                    "invalid_response"
                    /* _MessageError.INVALID_RESPONSE */
                  ));
                  break;
              }
            }
          };
          this.handlers.add(handler);
          messageChannel.port1.addEventListener("message", handler.onMessage);
          this.target.postMessage({
            eventType,
            eventId,
            data
          }, [messageChannel.port2]);
        }).finally(() => {
          if (handler) {
            this.removeMessageHandler(handler);
          }
        });
      }
    };
    DB_NAME2 = "firebaseLocalStorageDb";
    DB_VERSION2 = 1;
    DB_OBJECTSTORE_NAME = "firebaseLocalStorage";
    DB_DATA_KEYPATH = "fbase_key";
    DBPromise = class {
      constructor(request) {
        this.request = request;
      }
      toPromise() {
        return new Promise((resolve, reject) => {
          this.request.addEventListener("success", () => {
            resolve(this.request.result);
          });
          this.request.addEventListener("error", () => {
            reject(this.request.error);
          });
        });
      }
    };
    _POLLING_INTERVAL_MS = 800;
    _TRANSACTION_RETRY_COUNT = 3;
    IndexedDBLocalPersistence = class {
      registerLifecycleListeners() {
        if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
          window.addEventListener("pagehide", this.onPageHide);
          window.addEventListener("pageshow", this.onPageShow);
        }
      }
      unregisterLifecycleListeners() {
        if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
          window.removeEventListener("pagehide", this.onPageHide);
          window.removeEventListener("pageshow", this.onPageShow);
        }
      }
      constructor() {
        this.type = "LOCAL";
        this.dbPromise = null;
        this._shouldAllowMigration = true;
        this.listeners = {};
        this.localCache = {};
        this.pollTimer = null;
        this.isClosing = false;
        this.pendingWrites = 0;
        this.receiver = null;
        this.sender = null;
        this.serviceWorkerReceiverAvailable = false;
        this.activeServiceWorker = null;
        this.onPageHide = () => {
          this.isClosing = true;
          this.stopPolling();
          if (this.dbPromise) {
            this.dbPromise.then((db2) => db2.close()).catch(() => {
            });
            this.dbPromise = null;
          }
        };
        this.onPageShow = () => {
          if (this.isClosing) {
            this.isClosing = false;
            if (Object.keys(this.listeners).length > 0) {
              this.startPolling();
            }
          }
        };
        this._workerInitializationPromise = this.initializeServiceWorkerMessaging().then(() => {
        }, () => {
        });
      }
      async _openDb() {
        if (this.dbPromise) {
          return this.dbPromise;
        }
        this.dbPromise = _openDatabase();
        this.dbPromise.catch(() => {
          this.dbPromise = null;
        });
        return this.dbPromise;
      }
      async _withRetries(op) {
        let numAttempts = 0;
        while (true) {
          try {
            const db2 = await this._openDb();
            return await op(db2);
          } catch (e) {
            if (numAttempts++ > _TRANSACTION_RETRY_COUNT) {
              throw e;
            }
            if (this.dbPromise) {
              const dbPromise2 = this.dbPromise;
              this.dbPromise = null;
              try {
                const db2 = await dbPromise2;
                db2.close();
              } catch {
              }
            }
          }
        }
      }
      /**
       * IndexedDB events do not propagate from the main window to the worker context.  We rely on a
       * postMessage interface to send these events to the worker ourselves.
       */
      async initializeServiceWorkerMessaging() {
        return _isWorker() ? this.initializeReceiver() : this.initializeSender();
      }
      /**
       * As the worker we should listen to events from the main window.
       */
      async initializeReceiver() {
        this.receiver = Receiver._getInstance(_getWorkerGlobalScope());
        this.receiver._subscribe("keyChanged", async (_origin, data) => {
          const keys = await this._poll();
          return {
            keyProcessed: keys.includes(data.key)
          };
        });
        this.receiver._subscribe("ping", async (_origin, _data) => {
          return [
            "keyChanged"
            /* _EventType.KEY_CHANGED */
          ];
        });
      }
      /**
       * As the main window, we should let the worker know when keys change (set and remove).
       *
       * @remarks
       * {@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready | ServiceWorkerContainer.ready}
       * may not resolve.
       */
      async initializeSender() {
        this.activeServiceWorker = await _getActiveServiceWorker();
        if (!this.activeServiceWorker) {
          return;
        }
        this.sender = new Sender(this.activeServiceWorker);
        const results = await this.sender._send(
          "ping",
          {},
          800
          /* _TimeoutDuration.LONG_ACK */
        );
        if (!results) {
          return;
        }
        if (results[0]?.fulfilled && results[0]?.value.includes(
          "keyChanged"
          /* _EventType.KEY_CHANGED */
        )) {
          this.serviceWorkerReceiverAvailable = true;
        }
      }
      /**
       * Let the worker know about a changed key, the exact key doesn't technically matter since the
       * worker will just trigger a full sync anyway.
       *
       * @remarks
       * For now, we only support one service worker per page.
       *
       * @param key - Storage key which changed.
       */
      async notifyServiceWorker(key) {
        if (!this.sender || !this.activeServiceWorker || _getServiceWorkerController() !== this.activeServiceWorker) {
          return;
        }
        try {
          await this.sender._send(
            "keyChanged",
            { key },
            // Use long timeout if receiver has previously responded to a ping from us.
            this.serviceWorkerReceiverAvailable ? 800 : 50
            /* _TimeoutDuration.ACK */
          );
        } catch {
        }
      }
      async _isAvailable() {
        try {
          if (!indexedDB) {
            return false;
          }
          await this._withRetries(async (db2) => {
            await _putObject(db2, STORAGE_AVAILABLE_KEY, "1");
            await _deleteObject(db2, STORAGE_AVAILABLE_KEY);
          });
          return true;
        } catch {
        }
        return false;
      }
      async _withPendingWrite(write) {
        this.pendingWrites++;
        try {
          await write();
        } finally {
          this.pendingWrites--;
        }
      }
      async _set(key, value) {
        return this._withPendingWrite(async () => {
          await this._withRetries((db2) => _putObject(db2, key, value));
          this.localCache[key] = value;
          return this.notifyServiceWorker(key);
        });
      }
      async _get(key) {
        const obj = await this._withRetries((db2) => getObject(db2, key));
        this.localCache[key] = obj;
        return obj;
      }
      async _remove(key) {
        return this._withPendingWrite(async () => {
          await this._withRetries((db2) => _deleteObject(db2, key));
          delete this.localCache[key];
          return this.notifyServiceWorker(key);
        });
      }
      async _poll() {
        if (this.isClosing) {
          return [];
        }
        try {
          const result = await this._withRetries((db2) => {
            const getAllRequest = getObjectStore(db2, false).getAll();
            return new DBPromise(getAllRequest).toPromise();
          });
          if (this.isClosing) {
            return [];
          }
          if (!result) {
            return [];
          }
          if (this.pendingWrites !== 0) {
            return [];
          }
          const keys = [];
          const keysInResult = /* @__PURE__ */ new Set();
          if (result.length !== 0) {
            for (const { fbase_key: key, value } of result) {
              keysInResult.add(key);
              if (JSON.stringify(this.localCache[key]) !== JSON.stringify(value)) {
                this.notifyListeners(key, value);
                keys.push(key);
              }
            }
          }
          for (const localKey of Object.keys(this.localCache)) {
            if (this.localCache[localKey] && !keysInResult.has(localKey)) {
              this.notifyListeners(localKey, null);
              keys.push(localKey);
            }
          }
          return keys;
        } catch (e) {
          if (!this.isClosing) {
            _logWarn(`Firebase Auth cross-tab polling failed with error: ${e}`);
          }
          return [];
        }
      }
      notifyListeners(key, newValue) {
        this.localCache[key] = newValue;
        const listeners = this.listeners[key];
        if (listeners) {
          for (const listener of Array.from(listeners)) {
            listener(newValue);
          }
        }
      }
      startPolling() {
        this.stopPolling();
        this.pollTimer = setInterval(async () => this._poll(), _POLLING_INTERVAL_MS);
      }
      stopPolling() {
        if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
      }
      _addListener(key, listener) {
        if (Object.keys(this.listeners).length === 0) {
          this.startPolling();
          this.registerLifecycleListeners();
        }
        if (!this.listeners[key]) {
          this.listeners[key] = /* @__PURE__ */ new Set();
          void this._get(key);
        }
        this.listeners[key].add(listener);
      }
      _removeListener(key, listener) {
        if (this.listeners[key]) {
          this.listeners[key].delete(listener);
          if (this.listeners[key].size === 0) {
            delete this.listeners[key];
          }
        }
        if (Object.keys(this.listeners).length === 0) {
          this.stopPolling();
          this.unregisterLifecycleListeners();
        }
      }
    };
    IndexedDBLocalPersistence.type = "LOCAL";
    indexedDBLocalPersistence = IndexedDBLocalPersistence;
    _JSLOAD_CALLBACK = _generateCallbackName("rcb");
    NETWORK_TIMEOUT_DELAY = new Delay(3e4, 6e4);
    ReCaptchaLoaderImpl = class {
      constructor() {
        this.hostLanguage = "";
        this.counter = 0;
        this.librarySeparatelyLoaded = !!_window().grecaptcha?.render;
      }
      load(auth2, hl = "") {
        _assert(
          isHostLanguageValid(hl),
          auth2,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        if (this.shouldResolveImmediately(hl) && isV2(_window().grecaptcha)) {
          return Promise.resolve(_window().grecaptcha);
        }
        return new Promise((resolve, reject) => {
          const networkTimeout = _window().setTimeout(() => {
            reject(_createError(
              auth2,
              "network-request-failed"
              /* AuthErrorCode.NETWORK_REQUEST_FAILED */
            ));
          }, NETWORK_TIMEOUT_DELAY.get());
          _window()[_JSLOAD_CALLBACK] = () => {
            _window().clearTimeout(networkTimeout);
            delete _window()[_JSLOAD_CALLBACK];
            const recaptcha = _window().grecaptcha;
            if (!recaptcha || !isV2(recaptcha)) {
              reject(_createError(
                auth2,
                "internal-error"
                /* AuthErrorCode.INTERNAL_ERROR */
              ));
              return;
            }
            const render = recaptcha.render;
            recaptcha.render = (container, params) => {
              const widgetId = render(container, params);
              this.counter++;
              return widgetId;
            };
            this.hostLanguage = hl;
            resolve(recaptcha);
          };
          const url = `${_recaptchaV2ScriptUrl()}?${querystring({
            onload: _JSLOAD_CALLBACK,
            render: "explicit",
            hl
          })}`;
          _loadJS(url).catch(() => {
            clearTimeout(networkTimeout);
            reject(_createError(
              auth2,
              "internal-error"
              /* AuthErrorCode.INTERNAL_ERROR */
            ));
          });
        });
      }
      clearedOneInstance() {
        this.counter--;
      }
      shouldResolveImmediately(hl) {
        return !!_window().grecaptcha?.render && (hl === this.hostLanguage || this.counter > 0 || this.librarySeparatelyLoaded);
      }
    };
    MockReCaptchaLoaderImpl = class {
      async load(auth2) {
        return new MockReCaptcha(auth2);
      }
      clearedOneInstance() {
      }
    };
    RECAPTCHA_VERIFIER_TYPE = "recaptcha";
    DEFAULT_PARAMS = {
      theme: "light",
      type: "image"
    };
    RecaptchaVerifier = class {
      /**
       * @param authExtern - The corresponding Firebase {@link Auth} instance.
       *
       * @param containerOrId - The reCAPTCHA container parameter.
       *
       * @remarks
       * This has different meaning depending on whether the reCAPTCHA is hidden or visible. For a
       * visible reCAPTCHA the container must be empty. If a string is used, it has to correspond to
       * an element ID. The corresponding element must also must be in the DOM at the time of
       * initialization.
       *
       * @param parameters - The optional reCAPTCHA parameters.
       *
       * @remarks
       * Check the reCAPTCHA docs for a comprehensive list. All parameters are accepted except for
       * the sitekey. Firebase Auth backend provisions a reCAPTCHA for each project and will
       * configure this upon rendering. For an invisible reCAPTCHA, a size key must have the value
       * 'invisible'.
       */
      constructor(authExtern, containerOrId, parameters = {
        ...DEFAULT_PARAMS
      }) {
        this.parameters = parameters;
        this.type = RECAPTCHA_VERIFIER_TYPE;
        this.destroyed = false;
        this.widgetId = null;
        this.tokenChangeListeners = /* @__PURE__ */ new Set();
        this.renderPromise = null;
        this.recaptcha = null;
        this.auth = _castAuth(authExtern);
        this.isInvisible = this.parameters.size === "invisible";
        _assert(
          typeof document !== "undefined",
          this.auth,
          "operation-not-supported-in-this-environment"
          /* AuthErrorCode.OPERATION_NOT_SUPPORTED */
        );
        const container = typeof containerOrId === "string" ? document.getElementById(containerOrId) : containerOrId;
        _assert(
          container,
          this.auth,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        this.container = container;
        this.parameters.callback = this.makeTokenCallback(this.parameters.callback);
        this._recaptchaLoader = this.auth.settings.appVerificationDisabledForTesting ? new MockReCaptchaLoaderImpl() : new ReCaptchaLoaderImpl();
        this.validateStartingState();
      }
      /**
       * Waits for the user to solve the reCAPTCHA and resolves with the reCAPTCHA token.
       *
       * @returns A Promise for the reCAPTCHA token.
       */
      async verify() {
        this.assertNotDestroyed();
        const id = await this.render();
        const recaptcha = this.getAssertedRecaptcha();
        const response = recaptcha.getResponse(id);
        if (response) {
          return response;
        }
        return new Promise((resolve) => {
          const tokenChange = (token) => {
            if (!token) {
              return;
            }
            this.tokenChangeListeners.delete(tokenChange);
            resolve(token);
          };
          this.tokenChangeListeners.add(tokenChange);
          if (this.isInvisible) {
            recaptcha.execute(id);
          }
        });
      }
      /**
       * Renders the reCAPTCHA widget on the page.
       *
       * @returns A Promise that resolves with the reCAPTCHA widget ID.
       */
      render() {
        try {
          this.assertNotDestroyed();
        } catch (e) {
          return Promise.reject(e);
        }
        if (this.renderPromise) {
          return this.renderPromise;
        }
        this.renderPromise = this.makeRenderPromise().catch((e) => {
          this.renderPromise = null;
          throw e;
        });
        return this.renderPromise;
      }
      /** @internal */
      _reset() {
        this.assertNotDestroyed();
        if (this.widgetId !== null) {
          this.getAssertedRecaptcha().reset(this.widgetId);
        }
      }
      /**
       * Clears the reCAPTCHA widget from the page and destroys the instance.
       */
      clear() {
        this.assertNotDestroyed();
        this.destroyed = true;
        this._recaptchaLoader.clearedOneInstance();
        if (!this.isInvisible) {
          this.container.childNodes.forEach((node) => {
            this.container.removeChild(node);
          });
        }
      }
      validateStartingState() {
        _assert(
          !this.parameters.sitekey,
          this.auth,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        _assert(
          this.isInvisible || !this.container.hasChildNodes(),
          this.auth,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        _assert(
          typeof document !== "undefined",
          this.auth,
          "operation-not-supported-in-this-environment"
          /* AuthErrorCode.OPERATION_NOT_SUPPORTED */
        );
      }
      makeTokenCallback(existing) {
        return (token) => {
          this.tokenChangeListeners.forEach((listener) => listener(token));
          if (typeof existing === "function") {
            existing(token);
          } else if (typeof existing === "string") {
            const globalFunc = _window()[existing];
            if (typeof globalFunc === "function") {
              globalFunc(token);
            }
          }
        };
      }
      assertNotDestroyed() {
        _assert(
          !this.destroyed,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
      }
      async makeRenderPromise() {
        await this.init();
        if (!this.widgetId) {
          let container = this.container;
          if (!this.isInvisible) {
            const guaranteedEmpty = document.createElement("div");
            container.appendChild(guaranteedEmpty);
            container = guaranteedEmpty;
          }
          this.widgetId = this.getAssertedRecaptcha().render(container, this.parameters);
        }
        return this.widgetId;
      }
      async init() {
        _assert(
          _isHttpOrHttps() && !_isWorker(),
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        await domReady();
        this.recaptcha = await this._recaptchaLoader.load(this.auth, this.auth.languageCode || void 0);
        const siteKey = await getRecaptchaParams(this.auth);
        _assert(
          siteKey,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        this.parameters.sitekey = siteKey;
      }
      getAssertedRecaptcha() {
        _assert(
          this.recaptcha,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        return this.recaptcha;
      }
    };
    ConfirmationResultImpl = class {
      constructor(verificationId, onConfirmation) {
        this.verificationId = verificationId;
        this.onConfirmation = onConfirmation;
      }
      confirm(verificationCode) {
        const authCredential = PhoneAuthCredential._fromVerification(this.verificationId, verificationCode);
        return this.onConfirmation(authCredential);
      }
    };
    PhoneAuthProvider = class _PhoneAuthProvider {
      /**
       * @param auth - The Firebase {@link Auth} instance in which sign-ins should occur.
       *
       */
      constructor(auth2) {
        this.providerId = _PhoneAuthProvider.PROVIDER_ID;
        this.auth = _castAuth(auth2);
      }
      /**
       *
       * Starts a phone number authentication flow by sending a verification code to the given phone
       * number.
       *
       * @example
       * ```javascript
       * const provider = new PhoneAuthProvider(auth);
       * const verificationId = await provider.verifyPhoneNumber(phoneNumber, applicationVerifier);
       * // Obtain verificationCode from the user.
       * const authCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
       * const userCredential = await signInWithCredential(auth, authCredential);
       * ```
       *
       * @example
       * An alternative flow is provided using the `signInWithPhoneNumber` method.
       * ```javascript
       * const confirmationResult = signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
       * // Obtain verificationCode from the user.
       * const userCredential = confirmationResult.confirm(verificationCode);
       * ```
       *
       * @param phoneInfoOptions - The user's {@link PhoneInfoOptions}. The phone number should be in
       * E.164 format (e.g. +16505550101).
       * @param applicationVerifier - An {@link ApplicationVerifier}, which prevents
       * requests from unauthorized clients. This SDK includes an implementation
       * based on reCAPTCHA v2, {@link RecaptchaVerifier}. If you've enabled
       * reCAPTCHA Enterprise bot protection in Enforce mode, this parameter is
       * optional; in all other configurations, the parameter is required.
       *
       * @returns A Promise for a verification ID that can be passed to
       * {@link PhoneAuthProvider.credential} to identify this flow.
       */
      verifyPhoneNumber(phoneOptions, applicationVerifier) {
        return _verifyPhoneNumber(this.auth, phoneOptions, getModularInstance(applicationVerifier));
      }
      /**
       * Creates a phone auth credential, given the verification ID from
       * {@link PhoneAuthProvider.verifyPhoneNumber} and the code that was sent to the user's
       * mobile device.
       *
       * @example
       * ```javascript
       * const provider = new PhoneAuthProvider(auth);
       * const verificationId = provider.verifyPhoneNumber(phoneNumber, applicationVerifier);
       * // Obtain verificationCode from the user.
       * const authCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
       * const userCredential = signInWithCredential(auth, authCredential);
       * ```
       *
       * @example
       * An alternative flow is provided using the `signInWithPhoneNumber` method.
       * ```javascript
       * const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
       * // Obtain verificationCode from the user.
       * const userCredential = await confirmationResult.confirm(verificationCode);
       * ```
       *
       * @param verificationId - The verification ID returned from {@link PhoneAuthProvider.verifyPhoneNumber}.
       * @param verificationCode - The verification code sent to the user's mobile device.
       *
       * @returns The auth provider credential.
       */
      static credential(verificationId, verificationCode) {
        return PhoneAuthCredential._fromVerification(verificationId, verificationCode);
      }
      /**
       * Generates an {@link AuthCredential} from a {@link UserCredential}.
       * @param userCredential - The user credential.
       */
      static credentialFromResult(userCredential) {
        const credential = userCredential;
        return _PhoneAuthProvider.credentialFromTaggedObject(credential);
      }
      /**
       * Returns an {@link AuthCredential} when passed an error.
       *
       * @remarks
       *
       * This method works for errors like
       * `auth/account-exists-with-different-credentials`. This is useful for
       * recovering when attempting to set a user's phone number but the number
       * in question is already tied to another account. For example, the following
       * code tries to update the current user's phone number, and if that
       * fails, links the user with the account associated with that number:
       *
       * ```js
       * const provider = new PhoneAuthProvider(auth);
       * const verificationId = await provider.verifyPhoneNumber(number, verifier);
       * try {
       *   const code = ''; // Prompt the user for the verification code
       *   await updatePhoneNumber(
       *       auth.currentUser,
       *       PhoneAuthProvider.credential(verificationId, code));
       * } catch (e) {
       *   if ((e as FirebaseError)?.code === 'auth/account-exists-with-different-credential') {
       *     const cred = PhoneAuthProvider.credentialFromError(e);
       *     await linkWithCredential(auth.currentUser, cred);
       *   }
       * }
       *
       * // At this point, auth.currentUser.phoneNumber === number.
       * ```
       *
       * @param error - The error to generate a credential from.
       */
      static credentialFromError(error) {
        return _PhoneAuthProvider.credentialFromTaggedObject(error.customData || {});
      }
      static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
        if (!tokenResponse) {
          return null;
        }
        const { phoneNumber, temporaryProof } = tokenResponse;
        if (phoneNumber && temporaryProof) {
          return PhoneAuthCredential._fromTokenResponse(phoneNumber, temporaryProof);
        }
        return null;
      }
    };
    PhoneAuthProvider.PROVIDER_ID = "phone";
    PhoneAuthProvider.PHONE_SIGN_IN_METHOD = "phone";
    IdpCredential = class extends AuthCredential {
      constructor(params) {
        super(
          "custom",
          "custom"
          /* ProviderId.CUSTOM */
        );
        this.params = params;
      }
      _getIdTokenResponse(auth2) {
        return signInWithIdp(auth2, this._buildIdpRequest());
      }
      _linkToIdToken(auth2, idToken) {
        return signInWithIdp(auth2, this._buildIdpRequest(idToken));
      }
      _getReauthenticationResolver(auth2) {
        return signInWithIdp(auth2, this._buildIdpRequest());
      }
      _buildIdpRequest(idToken) {
        const request = {
          requestUri: this.params.requestUri,
          sessionId: this.params.sessionId,
          postBody: this.params.postBody,
          tenantId: this.params.tenantId,
          pendingToken: this.params.pendingToken,
          returnSecureToken: true,
          returnIdpCredential: true
        };
        if (idToken) {
          request.idToken = idToken;
        }
        return request;
      }
    };
    AbstractPopupRedirectOperation = class {
      constructor(auth2, filter, resolver, user, bypassAuthState = false) {
        this.auth = auth2;
        this.resolver = resolver;
        this.user = user;
        this.bypassAuthState = bypassAuthState;
        this.pendingPromise = null;
        this.eventManager = null;
        this.filter = Array.isArray(filter) ? filter : [filter];
      }
      execute() {
        return new Promise(async (resolve, reject) => {
          this.pendingPromise = { resolve, reject };
          try {
            this.eventManager = await this.resolver._initialize(this.auth);
            await this.onExecution();
            this.eventManager.registerConsumer(this);
          } catch (e) {
            this.reject(e);
          }
        });
      }
      async onAuthEvent(event) {
        const { urlResponse, sessionId, postBody, tenantId, error, type } = event;
        if (error) {
          this.reject(error);
          return;
        }
        const params = {
          auth: this.auth,
          requestUri: urlResponse,
          sessionId,
          tenantId: tenantId || void 0,
          postBody: postBody || void 0,
          user: this.user,
          bypassAuthState: this.bypassAuthState
        };
        try {
          this.resolve(await this.getIdpTask(type)(params));
        } catch (e) {
          this.reject(e);
        }
      }
      onError(error) {
        this.reject(error);
      }
      getIdpTask(type) {
        switch (type) {
          case "signInViaPopup":
          case "signInViaRedirect":
            return _signIn;
          case "linkViaPopup":
          case "linkViaRedirect":
            return _link;
          case "reauthViaPopup":
          case "reauthViaRedirect":
            return _reauth;
          default:
            _fail(
              this.auth,
              "internal-error"
              /* AuthErrorCode.INTERNAL_ERROR */
            );
        }
      }
      resolve(cred) {
        debugAssert(this.pendingPromise, "Pending promise was never set");
        this.pendingPromise.resolve(cred);
        this.unregisterAndCleanUp();
      }
      reject(error) {
        debugAssert(this.pendingPromise, "Pending promise was never set");
        this.pendingPromise.reject(error);
        this.unregisterAndCleanUp();
      }
      unregisterAndCleanUp() {
        if (this.eventManager) {
          this.eventManager.unregisterConsumer(this);
        }
        this.pendingPromise = null;
        this.cleanUp();
      }
    };
    _POLL_WINDOW_CLOSE_TIMEOUT = new Delay(2e3, 1e4);
    PopupOperation = class _PopupOperation extends AbstractPopupRedirectOperation {
      constructor(auth2, filter, provider, resolver, user) {
        super(auth2, filter, resolver, user);
        this.provider = provider;
        this.authWindow = null;
        this.pollId = null;
        if (_PopupOperation.currentPopupAction) {
          _PopupOperation.currentPopupAction.cancel();
        }
        _PopupOperation.currentPopupAction = this;
      }
      async executeNotNull() {
        const result = await this.execute();
        _assert(
          result,
          this.auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        return result;
      }
      async onExecution() {
        debugAssert(this.filter.length === 1, "Popup operations only handle one event");
        const eventId = _generateEventId();
        this.authWindow = await this.resolver._openPopup(
          this.auth,
          this.provider,
          this.filter[0],
          // There's always one, see constructor
          eventId
        );
        this.authWindow.associatedEvent = eventId;
        this.resolver._originValidation(this.auth).catch((e) => {
          this.reject(e);
        });
        this.resolver._isIframeWebStorageSupported(this.auth, (isSupported) => {
          if (!isSupported) {
            this.reject(_createError(
              this.auth,
              "web-storage-unsupported"
              /* AuthErrorCode.WEB_STORAGE_UNSUPPORTED */
            ));
          }
        });
        this.pollUserCancellation();
      }
      get eventId() {
        return this.authWindow?.associatedEvent || null;
      }
      cancel() {
        this.reject(_createError(
          this.auth,
          "cancelled-popup-request"
          /* AuthErrorCode.EXPIRED_POPUP_REQUEST */
        ));
      }
      cleanUp() {
        if (this.authWindow) {
          this.authWindow.close();
        }
        if (this.pollId) {
          window.clearTimeout(this.pollId);
        }
        this.authWindow = null;
        this.pollId = null;
        _PopupOperation.currentPopupAction = null;
      }
      pollUserCancellation() {
        const poll = () => {
          if (this.authWindow?.window?.closed) {
            this.pollId = window.setTimeout(
              () => {
                this.pollId = null;
                this.reject(_createError(
                  this.auth,
                  "popup-closed-by-user"
                  /* AuthErrorCode.POPUP_CLOSED_BY_USER */
                ));
              },
              8e3
              /* _Timeout.AUTH_EVENT */
            );
            return;
          }
          this.pollId = window.setTimeout(poll, _POLL_WINDOW_CLOSE_TIMEOUT.get());
        };
        poll();
      }
    };
    PopupOperation.currentPopupAction = null;
    PENDING_REDIRECT_KEY = "pendingRedirect";
    redirectOutcomeMap = /* @__PURE__ */ new Map();
    RedirectAction = class extends AbstractPopupRedirectOperation {
      constructor(auth2, resolver, bypassAuthState = false) {
        super(auth2, [
          "signInViaRedirect",
          "linkViaRedirect",
          "reauthViaRedirect",
          "unknown"
          /* AuthEventType.UNKNOWN */
        ], resolver, void 0, bypassAuthState);
        this.eventId = null;
      }
      /**
       * Override the execute function; if we already have a redirect result, then
       * just return it.
       */
      async execute() {
        let readyOutcome = redirectOutcomeMap.get(this.auth._key());
        if (!readyOutcome) {
          try {
            const hasPendingRedirect = await _getAndClearPendingRedirectStatus(this.resolver, this.auth);
            const result = hasPendingRedirect ? await super.execute() : null;
            readyOutcome = () => Promise.resolve(result);
          } catch (e) {
            readyOutcome = () => Promise.reject(e);
          }
          redirectOutcomeMap.set(this.auth._key(), readyOutcome);
        }
        if (!this.bypassAuthState) {
          redirectOutcomeMap.set(this.auth._key(), () => Promise.resolve(null));
        }
        return readyOutcome();
      }
      async onAuthEvent(event) {
        if (event.type === "signInViaRedirect") {
          return super.onAuthEvent(event);
        } else if (event.type === "unknown") {
          this.resolve(null);
          return;
        }
        if (event.eventId) {
          const user = await this.auth._redirectUserForId(event.eventId);
          if (user) {
            this.user = user;
            return super.onAuthEvent(event);
          } else {
            this.resolve(null);
          }
        }
      }
      async onExecution() {
      }
      cleanUp() {
      }
    };
    EVENT_DUPLICATION_CACHE_DURATION_MS = 10 * 60 * 1e3;
    AuthEventManager = class {
      constructor(auth2) {
        this.auth = auth2;
        this.cachedEventUids = /* @__PURE__ */ new Set();
        this.consumers = /* @__PURE__ */ new Set();
        this.queuedRedirectEvent = null;
        this.hasHandledPotentialRedirect = false;
        this.lastProcessedEventTime = Date.now();
      }
      registerConsumer(authEventConsumer) {
        this.consumers.add(authEventConsumer);
        if (this.queuedRedirectEvent && this.isEventForConsumer(this.queuedRedirectEvent, authEventConsumer)) {
          this.sendToConsumer(this.queuedRedirectEvent, authEventConsumer);
          this.saveEventToCache(this.queuedRedirectEvent);
          this.queuedRedirectEvent = null;
        }
      }
      unregisterConsumer(authEventConsumer) {
        this.consumers.delete(authEventConsumer);
      }
      onEvent(event) {
        if (this.hasEventBeenHandled(event)) {
          return false;
        }
        let handled = false;
        this.consumers.forEach((consumer) => {
          if (this.isEventForConsumer(event, consumer)) {
            handled = true;
            this.sendToConsumer(event, consumer);
            this.saveEventToCache(event);
          }
        });
        if (this.hasHandledPotentialRedirect || !isRedirectEvent(event)) {
          return handled;
        }
        this.hasHandledPotentialRedirect = true;
        if (!handled) {
          this.queuedRedirectEvent = event;
          handled = true;
        }
        return handled;
      }
      sendToConsumer(event, consumer) {
        if (event.error && !isNullRedirectEvent(event)) {
          const code = event.error.code?.split("auth/")[1] || "internal-error";
          consumer.onError(_createError(this.auth, code));
        } else {
          consumer.onAuthEvent(event);
        }
      }
      isEventForConsumer(event, consumer) {
        const eventIdMatches = consumer.eventId === null || !!event.eventId && event.eventId === consumer.eventId;
        return consumer.filter.includes(event.type) && eventIdMatches;
      }
      hasEventBeenHandled(event) {
        if (Date.now() - this.lastProcessedEventTime >= EVENT_DUPLICATION_CACHE_DURATION_MS) {
          this.cachedEventUids.clear();
        }
        return this.cachedEventUids.has(eventUid(event));
      }
      saveEventToCache(event) {
        this.cachedEventUids.add(eventUid(event));
        this.lastProcessedEventTime = Date.now();
      }
    };
    IP_ADDRESS_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    HTTP_REGEX = /^https?/;
    NETWORK_TIMEOUT = new Delay(3e4, 6e4);
    cachedGApiLoader = null;
    PING_TIMEOUT = new Delay(5e3, 15e3);
    IFRAME_PATH = "__/auth/iframe";
    EMULATED_IFRAME_PATH = "emulator/auth/iframe";
    IFRAME_ATTRIBUTES = {
      style: {
        position: "absolute",
        top: "-100px",
        width: "1px",
        height: "1px"
      },
      "aria-hidden": "true",
      tabindex: "-1"
    };
    EID_FROM_APIHOST = /* @__PURE__ */ new Map([
      ["identitytoolkit.googleapis.com", "p"],
      // production
      ["staging-identitytoolkit.sandbox.googleapis.com", "s"],
      // staging
      ["test-identitytoolkit.sandbox.googleapis.com", "t"]
      // test
    ]);
    BASE_POPUP_OPTIONS = {
      location: "yes",
      resizable: "yes",
      statusbar: "yes",
      toolbar: "no"
    };
    DEFAULT_WIDTH = 500;
    DEFAULT_HEIGHT = 600;
    TARGET_BLANK = "_blank";
    FIREFOX_EMPTY_URL = "http://localhost";
    AuthPopup = class {
      constructor(window2) {
        this.window = window2;
        this.associatedEvent = null;
      }
      close() {
        if (this.window) {
          try {
            this.window.close();
          } catch (e) {
          }
        }
      }
    };
    WIDGET_PATH = "__/auth/handler";
    EMULATOR_WIDGET_PATH = "emulator/auth/handler";
    FIREBASE_APP_CHECK_FRAGMENT_ID = encodeURIComponent("fac");
    WEB_STORAGE_SUPPORT_KEY = "webStorageSupport";
    BrowserPopupRedirectResolver = class {
      constructor() {
        this.eventManagers = {};
        this.iframes = {};
        this.originValidationPromises = {};
        this._redirectPersistence = browserSessionPersistence;
        this._completeRedirectFn = _getRedirectResult;
        this._overrideRedirectResult = _overrideRedirectResult;
      }
      // Wrapping in async even though we don't await anywhere in order
      // to make sure errors are raised as promise rejections
      async _openPopup(auth2, provider, authType, eventId) {
        debugAssert(this.eventManagers[auth2._key()]?.manager, "_initialize() not called before _openPopup()");
        const url = await _getRedirectUrl(auth2, provider, authType, _getCurrentUrl(), eventId);
        return _open(auth2, url, _generateEventId());
      }
      async _openRedirect(auth2, provider, authType, eventId) {
        await this._originValidation(auth2);
        const url = await _getRedirectUrl(auth2, provider, authType, _getCurrentUrl(), eventId);
        _setWindowLocation(url);
        return new Promise(() => {
        });
      }
      _initialize(auth2) {
        const key = auth2._key();
        if (this.eventManagers[key]) {
          const { manager, promise: promise2 } = this.eventManagers[key];
          if (manager) {
            return Promise.resolve(manager);
          } else {
            debugAssert(promise2, "If manager is not set, promise should be");
            return promise2;
          }
        }
        const promise = this.initAndGetManager(auth2);
        this.eventManagers[key] = { promise };
        promise.catch(() => {
          delete this.eventManagers[key];
        });
        return promise;
      }
      async initAndGetManager(auth2) {
        const iframe = await _openIframe(auth2);
        const manager = new AuthEventManager(auth2);
        iframe.register("authEvent", (iframeEvent) => {
          _assert(
            iframeEvent?.authEvent,
            auth2,
            "invalid-auth-event"
            /* AuthErrorCode.INVALID_AUTH_EVENT */
          );
          const handled = manager.onEvent(iframeEvent.authEvent);
          return {
            status: handled ? "ACK" : "ERROR"
            /* GapiOutcome.ERROR */
          };
        }, gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER);
        this.eventManagers[auth2._key()] = { manager };
        this.iframes[auth2._key()] = iframe;
        return manager;
      }
      _isIframeWebStorageSupported(auth2, cb) {
        const iframe = this.iframes[auth2._key()];
        iframe.send(WEB_STORAGE_SUPPORT_KEY, { type: WEB_STORAGE_SUPPORT_KEY }, (result) => {
          const isSupported = result?.[0]?.[WEB_STORAGE_SUPPORT_KEY];
          if (isSupported !== void 0) {
            cb(!!isSupported);
          }
          _fail(
            auth2,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
        }, gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER);
      }
      _originValidation(auth2) {
        const key = auth2._key();
        if (!this.originValidationPromises[key]) {
          this.originValidationPromises[key] = _validateOrigin(auth2);
        }
        return this.originValidationPromises[key];
      }
      get _shouldInitProactively() {
        return _isMobileBrowser() || _isSafari() || _isIOS();
      }
    };
    browserPopupRedirectResolver = BrowserPopupRedirectResolver;
    MultiFactorAssertionImpl = class {
      constructor(factorId) {
        this.factorId = factorId;
      }
      _process(auth2, session, displayName) {
        switch (session.type) {
          case "enroll":
            return this._finalizeEnroll(auth2, session.credential, displayName);
          case "signin":
            return this._finalizeSignIn(auth2, session.credential);
          default:
            return debugFail("unexpected MultiFactorSessionType");
        }
      }
    };
    PhoneMultiFactorAssertionImpl = class _PhoneMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
      constructor(credential) {
        super(
          "phone"
          /* FactorId.PHONE */
        );
        this.credential = credential;
      }
      /** @internal */
      static _fromCredential(credential) {
        return new _PhoneMultiFactorAssertionImpl(credential);
      }
      /** @internal */
      _finalizeEnroll(auth2, idToken, displayName) {
        return finalizeEnrollPhoneMfa(auth2, {
          idToken,
          displayName,
          phoneVerificationInfo: this.credential._makeVerificationRequest()
        });
      }
      /** @internal */
      _finalizeSignIn(auth2, mfaPendingCredential) {
        return finalizeSignInPhoneMfa(auth2, {
          mfaPendingCredential,
          phoneVerificationInfo: this.credential._makeVerificationRequest()
        });
      }
    };
    PhoneMultiFactorGenerator = class {
      constructor() {
      }
      /**
       * Provides a {@link PhoneMultiFactorAssertion} to confirm ownership of the phone second factor.
       *
       * @remarks
       * This method does not work in a Node.js environment.
       *
       * @param phoneAuthCredential - A credential provided by {@link PhoneAuthProvider.credential}.
       * @returns A {@link PhoneMultiFactorAssertion} which can be used with
       * {@link MultiFactorResolver.resolveSignIn}
       */
      static assertion(credential) {
        return PhoneMultiFactorAssertionImpl._fromCredential(credential);
      }
    };
    PhoneMultiFactorGenerator.FACTOR_ID = "phone";
    TotpMultiFactorGenerator = class {
      /**
       * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of
       * the TOTP (time-based one-time password) second factor.
       * This assertion is used to complete enrollment in TOTP second factor.
       *
       * @param secret A {@link TotpSecret} containing the shared secret key and other TOTP parameters.
       * @param oneTimePassword One-time password from TOTP App.
       * @returns A {@link TotpMultiFactorAssertion} which can be used with
       * {@link MultiFactorUser.enroll}.
       */
      static assertionForEnrollment(secret, oneTimePassword) {
        return TotpMultiFactorAssertionImpl._fromSecret(secret, oneTimePassword);
      }
      /**
       * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of the TOTP second factor.
       * This assertion is used to complete signIn with TOTP as the second factor.
       *
       * @param enrollmentId identifies the enrolled TOTP second factor.
       * @param oneTimePassword One-time password from TOTP App.
       * @returns A {@link TotpMultiFactorAssertion} which can be used with
       * {@link MultiFactorResolver.resolveSignIn}.
       */
      static assertionForSignIn(enrollmentId, oneTimePassword) {
        return TotpMultiFactorAssertionImpl._fromEnrollmentId(enrollmentId, oneTimePassword);
      }
      /**
       * Returns a promise to {@link TotpSecret} which contains the TOTP shared secret key and other parameters.
       * Creates a TOTP secret as part of enrolling a TOTP second factor.
       * Used for generating a QR code URL or inputting into a TOTP app.
       * This method uses the auth instance corresponding to the user in the multiFactorSession.
       *
       * @param session The {@link MultiFactorSession} that the user is part of.
       * @returns A promise to {@link TotpSecret}.
       */
      static async generateSecret(session) {
        const mfaSession = session;
        _assert(
          typeof mfaSession.user?.auth !== "undefined",
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const response = await startEnrollTotpMfa(mfaSession.user.auth, {
          idToken: mfaSession.credential,
          totpEnrollmentInfo: {}
        });
        return TotpSecret._fromStartTotpMfaEnrollmentResponse(response, mfaSession.user.auth);
      }
    };
    TotpMultiFactorGenerator.FACTOR_ID = "totp";
    TotpMultiFactorAssertionImpl = class _TotpMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
      constructor(otp, enrollmentId, secret) {
        super(
          "totp"
          /* FactorId.TOTP */
        );
        this.otp = otp;
        this.enrollmentId = enrollmentId;
        this.secret = secret;
      }
      /** @internal */
      static _fromSecret(secret, otp) {
        return new _TotpMultiFactorAssertionImpl(otp, void 0, secret);
      }
      /** @internal */
      static _fromEnrollmentId(enrollmentId, otp) {
        return new _TotpMultiFactorAssertionImpl(otp, enrollmentId);
      }
      /** @internal */
      async _finalizeEnroll(auth2, idToken, displayName) {
        _assert(
          typeof this.secret !== "undefined",
          auth2,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        return finalizeEnrollTotpMfa(auth2, {
          idToken,
          displayName,
          totpVerificationInfo: this.secret._makeTotpVerificationInfo(this.otp)
        });
      }
      /** @internal */
      async _finalizeSignIn(auth2, mfaPendingCredential) {
        _assert(
          this.enrollmentId !== void 0 && this.otp !== void 0,
          auth2,
          "argument-error"
          /* AuthErrorCode.ARGUMENT_ERROR */
        );
        const totpVerificationInfo = { verificationCode: this.otp };
        return finalizeSignInTotpMfa(auth2, {
          mfaPendingCredential,
          mfaEnrollmentId: this.enrollmentId,
          totpVerificationInfo
        });
      }
    };
    TotpSecret = class _TotpSecret {
      // The public members are declared outside the constructor so the docs can be generated.
      constructor(secretKey, hashingAlgorithm, codeLength, codeIntervalSeconds, enrollmentCompletionDeadline, sessionInfo, auth2) {
        this.sessionInfo = sessionInfo;
        this.auth = auth2;
        this.secretKey = secretKey;
        this.hashingAlgorithm = hashingAlgorithm;
        this.codeLength = codeLength;
        this.codeIntervalSeconds = codeIntervalSeconds;
        this.enrollmentCompletionDeadline = enrollmentCompletionDeadline;
      }
      /** @internal */
      static _fromStartTotpMfaEnrollmentResponse(response, auth2) {
        return new _TotpSecret(response.totpSessionInfo.sharedSecretKey, response.totpSessionInfo.hashingAlgorithm, response.totpSessionInfo.verificationCodeLength, response.totpSessionInfo.periodSec, new Date(response.totpSessionInfo.finalizeEnrollmentTime).toUTCString(), response.totpSessionInfo.sessionInfo, auth2);
      }
      /** @internal */
      _makeTotpVerificationInfo(otp) {
        return { sessionInfo: this.sessionInfo, verificationCode: otp };
      }
      /**
       * Returns a QR code URL as described in
       * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
       * This can be displayed to the user as a QR code to be scanned into a TOTP app like Google Authenticator.
       * If the optional parameters are unspecified, an accountName of <userEmail> and issuer of <firebaseAppName> are used.
       *
       * @param accountName the name of the account/app along with a user identifier.
       * @param issuer issuer of the TOTP (likely the app name).
       * @returns A QR code URL string.
       */
      generateQrCodeUrl(accountName, issuer) {
        let useDefaults = false;
        if (_isEmptyString(accountName) || _isEmptyString(issuer)) {
          useDefaults = true;
        }
        if (useDefaults) {
          if (_isEmptyString(accountName)) {
            accountName = this.auth.currentUser?.email || "unknownuser";
          }
          if (_isEmptyString(issuer)) {
            issuer = this.auth.name;
          }
        }
        return `otpauth://totp/${issuer}:${accountName}?secret=${this.secretKey}&issuer=${issuer}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`;
      }
    };
    name2 = "@firebase/auth";
    version2 = "1.13.6";
    AuthInterop = class {
      constructor(auth2) {
        this.auth = auth2;
        this.internalListeners = /* @__PURE__ */ new Map();
      }
      getUid() {
        this.assertAuthConfigured();
        return this.auth.currentUser?.uid || null;
      }
      async getToken(forceRefresh) {
        this.assertAuthConfigured();
        await this.auth._initializationPromise;
        if (!this.auth.currentUser) {
          return null;
        }
        const accessToken = await this.auth.currentUser.getIdToken(forceRefresh);
        return { accessToken };
      }
      addAuthTokenListener(listener) {
        this.assertAuthConfigured();
        if (this.internalListeners.has(listener)) {
          return;
        }
        const unsubscribe = this.auth.onIdTokenChanged((user) => {
          listener(user?.stsTokenManager.accessToken || null);
        });
        this.internalListeners.set(listener, unsubscribe);
        this.updateProactiveRefresh();
      }
      removeAuthTokenListener(listener) {
        this.assertAuthConfigured();
        const unsubscribe = this.internalListeners.get(listener);
        if (!unsubscribe) {
          return;
        }
        this.internalListeners.delete(listener);
        unsubscribe();
        this.updateProactiveRefresh();
      }
      assertAuthConfigured() {
        _assert(
          this.auth._initializationPromise,
          "dependent-sdk-initialized-before-auth"
          /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
        );
      }
      updateProactiveRefresh() {
        if (this.internalListeners.size > 0) {
          this.auth._startProactiveRefresh();
        } else {
          this.auth._stopProactiveRefresh();
        }
      }
    };
    DEFAULT_ID_TOKEN_MAX_AGE = 5 * 60;
    authIdTokenMaxAge = getExperimentalSetting("authIdTokenMaxAge") || DEFAULT_ID_TOKEN_MAX_AGE;
    lastPostedIdToken = null;
    mintCookieFactory = (url) => async (user) => {
      const idTokenResult = user && await user.getIdTokenResult();
      const idTokenAge = idTokenResult && ((/* @__PURE__ */ new Date()).getTime() - Date.parse(idTokenResult.issuedAtTime)) / 1e3;
      if (idTokenAge && idTokenAge > authIdTokenMaxAge) {
        return;
      }
      const idToken = idTokenResult?.token;
      if (lastPostedIdToken === idToken) {
        return;
      }
      lastPostedIdToken = idToken;
      await fetch(url, {
        method: idToken ? "POST" : "DELETE",
        headers: idToken ? {
          "Authorization": `Bearer ${idToken}`
        } : {}
      });
    };
    _setExternalJSProvider({
      loadJS(url) {
        return new Promise((resolve, reject) => {
          const el = document.createElement("script");
          el.setAttribute("src", url);
          el.onload = resolve;
          el.onerror = (e) => {
            const error = _createError(
              "internal-error"
              /* AuthErrorCode.INTERNAL_ERROR */
            );
            error.customData = e;
            reject(error);
          };
          el.type = "text/javascript";
          el.charset = "UTF-8";
          getScriptParentElement().appendChild(el);
        });
      },
      gapiScript: "https://apis.google.com/js/api.js",
      recaptchaV2Script: "https://www.google.com/recaptcha/api.js",
      recaptchaEnterpriseScript: "https://www.google.com/recaptcha/enterprise.js?render="
    });
    registerAuth(
      "Browser"
      /* ClientPlatform.BROWSER */
    );
  }
});

// node_modules/@firebase/auth/dist/esm/index.js
var init_esm = __esm({
  "node_modules/@firebase/auth/dist/esm/index.js"() {
    init_index_4NFEPWkC();
    init_index_esm4();
    init_index_esm();
    init_index_esm3();
    init_index_esm2();
  }
});

// node_modules/firebase/auth/dist/esm/index.esm.js
var init_index_esm5 = __esm({
  "node_modules/firebase/auth/dist/esm/index.esm.js"() {
    init_esm();
  }
});

// node_modules/@capacitor-firebase/authentication/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  FirebaseAuthenticationWeb: () => FirebaseAuthenticationWeb
});
var FirebaseAuthenticationWeb;
var init_web = __esm({
  "node_modules/@capacitor-firebase/authentication/dist/esm/web.js"() {
    init_dist();
    init_index_esm5();
    init_definitions();
    FirebaseAuthenticationWeb = class _FirebaseAuthenticationWeb extends WebPlugin {
      constructor() {
        super();
        this.lastConfirmationResult = /* @__PURE__ */ new Map();
        const auth2 = getAuth();
        auth2.onAuthStateChanged((user) => this.handleAuthStateChange(user));
        auth2.onIdTokenChanged((user) => void this.handleIdTokenChange(user));
      }
      async applyActionCode(options) {
        const auth2 = getAuth();
        return applyActionCode(auth2, options.oobCode);
      }
      async createUserWithEmailAndPassword(options) {
        const auth2 = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth2, options.email, options.password);
        return this.createSignInResult(userCredential, null);
      }
      async confirmPasswordReset(options) {
        const auth2 = getAuth();
        return confirmPasswordReset(auth2, options.oobCode, options.newPassword);
      }
      async confirmVerificationCode(options) {
        const { verificationCode, verificationId } = options;
        const confirmationResult = this.lastConfirmationResult.get(verificationId);
        if (!confirmationResult) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_CONFIRMATION_RESULT_MISSING);
        }
        const userCredential = await confirmationResult.confirm(verificationCode);
        return this.createSignInResult(userCredential, null);
      }
      async deleteUser() {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return deleteUser(currentUser);
      }
      async fetchSignInMethodsForEmail(options) {
        const auth2 = getAuth();
        const signInMethods = await fetchSignInMethodsForEmail(auth2, options.email);
        return {
          signInMethods
        };
      }
      async getPendingAuthResult() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getCurrentUser() {
        const auth2 = getAuth();
        const userResult = this.createUserResult(auth2.currentUser);
        const result = {
          user: userResult
        };
        return result;
      }
      async getIdToken(options) {
        const auth2 = getAuth();
        if (!auth2.currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        const idToken = await auth2.currentUser.getIdToken(options === null || options === void 0 ? void 0 : options.forceRefresh);
        const result = {
          token: idToken || ""
        };
        return result;
      }
      async getIdTokenResult(options) {
        const auth2 = getAuth();
        if (!auth2.currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        const idTokenResult = await auth2.currentUser.getIdTokenResult(options === null || options === void 0 ? void 0 : options.forceRefresh);
        const result = Object.assign(Object.assign({}, idTokenResult), { authTime: Date.parse(idTokenResult.authTime), expirationTime: Date.parse(idTokenResult.expirationTime), issuedAtTime: Date.parse(idTokenResult.issuedAtTime) });
        return result;
      }
      async getRedirectResult() {
        const auth2 = getAuth();
        const userCredential = await getRedirectResult(auth2);
        const authCredential = userCredential ? OAuthProvider.credentialFromResult(userCredential) : null;
        return this.createSignInResult(userCredential, authCredential);
      }
      async getTenantId() {
        const auth2 = getAuth();
        return {
          tenantId: auth2.tenantId
        };
      }
      async isSignInWithEmailLink(options) {
        const auth2 = getAuth();
        return {
          isSignInWithEmailLink: isSignInWithEmailLink(auth2, options.emailLink)
        };
      }
      async linkWithApple(options) {
        const provider = new OAuthProvider(ProviderId.APPLE);
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithEmailAndPassword(options) {
        const authCredential = EmailAuthProvider.credential(options.email, options.password);
        const userCredential = await this.linkCurrentUserWithCredential(authCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithEmailLink(options) {
        const authCredential = EmailAuthProvider.credentialWithLink(options.email, options.emailLink);
        const userCredential = await this.linkCurrentUserWithCredential(authCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithFacebook(options) {
        const provider = new FacebookAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = FacebookAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithGameCenter() {
        throw this.unimplemented("Not implemented on web.");
      }
      async linkWithGithub(options) {
        const provider = new GithubAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = GithubAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithGoogle(options) {
        const provider = new GoogleAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = GoogleAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithMicrosoft(options) {
        const provider = new OAuthProvider(ProviderId.MICROSOFT);
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithOpenIdConnect(options) {
        const provider = new OAuthProvider(options.providerId);
        this.applySignInOptions(options, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithPhoneNumber(options) {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        if (!options.phoneNumber) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_PHONE_NUMBER_MISSING);
        }
        if (!options.recaptchaVerifier || !(options.recaptchaVerifier instanceof RecaptchaVerifier)) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_RECAPTCHA_VERIFIER_MISSING);
        }
        try {
          const confirmationResult = await linkWithPhoneNumber(currentUser, options.phoneNumber, options.recaptchaVerifier);
          const { verificationId } = confirmationResult;
          this.lastConfirmationResult.set(verificationId, confirmationResult);
          const event = {
            verificationId
          };
          this.notifyListeners(_FirebaseAuthenticationWeb.PHONE_CODE_SENT_EVENT, event);
        } catch (error) {
          const event = {
            message: this.getErrorMessage(error),
            code: this.getErrorCode(error)
          };
          this.notifyListeners(_FirebaseAuthenticationWeb.PHONE_VERIFICATION_FAILED_EVENT, event);
        }
      }
      async linkWithPlayGames() {
        throw this.unimplemented("Not implemented on web.");
      }
      async linkWithTwitter(options) {
        const provider = new TwitterAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = TwitterAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async linkWithYahoo(options) {
        const provider = new OAuthProvider(ProviderId.YAHOO);
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async reload() {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return reload(currentUser);
      }
      async revokeAccessToken(options) {
        const auth2 = getAuth();
        return revokeAccessToken(auth2, options.token);
      }
      async sendEmailVerification(options) {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return sendEmailVerification(currentUser, options === null || options === void 0 ? void 0 : options.actionCodeSettings);
      }
      async sendPasswordResetEmail(options) {
        const auth2 = getAuth();
        return sendPasswordResetEmail(auth2, options.email, options.actionCodeSettings);
      }
      async sendSignInLinkToEmail(options) {
        const auth2 = getAuth();
        return sendSignInLinkToEmail(auth2, options.email, options.actionCodeSettings);
      }
      async setLanguageCode(options) {
        const auth2 = getAuth();
        auth2.languageCode = options.languageCode;
      }
      async setPersistence(options) {
        const auth2 = getAuth();
        switch (options.persistence) {
          case Persistence.BrowserLocal:
            await setPersistence(auth2, browserLocalPersistence);
            break;
          case Persistence.BrowserSession:
            await setPersistence(auth2, browserSessionPersistence);
            break;
          case Persistence.IndexedDbLocal:
            await setPersistence(auth2, indexedDBLocalPersistence);
            break;
          case Persistence.InMemory:
            await setPersistence(auth2, inMemoryPersistence);
            break;
        }
      }
      async setTenantId(options) {
        const auth2 = getAuth();
        auth2.tenantId = options.tenantId;
      }
      async signInAnonymously() {
        const auth2 = getAuth();
        const userCredential = await signInAnonymously(auth2);
        return this.createSignInResult(userCredential, null);
      }
      async signInWithApple(options) {
        const provider = new OAuthProvider(ProviderId.APPLE);
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithCustomToken(options) {
        const auth2 = getAuth();
        const userCredential = await signInWithCustomToken(auth2, options.token);
        return this.createSignInResult(userCredential, null);
      }
      async signInWithEmailAndPassword(options) {
        const auth2 = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth2, options.email, options.password);
        return this.createSignInResult(userCredential, null);
      }
      async signInWithEmailLink(options) {
        const auth2 = getAuth();
        const userCredential = await signInWithEmailLink(auth2, options.email, options.emailLink);
        return this.createSignInResult(userCredential, null);
      }
      async signInWithFacebook(options) {
        const provider = new FacebookAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = FacebookAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithGithub(options) {
        const provider = new GithubAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = GithubAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithGoogle(options) {
        const provider = new GoogleAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = GoogleAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithMicrosoft(options) {
        const provider = new OAuthProvider(ProviderId.MICROSOFT);
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithOpenIdConnect(options) {
        const provider = new OAuthProvider(options.providerId);
        this.applySignInOptions(options, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithPhoneNumber(options) {
        if (!options.phoneNumber) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_PHONE_NUMBER_MISSING);
        }
        if (!options.recaptchaVerifier || !(options.recaptchaVerifier instanceof RecaptchaVerifier)) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_RECAPTCHA_VERIFIER_MISSING);
        }
        const auth2 = getAuth();
        try {
          const confirmationResult = await signInWithPhoneNumber(auth2, options.phoneNumber, options.recaptchaVerifier);
          const { verificationId } = confirmationResult;
          this.lastConfirmationResult.set(verificationId, confirmationResult);
          const event = {
            verificationId
          };
          this.notifyListeners(_FirebaseAuthenticationWeb.PHONE_CODE_SENT_EVENT, event);
        } catch (error) {
          const event = {
            message: this.getErrorMessage(error),
            code: this.getErrorCode(error)
          };
          this.notifyListeners(_FirebaseAuthenticationWeb.PHONE_VERIFICATION_FAILED_EVENT, event);
        }
      }
      async signInWithPlayGames() {
        throw this.unimplemented("Not implemented on web.");
      }
      async signInWithGameCenter() {
        throw this.unimplemented("Not implemented on web.");
      }
      async signInWithTwitter(options) {
        const provider = new TwitterAuthProvider();
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = TwitterAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signInWithYahoo(options) {
        const provider = new OAuthProvider(ProviderId.YAHOO);
        this.applySignInOptions(options || {}, provider);
        const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
        const authCredential = OAuthProvider.credentialFromResult(userCredential);
        return this.createSignInResult(userCredential, authCredential);
      }
      async signOut() {
        const auth2 = getAuth();
        await auth2.signOut();
      }
      async unlink(options) {
        const auth2 = getAuth();
        if (!auth2.currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        const user = await unlink(auth2.currentUser, options.providerId);
        const userResult = this.createUserResult(user);
        const result = {
          user: userResult
        };
        return result;
      }
      async updateEmail(options) {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return updateEmail(currentUser, options.newEmail);
      }
      async updatePassword(options) {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return updatePassword(currentUser, options.newPassword);
      }
      async updateProfile(options) {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return updateProfile(currentUser, {
          displayName: options.displayName,
          photoURL: options.photoUrl
        });
      }
      async useAppLanguage() {
        const auth2 = getAuth();
        auth2.useDeviceLanguage();
      }
      async useEmulator(options) {
        const auth2 = getAuth();
        const port = options.port || 9099;
        const scheme = options.scheme || "http";
        const connectOptions = options.disableWarnings === void 0 ? void 0 : { disableWarnings: options.disableWarnings };
        if (options.host.includes("://")) {
          connectAuthEmulator(auth2, `${options.host}:${port}`, connectOptions);
        } else {
          connectAuthEmulator(auth2, `${scheme}://${options.host}:${port}`, connectOptions);
        }
      }
      async verifyBeforeUpdateEmail(options) {
        const auth2 = getAuth();
        const currentUser = auth2.currentUser;
        if (!currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return verifyBeforeUpdateEmail(currentUser, options === null || options === void 0 ? void 0 : options.newEmail, options === null || options === void 0 ? void 0 : options.actionCodeSettings);
      }
      handleAuthStateChange(user) {
        const userResult = this.createUserResult(user);
        const change = {
          user: userResult
        };
        this.notifyListeners(_FirebaseAuthenticationWeb.AUTH_STATE_CHANGE_EVENT, change, true);
      }
      async handleIdTokenChange(user) {
        if (!user) {
          return;
        }
        const idToken = await user.getIdToken(false);
        const result = {
          token: idToken
        };
        this.notifyListeners(_FirebaseAuthenticationWeb.ID_TOKEN_CHANGE_EVENT, result, true);
      }
      applySignInOptions(options, provider) {
        if (options.customParameters) {
          const customParameters = {};
          options.customParameters.map((parameter) => {
            customParameters[parameter.key] = parameter.value;
          });
          provider.setCustomParameters(customParameters);
        }
        if (options.scopes) {
          for (const scope of options.scopes) {
            provider.addScope(scope);
          }
        }
      }
      signInWithPopupOrRedirect(provider, mode) {
        const auth2 = getAuth();
        if (mode === "redirect") {
          return signInWithRedirect(auth2, provider);
        } else {
          return signInWithPopup(auth2, provider);
        }
      }
      linkCurrentUserWithPopupOrRedirect(provider, mode) {
        const auth2 = getAuth();
        if (!auth2.currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        if (mode === "redirect") {
          return linkWithRedirect(auth2.currentUser, provider);
        } else {
          return linkWithPopup(auth2.currentUser, provider);
        }
      }
      linkCurrentUserWithCredential(credential) {
        const auth2 = getAuth();
        if (!auth2.currentUser) {
          throw new Error(_FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
        }
        return linkWithCredential(auth2.currentUser, credential);
      }
      requestAppTrackingTransparencyPermission() {
        throw this.unimplemented("Not implemented on web.");
      }
      checkAppTrackingTransparencyPermission() {
        throw this.unimplemented("Not implemented on web.");
      }
      createSignInResult(userCredential, authCredential) {
        const userResult = this.createUserResult((userCredential === null || userCredential === void 0 ? void 0 : userCredential.user) || null);
        const credentialResult = this.createCredentialResult(authCredential);
        const additionalUserInfoResult = this.createAdditionalUserInfoResult(userCredential);
        const result = {
          user: userResult,
          credential: credentialResult,
          additionalUserInfo: additionalUserInfoResult
        };
        return result;
      }
      createCredentialResult(credential) {
        if (!credential) {
          return null;
        }
        const result = {
          providerId: credential.providerId
        };
        if (credential instanceof OAuthCredential) {
          result.accessToken = credential.accessToken;
          result.idToken = credential.idToken;
          result.secret = credential.secret;
        }
        return result;
      }
      createUserResult(user) {
        if (!user) {
          return null;
        }
        const result = {
          displayName: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          isAnonymous: user.isAnonymous,
          metadata: this.createUserMetadataResult(user.metadata),
          phoneNumber: user.phoneNumber,
          photoUrl: user.photoURL,
          providerData: this.createUserProviderDataResult(user.providerData),
          providerId: user.providerId,
          tenantId: user.tenantId,
          uid: user.uid
        };
        return result;
      }
      createUserMetadataResult(metadata) {
        const result = {};
        if (metadata.creationTime) {
          result.creationTime = Date.parse(metadata.creationTime);
        }
        if (metadata.lastSignInTime) {
          result.lastSignInTime = Date.parse(metadata.lastSignInTime);
        }
        return result;
      }
      createUserProviderDataResult(providerData) {
        return providerData.map((data) => ({
          displayName: data.displayName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          photoUrl: data.photoURL,
          providerId: data.providerId,
          uid: data.uid
        }));
      }
      createAdditionalUserInfoResult(credential) {
        if (!credential) {
          return null;
        }
        const additionalUserInfo = getAdditionalUserInfo(credential);
        if (!additionalUserInfo) {
          return null;
        }
        const { isNewUser, profile, providerId, username } = additionalUserInfo;
        const result = {
          isNewUser
        };
        if (providerId !== null) {
          result.providerId = providerId;
        }
        if (profile !== null) {
          result.profile = profile;
        }
        if (username !== null && username !== void 0) {
          result.username = username;
        }
        return result;
      }
      getErrorCode(error) {
        if (error instanceof Object && "code" in error && typeof error["code"] === "string") {
          return error["code"];
        }
        return void 0;
      }
      getErrorMessage(error) {
        if (error instanceof Object && "message" in error && typeof error["message"] === "string") {
          return error["message"];
        }
        return JSON.stringify(error);
      }
    };
    FirebaseAuthenticationWeb.AUTH_STATE_CHANGE_EVENT = "authStateChange";
    FirebaseAuthenticationWeb.ID_TOKEN_CHANGE_EVENT = "idTokenChange";
    FirebaseAuthenticationWeb.PHONE_CODE_SENT_EVENT = "phoneCodeSent";
    FirebaseAuthenticationWeb.PHONE_VERIFICATION_FAILED_EVENT = "phoneVerificationFailed";
    FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN = "No user is signed in.";
    FirebaseAuthenticationWeb.ERROR_PHONE_NUMBER_MISSING = "phoneNumber must be provided.";
    FirebaseAuthenticationWeb.ERROR_RECAPTCHA_VERIFIER_MISSING = "recaptchaVerifier must be provided and must be an instance of RecaptchaVerifier.";
    FirebaseAuthenticationWeb.ERROR_CONFIRMATION_RESULT_MISSING = "No confirmation result with this verification id was found.";
  }
});

// node_modules/@capgo/capacitor-updater/dist/esm/definitions.js
var AppUpdateAvailability, FlexibleUpdateInstallStatus, AppUpdateResultCode;
var init_definitions2 = __esm({
  "node_modules/@capgo/capacitor-updater/dist/esm/definitions.js"() {
    (function(AppUpdateAvailability2) {
      AppUpdateAvailability2[AppUpdateAvailability2["UNKNOWN"] = 0] = "UNKNOWN";
      AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_NOT_AVAILABLE"] = 1] = "UPDATE_NOT_AVAILABLE";
      AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_AVAILABLE"] = 2] = "UPDATE_AVAILABLE";
      AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_IN_PROGRESS"] = 3] = "UPDATE_IN_PROGRESS";
    })(AppUpdateAvailability || (AppUpdateAvailability = {}));
    (function(FlexibleUpdateInstallStatus2) {
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["UNKNOWN"] = 0] = "UNKNOWN";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["PENDING"] = 1] = "PENDING";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["DOWNLOADING"] = 2] = "DOWNLOADING";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["INSTALLING"] = 3] = "INSTALLING";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["INSTALLED"] = 4] = "INSTALLED";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["FAILED"] = 5] = "FAILED";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["CANCELED"] = 6] = "CANCELED";
      FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["DOWNLOADED"] = 11] = "DOWNLOADED";
    })(FlexibleUpdateInstallStatus || (FlexibleUpdateInstallStatus = {}));
    (function(AppUpdateResultCode2) {
      AppUpdateResultCode2[AppUpdateResultCode2["OK"] = 0] = "OK";
      AppUpdateResultCode2[AppUpdateResultCode2["CANCELED"] = 1] = "CANCELED";
      AppUpdateResultCode2[AppUpdateResultCode2["FAILED"] = 2] = "FAILED";
      AppUpdateResultCode2[AppUpdateResultCode2["NOT_AVAILABLE"] = 3] = "NOT_AVAILABLE";
      AppUpdateResultCode2[AppUpdateResultCode2["NOT_ALLOWED"] = 4] = "NOT_ALLOWED";
      AppUpdateResultCode2[AppUpdateResultCode2["INFO_MISSING"] = 5] = "INFO_MISSING";
    })(AppUpdateResultCode || (AppUpdateResultCode = {}));
  }
});

// node_modules/@capgo/capacitor-updater/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  CapacitorUpdaterWeb: () => CapacitorUpdaterWeb
});
var BUNDLE_BUILTIN, CapacitorUpdaterWeb;
var init_web2 = __esm({
  "node_modules/@capgo/capacitor-updater/dist/esm/web.js"() {
    init_dist();
    init_definitions2();
    BUNDLE_BUILTIN = {
      status: "success",
      version: "",
      downloaded: "1970-01-01T00:00:00.000Z",
      id: "builtin",
      checksum: ""
    };
    CapacitorUpdaterWeb = class extends WebPlugin {
      async setStatsUrl(options) {
        console.warn("Cannot setStatsUrl in web", options);
        return;
      }
      async setUpdateUrl(options) {
        console.warn("Cannot setUpdateUrl in web", options);
        return;
      }
      async setChannelUrl(options) {
        console.warn("Cannot setChannelUrl in web", options);
        return;
      }
      async download(options) {
        console.warn("Cannot download version in web", options);
        return BUNDLE_BUILTIN;
      }
      async next(options) {
        console.warn("Cannot set next version in web", options);
        return BUNDLE_BUILTIN;
      }
      async isAutoUpdateEnabled() {
        console.warn("Cannot get isAutoUpdateEnabled in web");
        return { enabled: false };
      }
      async set(options) {
        console.warn("Cannot set active bundle in web", options);
        return;
      }
      async startPreviewSession(options) {
        console.warn("Cannot start preview session in web", options);
        return;
      }
      async listPreviews() {
        console.warn("Cannot list previews in web");
        return { previews: [], currentBundle: BUNDLE_BUILTIN };
      }
      async setPreview(options) {
        console.warn("Cannot set preview in web", options);
        return;
      }
      async resetPreview() {
        console.warn("Cannot reset preview in web");
        return;
      }
      async deletePreview(options) {
        console.warn("Cannot delete preview in web", options);
        return { removed: false, deleted: false };
      }
      async checkPreviewUpdate(options) {
        console.warn("Cannot check preview update in web", options);
        throw this.unimplemented("Preview updates are not available on web platform");
      }
      async updatePreview(options) {
        console.warn("Cannot update preview in web", options);
        throw this.unimplemented("Preview updates are not available on web platform");
      }
      async getDeviceId() {
        console.warn("Cannot get ID in web");
        return { deviceId: "default" };
      }
      async getBuiltinVersion() {
        console.warn("Cannot get version in web");
        return { version: "default" };
      }
      async getPluginVersion() {
        console.warn("Cannot get plugin version in web");
        return { version: "default" };
      }
      async delete(options) {
        console.warn("Cannot delete bundle in web", options);
      }
      async setBundleError(options) {
        console.warn("Cannot setBundleError in web", options);
        return BUNDLE_BUILTIN;
      }
      async list() {
        console.warn("Cannot list bundles in web");
        return { bundles: [] };
      }
      async reset(options) {
        console.warn("Cannot reset version in web", options);
      }
      async current() {
        console.warn("Cannot get current bundle in web");
        return { bundle: BUNDLE_BUILTIN, native: "0.0.0" };
      }
      async reload() {
        console.warn("Cannot reload current bundle in web");
        return;
      }
      async getLatest() {
        console.warn("Cannot getLatest current bundle in web");
        return {
          version: "0.0.0",
          message: "Cannot getLatest current bundle in web"
        };
      }
      async triggerUpdateCheck() {
        console.warn("Cannot triggerUpdateCheck in web");
        return { status: "unavailable", queued: false };
      }
      async getMissingBundleFiles(options) {
        var _a, _b, _c;
        console.warn("Cannot inspect missing bundle files in web", { manifestLength: (_b = (_a = options.manifest) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
        const missing = (_c = options.manifest) !== null && _c !== void 0 ? _c : [];
        return {
          missing,
          total: missing.length,
          missingCount: missing.length,
          reusableCount: 0
        };
      }
      async getBundleDownloadSize(options) {
        var _a, _b, _c, _d, _e;
        console.warn("Cannot estimate bundle download size in web", { manifestLength: (_b = (_a = options.manifest) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
        return {
          totalSize: 0,
          knownFiles: 0,
          unknownFiles: (_d = (_c = options.manifest) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0,
          files: ((_e = options.manifest) !== null && _e !== void 0 ? _e : []).map((entry) => ({
            file_name: entry.file_name,
            file_hash: entry.file_hash,
            download_url: entry.download_url,
            error: "unavailable"
          }))
        };
      }
      async setChannel(options) {
        console.warn("Cannot setChannel in web", options);
        return {
          status: "error",
          error: "Cannot setChannel in web"
        };
      }
      async unsetChannel(options) {
        console.warn("Cannot unsetChannel in web", options);
        return;
      }
      async setCustomId(options) {
        console.warn("Cannot setCustomId in web", options);
        return;
      }
      async getChannel() {
        console.warn("Cannot getChannel in web");
        return {
          status: "error",
          error: "Cannot getChannel in web"
        };
      }
      async listChannels() {
        console.warn("Cannot listChannels in web");
        throw {
          message: "Cannot listChannels in web",
          error: "platform_not_supported"
        };
      }
      async notifyAppReady() {
        return { bundle: BUNDLE_BUILTIN };
      }
      async setMultiDelay(options) {
        console.warn("Cannot setMultiDelay in web", options === null || options === void 0 ? void 0 : options.delayConditions);
        return;
      }
      async cancelDelay() {
        console.warn("Cannot cancelDelay in web");
        return;
      }
      async isAutoUpdateAvailable() {
        console.warn("Cannot isAutoUpdateAvailable in web");
        return { available: false };
      }
      async getCurrentBundle() {
        console.warn("Cannot get current bundle in web");
        return BUNDLE_BUILTIN;
      }
      async getNextBundle() {
        return Promise.resolve(null);
      }
      async getFailedUpdate() {
        console.warn("Cannot getFailedUpdate in web");
        return null;
      }
      async setShakeMenu(_options) {
        throw this.unimplemented("Shake menu not available on web platform");
      }
      async isShakeMenuEnabled() {
        return Promise.resolve({ enabled: false, gesture: "shake" });
      }
      async setShakeChannelSelector(_options) {
        throw this.unimplemented("Shake channel selector not available on web platform");
      }
      async isShakeChannelSelectorEnabled() {
        return Promise.resolve({ enabled: false });
      }
      async getAppId() {
        console.warn("Cannot getAppId in web");
        return { appId: "default" };
      }
      async setAppId(options) {
        console.warn("Cannot setAppId in web", options);
        return;
      }
      // ============================================================================
      // App Store / Play Store Update Methods (Web stubs)
      // ============================================================================
      async getAppUpdateInfo(_options) {
        console.warn("getAppUpdateInfo is not available on web platform");
        return {
          currentVersionName: "0.0.0",
          currentVersionCode: "0",
          updateAvailability: AppUpdateAvailability.UNKNOWN
        };
      }
      async openAppStore(_options) {
        throw this.unimplemented("openAppStore is not available on web platform");
      }
      async performImmediateUpdate() {
        throw this.unimplemented("performImmediateUpdate is only available on Android");
      }
      async startFlexibleUpdate() {
        throw this.unimplemented("startFlexibleUpdate is only available on Android");
      }
      async completeFlexibleUpdate() {
        throw this.unimplemented("completeFlexibleUpdate is only available on Android");
      }
    };
  }
});

// www/admin-script.js
init_dist();
import { getApps, initializeApp as initializeApp2 } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth as getAuth2,
  signInWithEmailAndPassword as signInWithEmailAndPassword2,
  sendPasswordResetEmail as sendPasswordResetEmail2,
  signInWithCustomToken as signInWithCustomToken2,
  onAuthStateChanged as onAuthStateChanged2,
  signOut as signOut2,
  setPersistence as setPersistence2,
  browserLocalPersistence as browserLocalPersistence2,
  GoogleAuthProvider as GoogleAuthProvider2,
  signInWithCredential as signInWithCredential2,
  signInWithPopup as signInWithPopup2
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// node_modules/@capacitor-firebase/authentication/dist/esm/index.js
init_dist();
init_definitions();
var FirebaseAuthentication = registerPlugin("FirebaseAuthentication", {
  web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FirebaseAuthenticationWeb())
});

// node_modules/@capgo/capacitor-updater/dist/esm/index.js
init_dist();

// node_modules/@capgo/capacitor-updater/dist/esm/history.js
var KEEP_FLAG_KEY = "__capgo_keep_url_path_after_reload";
var HISTORY_STORAGE_KEY = "__capgo_history_stack__";
var MAX_STACK_ENTRIES = 100;
var isBrowser2 = typeof window !== "undefined" && typeof document !== "undefined" && typeof history !== "undefined";
if (isBrowser2) {
  const win = window;
  if (!win.__capgoHistoryPatched) {
    win.__capgoHistoryPatched = true;
    const isFeatureConfigured = () => {
      try {
        if (win.__capgoKeepUrlPathAfterReload) {
          return true;
        }
      } catch (_a) {
      }
      try {
        return window.localStorage.getItem(KEEP_FLAG_KEY) === "1";
      } catch (_b) {
        return false;
      }
    };
    const readStored = () => {
      try {
        const raw = window.sessionStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) {
          return { stack: [], index: -1 };
        }
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.stack) || typeof parsed.index !== "number") {
          return { stack: [], index: -1 };
        }
        return parsed;
      } catch (_a) {
        return { stack: [], index: -1 };
      }
    };
    const writeStored = (stack, index) => {
      try {
        window.sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ stack, index }));
      } catch (_a) {
      }
    };
    const clearStored = () => {
      try {
        window.sessionStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (_a) {
      }
    };
    const normalize = (url) => {
      try {
        const base = url !== null && url !== void 0 ? url : window.location.href;
        const parsed = new URL(base instanceof URL ? base.toString() : base, window.location.href);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch (_a) {
        return null;
      }
    };
    const trimStack = (stack, index) => {
      if (stack.length <= MAX_STACK_ENTRIES) {
        return { stack, index };
      }
      const start = stack.length - MAX_STACK_ENTRIES;
      const trimmed = stack.slice(start);
      const adjustedIndex = Math.max(0, index - start);
      return { stack: trimmed, index: adjustedIndex };
    };
    const runWhenReady = (fn) => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        fn();
      } else {
        window.addEventListener("DOMContentLoaded", fn, { once: true });
      }
    };
    let featureActive = false;
    let isRestoring = false;
    let restoreScheduled = false;
    const ensureCurrentTracked = () => {
      if (!featureActive) {
        return;
      }
      const stored = readStored();
      const current = normalize();
      if (!current) {
        return;
      }
      if (stored.stack.length === 0) {
        stored.stack.push(current);
        stored.index = 0;
        writeStored(stored.stack, stored.index);
        return;
      }
      if (stored.index < 0 || stored.index >= stored.stack.length) {
        stored.index = stored.stack.length - 1;
      }
      if (stored.stack[stored.index] !== current) {
        stored.stack[stored.index] = current;
        writeStored(stored.stack, stored.index);
      }
    };
    const record = (url, replace) => {
      if (!featureActive || isRestoring) {
        return;
      }
      const normalized = normalize(url);
      if (!normalized) {
        return;
      }
      let { stack, index } = readStored();
      if (stack.length === 0) {
        stack.push(normalized);
        index = stack.length - 1;
      } else if (replace) {
        if (index < 0 || index >= stack.length) {
          index = stack.length - 1;
        }
        stack[index] = normalized;
      } else {
        if (index >= stack.length - 1) {
          stack.push(normalized);
          index = stack.length - 1;
        } else {
          stack = stack.slice(0, index + 1);
          stack.push(normalized);
          index = stack.length - 1;
        }
      }
      ({ stack, index } = trimStack(stack, index));
      writeStored(stack, index);
    };
    const restoreHistory = () => {
      if (!featureActive || isRestoring) {
        return;
      }
      const stored = readStored();
      if (stored.stack.length === 0) {
        ensureCurrentTracked();
        return;
      }
      const targetIndex = stored.index >= 0 && stored.index < stored.stack.length ? stored.index : stored.stack.length - 1;
      const normalizedCurrent = normalize();
      if (stored.stack.length === 1 && normalizedCurrent === stored.stack[0]) {
        return;
      }
      const firstEntry = stored.stack[0];
      if (!firstEntry) {
        return;
      }
      isRestoring = true;
      try {
        history.replaceState(history.state, document.title, firstEntry);
        for (let i = 1; i < stored.stack.length; i += 1) {
          history.pushState(history.state, document.title, stored.stack[i]);
        }
      } catch (_a) {
        isRestoring = false;
        return;
      }
      isRestoring = false;
      const currentIndex = stored.stack.length - 1;
      const offset = targetIndex - currentIndex;
      if (offset !== 0) {
        history.go(offset);
      } else {
        history.replaceState(history.state, document.title, stored.stack[targetIndex]);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };
    const scheduleRestore = () => {
      if (!featureActive || restoreScheduled) {
        return;
      }
      restoreScheduled = true;
      runWhenReady(() => {
        restoreScheduled = false;
        restoreHistory();
      });
    };
    let originalPushState = null;
    let originalReplaceState = null;
    const popstateHandler = () => {
      if (!featureActive || isRestoring) {
        return;
      }
      const normalized = normalize();
      if (!normalized) {
        return;
      }
      const stored = readStored();
      const idx = stored.stack.lastIndexOf(normalized);
      if (idx >= 0) {
        stored.index = idx;
      } else {
        stored.stack.push(normalized);
        stored.index = stored.stack.length - 1;
      }
      const trimmed = trimStack(stored.stack, stored.index);
      writeStored(trimmed.stack, trimmed.index);
    };
    const patchHistory = () => {
      if (originalPushState && originalReplaceState) {
        return;
      }
      originalPushState = history.pushState;
      originalReplaceState = history.replaceState;
      history.pushState = function pushStatePatched(state, title, url) {
        const result = originalPushState === null || originalPushState === void 0 ? void 0 : originalPushState.call(history, state, title, url);
        record(url, false);
        return result;
      };
      history.replaceState = function replaceStatePatched(state, title, url) {
        const result = originalReplaceState === null || originalReplaceState === void 0 ? void 0 : originalReplaceState.call(history, state, title, url);
        record(url, true);
        return result;
      };
      window.addEventListener("popstate", popstateHandler);
    };
    const unpatchHistory = () => {
      if (originalPushState) {
        history.pushState = originalPushState;
        originalPushState = null;
      }
      if (originalReplaceState) {
        history.replaceState = originalReplaceState;
        originalReplaceState = null;
      }
      window.removeEventListener("popstate", popstateHandler);
    };
    const setFeatureActive = (enabled) => {
      if (featureActive === enabled) {
        if (featureActive) {
          ensureCurrentTracked();
          scheduleRestore();
        }
        return;
      }
      featureActive = enabled;
      if (featureActive) {
        patchHistory();
        ensureCurrentTracked();
        scheduleRestore();
      } else {
        unpatchHistory();
        clearStored();
      }
    };
    window.addEventListener("CapacitorUpdaterKeepUrlPathAfterReload", (event) => {
      var _a;
      const evt = event;
      const enabled = (_a = evt === null || evt === void 0 ? void 0 : evt.detail) === null || _a === void 0 ? void 0 : _a.enabled;
      if (typeof enabled === "boolean") {
        win.__capgoKeepUrlPathAfterReload = enabled;
        setFeatureActive(enabled);
      } else {
        win.__capgoKeepUrlPathAfterReload = true;
        setFeatureActive(true);
      }
    });
    setFeatureActive(isFeatureConfigured());
  }
}

// node_modules/@capgo/capacitor-updater/dist/esm/index.js
init_definitions2();
var CapacitorUpdater = registerPlugin("CapacitorUpdater", {
  web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.CapacitorUpdaterWeb())
});

// www/admin-script.js
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
var firebaseConfig = {
  apiKey: "AIzaSyDZ3tIrZxqYuiYP8fnoNoDcLR6W7wbEt30",
  authDomain: "gio-bd.firebaseapp.com",
  projectId: "gio-bd",
  storageBucket: "gio-bd.firebasestorage.app",
  messagingSenderId: "727420404239",
  appId: "1:727420404239:web:914e2903eb648db782d97a",
  measurementId: "G-B3J9DTP6M9"
};
var app = getApps().length ? getApps()[0] : initializeApp2(firebaseConfig);
var auth = getAuth2(app);
var db = getFirestore(app);
CapacitorUpdater.notifyAppReady().catch((error) => {
  console.warn("Capgo app ready notification:", error);
});
var OWNER_AUTH_API_BASE_URL = "https://gio-bd-owner-auth.onrender.com";
var $ = (id) => document.getElementById(id);
var loginForm = $("loginForm");
var loginMessage = $("loginMessage");
var adminPage = $("adminPage");
var loginPage = $("loginPage");
var adminSettingsPage = $("adminSettingsPage");
var authStatus = $("authStatus");
var logoutBtn = $("logoutBtn");
var isAdmin = false;
var stopOrdersRealtime = null;
async function checkAdmin(user) {
  if (!user) return false;
  try {
    const adminDoc = await getDoc(doc(db, "users", "admin"));
    if (!adminDoc.exists()) return false;
    const data = adminDoc.data();
    return data.uid === user.uid && ["admin", "owner"].includes(String(data.role || "").trim().toLowerCase());
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
await setPersistence2(auth, browserLocalPersistence2);
var adminLanguageToggle = $("adminLanguageToggle");
var adminLanguage = "bn";
var adminTranslations = [
  ["#loginPage h2", "Owner \u09B2\u0997\u0987\u09A8", "Owner Login"],
  [".owner-login-description", "\u09B6\u09C1\u09A7\u09C1\u09AE\u09BE\u09A4\u09CD\u09B0 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 Owner \u09AA\u09CD\u09B0\u09AC\u09C7\u09B6 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964", "Only the authorized Owner can sign in."],
  ['label[for="adminEmail"]', "Owner Gmail", "Owner Gmail"],
  ['label[for="ownerPassword"]', "Password", "Password"],
  ["#ownerPassword", "\u0986\u09AA\u09A8\u09BE\u09B0 Password \u09B2\u09BF\u0996\u09C1\u09A8", "Enter your password"],
  ["#ownerPasswordLoginBtn", "Gmail \u0993 Password \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B2\u0997\u0987\u09A8 \u09B8\u09BE\u09AC\u09AE\u09BF\u099F", "Submit Gmail & Password Login"],
  ["#ownerPasswordLogin h3", "Gmail \u0993 Password \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B2\u0997\u0987\u09A8", "Sign in with Gmail & Password"],
  ["#ownerOtpLogin h3", "Gmail OTP \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B2\u0997\u0987\u09A8", "Sign in with Gmail OTP"],
  ["#ownerOtpLogin p", "\u0986\u09AA\u09A8\u09BE\u09B0 Owner Gmail-\u098F \u09EC \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 OTP \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09AC\u09C7\u0964", "A 6-digit OTP will be sent to your Owner Gmail."],
  ["#ownerSendOtpBtn", "OTP \u09AA\u09BE\u09A0\u09BE\u09A8", "Send OTP"],
  ["#ownerVerifyOtpBtn", "OTP \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8 \u0993 \u09B2\u0997\u0987\u09A8 \u09B8\u09BE\u09AC\u09AE\u09BF\u099F", "Verify OTP & Submit Login"],
  ["#ownerOtpLogin small", "OTP \u09AA\u09BE\u0993\u09AF\u09BC\u09BE\u09B0 \u09AA\u09B0 \u09EC \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u0995\u09CB\u09A1 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964", "Enter the 6-digit code sent to your email."],
  ["#adminPage > h2", "\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1", "Dashboard"],
  ["#adminSettingsPage > h2", "\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09B8\u09C7\u099F\u09BF\u0982\u09B8", "Owner Settings"],
  ['label[for="diamondStockQuantity"]', "\u09AE\u09CB\u099F Diamond Stock", "Total Diamond Stock"],
  ["#diamondStockForm button", "Stock \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u09C1\u09A8", "Save Stock"],
  ["#orderSearch", "\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 ID, \u0995\u09BE\u09B8\u09CD\u099F\u09AE\u09BE\u09B0, IMO ID, \u09AB\u09CB\u09A8 \u09AC\u09BE Transaction ID \u0996\u09C1\u0981\u099C\u09C1\u09A8", "Search Order ID, customer, IMO ID, phone or Transaction ID"],
  ['label[for="bkashNumber"]', "\u09AC\u09BF\u0995\u09BE\u09B6 Personal \u09A8\u09AE\u09CD\u09AC\u09B0", "bKash Personal Number"],
  ['label[for="nagadNumber"]', "\u09A8\u0997\u09A6 Personal \u09A8\u09AE\u09CD\u09AC\u09B0", "Nagad Personal Number"],
  ['label[for="rocketNumber"]', "\u09B0\u0995\u09C7\u099F \u09A8\u09AE\u09CD\u09AC\u09B0", "Rocket Number"],
  ["#paymentSettingsForm button", "\u09A8\u09AE\u09CD\u09AC\u09B0 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u09C1\u09A8", "Save Payment Numbers"],
  ['label[for="whatsappNumber"]', "WhatsApp \u09A8\u09AE\u09CD\u09AC\u09B0 (\u09A6\u09C7\u09B6\u09C7\u09B0 \u0995\u09CB\u09A1\u09B8\u09B9)", "WhatsApp Number (with country code)"],
  ["#supportContactForm button", "WhatsApp \u09A8\u09AE\u09CD\u09AC\u09B0 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u09C1\u09A8", "Save WhatsApp Number"],
  ["#packageForm button", "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8", "Add Package"],
  ["#adminPage h3", "\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1", "Dashboard"]
];
function applyAdminLanguage() {
  adminTranslations.forEach(([selector, bn, en]) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element instanceof HTMLInputElement) element.placeholder = adminLanguage === "en" ? en : bn;
      else element.textContent = adminLanguage === "en" ? en : bn;
    });
  });
  if (adminLanguageToggle) adminLanguageToggle.textContent = adminLanguage === "bn" ? "English" : "\u09AC\u09BE\u0982\u09B2\u09BE";
  document.documentElement.lang = adminLanguage;
}
adminLanguageToggle?.addEventListener("click", () => {
  adminLanguage = adminLanguage === "bn" ? "en" : "bn";
  applyAdminLanguage();
});
var ownerLoginMethodButtons = [...document.querySelectorAll("[data-owner-login-method]")];
function setOwnerLoginMethod(method) {
  const useOtp = method === "otp";
  const passwordPanel = $("ownerPasswordLogin");
  const otpPanel = $("ownerOtpLogin");
  if (passwordPanel) passwordPanel.hidden = useOtp;
  if (otpPanel) otpPanel.hidden = !useOtp;
  ownerLoginMethodButtons.forEach((button) => {
    const active = button.dataset.ownerLoginMethod === method;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}
ownerLoginMethodButtons.forEach((button) => {
  button.addEventListener("click", () => setOwnerLoginMethod(button.dataset.ownerLoginMethod));
});
setOwnerLoginMethod("password");
var ownerEmailInput = $("adminEmail");
var ownerPasswordInput = $("ownerPassword");
var ownerPasswordLoginButton = $("ownerPasswordLoginBtn");
var ownerPasswordResetButton = $("ownerPasswordResetBtn");
if (ownerPasswordResetButton) {
  ownerPasswordResetButton.addEventListener("click", async () => {
    const email = ownerEmailInput?.value.trim().toLowerCase();
    if (email !== "mdniloy41212@gmail.com") {
      showMessage(loginMessage, "\u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 Owner Gmail \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      ownerEmailInput?.focus();
      return;
    }
    ownerPasswordResetButton.disabled = true;
    showMessage(loginMessage, "Firebase \u0985\u09CD\u09AF\u09BE\u09AA Password \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u099A\u09CD\u099B\u09C7...", true);
    try {
      await sendPasswordResetEmail2(auth, email);
      showMessage(loginMessage, "Password \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 Gmail-\u098F \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09DF\u09C7\u099B\u09C7\u0964 Inbox/Spam \u09A6\u09C7\u0996\u09C7 \u09A8\u09A4\u09C1\u09A8 Firebase \u0985\u09CD\u09AF\u09BE\u09AA Password \u09B8\u09C7\u099F \u0995\u09B0\u09C1\u09A8\u0964", true);
    } catch (error) {
      console.error("Owner password reset error:", error);
      const messages = {
        "auth/user-not-found": "\u098F\u0987 Gmail-\u098F\u09B0 Firebase \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964",
        "auth/operation-not-allowed": "Firebase Email/Password provider \u099A\u09BE\u09B2\u09C1 \u09A8\u09C7\u0987\u0964",
        "auth/too-many-requests": "\u0985\u09A8\u09C7\u0995\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u0995\u09BF\u099B\u09C1\u0995\u09CD\u09B7\u09A3 \u09AA\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964"
      };
      showMessage(loginMessage, messages[error.code] || error.message || "Password reset link \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    } finally {
      ownerPasswordResetButton.disabled = false;
    }
  });
}
if (ownerPasswordLoginButton) {
  ownerPasswordLoginButton.addEventListener("click", async () => {
    const email = ownerEmailInput?.value.trim().toLowerCase();
    const password = ownerPasswordInput?.value || "";
    if (!email) {
      showMessage(loginMessage, "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 Owner Gmail \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      ownerEmailInput?.focus();
      return;
    }
    if (email !== "mdniloy41212@gmail.com") {
      showMessage(loginMessage, "\u098F\u0987 Gmail \u09A6\u09BF\u09DF\u09C7 Owner Login \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09A8\u09DF\u0964");
      return;
    }
    if (!password) {
      showMessage(loginMessage, "\u0986\u09AA\u09A8\u09BE\u09B0 Password \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      ownerPasswordInput?.focus();
      return;
    }
    ownerPasswordLoginButton.disabled = true;
    showMessage(loginMessage, "Gmail \u0993 Password \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u099A\u09CD\u099B\u09C7...", true);
    try {
      await signInWithEmailAndPassword2(auth, email, password);
      showMessage(loginMessage, "\u09B2\u0997\u0987\u09A8 \u09B8\u09AB\u09B2\u0964 Owner \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u09B9\u099A\u09CD\u099B\u09C7...", true);
    } catch (error) {
      console.error("Owner email/password login error:", error);
      const messages = {
        "auth/invalid-credential": "Firebase \u0985\u09CD\u09AF\u09BE\u09AA\u09C7\u09B0 Password \u09AE\u09C7\u09B2\u09C7\u09A8\u09BF\u0964 Gmail-\u098F\u09B0 \u0986\u09B8\u09B2 Password \u09A8\u09DF\u2014Firebase \u0985\u09CD\u09AF\u09BE\u09AA Password \u09A6\u09BF\u09DF\u09C7 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8 \u0985\u09A5\u09AC\u09BE \u09A8\u09BF\u099A\u09C7\u09B0 Reset Password \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C1\u09A8.",
        "auth/user-not-found": "\u098F\u0987 Gmail \u09A6\u09BF\u09DF\u09C7 Firebase Owner \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964",
        "auth/wrong-password": "Password \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF\u0964",
        "auth/too-many-requests": "\u0985\u09A8\u09C7\u0995\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u0995\u09BF\u099B\u09C1\u0995\u09CD\u09B7\u09A3 \u09AA\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964",
        "auth/operation-not-allowed": "Firebase Authentication-\u098F Email/Password sign-in \u099A\u09BE\u09B2\u09C1 \u09A8\u09C7\u0987\u0964"
      };
      showMessage(loginMessage, messages[error.code] || error.message || "\u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    } finally {
      ownerPasswordLoginButton.disabled = false;
    }
  });
}
var ownerOtpEmailInput = $("ownerOtpEmail");
var ownerOtpCodeInput = $("ownerOtpCode");
var ownerSendOtpButton = $("ownerSendOtpBtn");
var ownerVerifyOtpButton = $("ownerVerifyOtpBtn");
async function ownerAuthRequest(path, payload) {
  const response = await fetch(OWNER_AUTH_API_BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(result.message || result.error || "\u0985\u09A8\u09C1\u09B0\u09CB\u09A7\u099F\u09BF \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09DF\u09A8\u09BF\u0964");
  }
  return result;
}
if (ownerSendOtpButton) {
  ownerSendOtpButton.addEventListener("click", async () => {
    const email = ownerOtpEmailInput?.value.trim().toLowerCase();
    if (!email) {
      showMessage(loginMessage, "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 Owner Gmail \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      ownerOtpEmailInput?.focus();
      return;
    }
    if (email !== "mdniloy41212@gmail.com") {
      showMessage(loginMessage, "\u098F\u0987 Gmail \u09A6\u09BF\u09DF\u09C7 Owner Login \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09A8\u09DF\u0964");
      return;
    }
    ownerSendOtpButton.disabled = true;
    showMessage(loginMessage, "\u0986\u09AA\u09A8\u09BE\u09B0 Gmail-\u098F OTP \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u099A\u09CD\u099B\u09C7...", true);
    try {
      await ownerAuthRequest("/api/owner/send-otp", { email });
      showMessage(loginMessage, "OTP \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09DF\u09C7\u099B\u09C7\u0964 Gmail Inbox/Spam \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964", true);
      ownerOtpCodeInput?.focus();
    } catch (error) {
      console.error("Owner send OTP error:", error);
      showMessage(loginMessage, error.message || "OTP \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    } finally {
      ownerSendOtpButton.disabled = false;
    }
  });
}
if (ownerVerifyOtpButton) {
  ownerVerifyOtpButton.addEventListener("click", async () => {
    const email = ownerOtpEmailInput?.value.trim().toLowerCase();
    const otp = ownerOtpCodeInput?.value.trim();
    if (!email || email !== "mdniloy41212@gmail.com") {
      showMessage(loginMessage, "\u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 Owner Gmail \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      ownerOtpEmailInput?.focus();
      return;
    }
    if (!/^[0-9]{6}$/.test(otp || "")) {
      showMessage(loginMessage, "\u09B8\u09A0\u09BF\u0995 \u09EC \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 OTP \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      ownerOtpCodeInput?.focus();
      return;
    }
    ownerVerifyOtpButton.disabled = true;
    showMessage(loginMessage, "OTP \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u099A\u09CD\u099B\u09C7...", true);
    try {
      const verification = await ownerAuthRequest("/api/owner/verify-otp", { email, otp });
      if (!verification.verificationToken) throw new Error("OTP \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u099F\u09CB\u0995\u09C7\u09A8 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
      const completed = await ownerAuthRequest("/api/owner/complete-login", {
        email,
        verificationToken: verification.verificationToken
      });
      if (!completed.customToken) throw new Error("Firebase Login Token \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
      showMessage(loginMessage, "OTP \u09B8\u09A0\u09BF\u0995\u0964 Owner Login \u09B9\u099A\u09CD\u099B\u09C7...", true);
      await signInWithCustomToken2(auth, completed.customToken);
    } catch (error) {
      console.error("Owner OTP login error:", error);
      showMessage(loginMessage, error.message || "OTP \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7 \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    } finally {
      ownerVerifyOtpButton.disabled = false;
    }
  });
}
var ownerGoogleLoginButton = $("ownerGoogleLoginBtn");
if (ownerGoogleLoginButton) {
  ownerGoogleLoginButton.addEventListener("click", async () => {
    ownerGoogleLoginButton.disabled = true;
    showMessage(loginMessage, "Google \u09A6\u09BF\u09DF\u09C7 Owner Login \u09B9\u099A\u09CD\u099B\u09C7...", true);
    try {
      if (Capacitor.isNativePlatform()) {
        const nativeResult = await FirebaseAuthentication.signInWithGoogle();
        const idToken = nativeResult.credential?.idToken;
        if (!idToken) {
          throw new Error("Google ID Token \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 Firebase Android configuration \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964");
        }
        const credential = GoogleAuthProvider2.credential(idToken);
        await signInWithCredential2(auth, credential);
      } else {
        const provider = new GoogleAuthProvider2();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup2(auth, provider);
      }
      const user = auth.currentUser;
      if (!user || user.email?.trim().toLowerCase() !== "mdniloy41212@gmail.com") {
        showMessage(loginMessage, "\u098F\u0987 Gmail Owner Login-\u098F\u09B0 \u099C\u09A8\u09CD\u09AF \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09A8\u09DF\u0964");
        await signOut2(auth);
        return;
      }
      const allowed = await checkAdmin(user);
      if (!allowed) {
        showMessage(loginMessage, "\u098F\u0987 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7\u09B0 Owner \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09A8\u09C7\u0987\u0964");
        await signOut2(auth);
        return;
      }
      showMessage(loginMessage, "Owner Google Login \u09B8\u09AB\u09B2 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
    } catch (error) {
      console.error("Owner Google Login error:", error);
      showMessage(loginMessage, error.message || "Google \u09A6\u09BF\u09DF\u09C7 Login \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    } finally {
      ownerGoogleLoginButton.disabled = false;
    }
  });
}
onAuthStateChanged2(auth, async (user) => {
  if (stopOrdersRealtime) {
    stopOrdersRealtime();
    stopOrdersRealtime = null;
  }
  isAdmin = false;
  if (!user) {
    document.querySelector(".gio-admin-bottom-nav")?.setAttribute("hidden", "");
    document.querySelector(".gio-admin-help")?.setAttribute("hidden", "");
    if (loginPage) {
      loginPage.hidden = false;
      loginPage.classList.add("active");
    }
    if (adminPage) {
      adminPage.hidden = true;
      adminPage.classList.remove("active");
    }
    if (adminSettingsPage) {
      adminSettingsPage.hidden = true;
      adminSettingsPage.classList.remove("active");
    }
    if (logoutBtn) logoutBtn.hidden = true;
    if (authStatus) authStatus.textContent = "\u0986\u09AA\u09A8\u09BF \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C7\u09A8\u09A8\u09BF";
    return;
  }
  const allowed = await checkAdmin(user);
  if (!allowed) {
    showMessage(loginMessage, "\u098F\u0987 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09A8\u09C7\u0987\u0964");
    await signOut2(auth);
    return;
  }
  isAdmin = true;
  stopOrdersRealtime = onSnapshot(collection(db, "orders"), (snapshot) => {
    const pendingCount = snapshot.docs.filter((item) => ["Pending", "Processing"].includes(item.data().status || "Pending") && item.data().isArchived !== true).length;
    const alertBox = $("adminOrderAlert");
    if (alertBox) alertBox.textContent = "\u09A8\u09A4\u09C1\u09A8 / \u099A\u09B2\u09AE\u09BE\u09A8 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0: " + pendingCount;
    loadAdminOrders();
    loadDashboardStats();
  }, (error) => {
    console.error("Realtime orders listener:", error);
    const alertBox = $("adminOrderAlert");
    if (alertBox) alertBox.textContent = "\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09A8\u09CB\u099F\u09BF\u09AB\u09BF\u0995\u09C7\u09B6\u09A8 \u09B2\u09CB\u09A1 \u09B9\u09DF\u09A8\u09BF\u0964";
  });
  document.querySelector(".gio-admin-bottom-nav")?.removeAttribute("hidden");
  document.querySelector(".gio-admin-help")?.removeAttribute("hidden");
  if (loginPage) {
    loginPage.hidden = true;
    loginPage.classList.remove("active");
  }
  if (adminPage) {
    adminPage.hidden = false;
    adminPage.classList.add("active");
  }
  if (adminSettingsPage) {
    adminSettingsPage.hidden = true;
    adminSettingsPage.classList.remove("active");
  }
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
var settingsButton = $("adminSettingsButton");
var settingsBackButton = $("adminSettingsBack");
if (settingsButton) {
  settingsButton.hidden = true;
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
    await signOut2(auth);
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
    const active = [], history2 = [], rejected = [], archived = [];
    snapshot.forEach((item) => {
      const data = item.data();
      const row = { id: item.id, data };
      if (data.isArchived === true) archived.push(row);
      else if (data.status === "Rejected") rejected.push(row);
      else if (["Approved", "Completed", "Cancelled"].includes(data.status)) history2.push(row);
      else active.push(row);
    });
    const renderRows = (box, rows, empty, canChange, canArchive) => {
      if (!box) return;
      box.replaceChildren();
      if (!rows.length) {
        box.textContent = empty;
        return;
      }
      const term = $("orderSearch")?.value.trim().toLowerCase() || "";
      const chosenStatus = $("orderStatusFilter")?.value || "all";
      rows = rows.filter(({ id, data }) => {
        const searchable = [id, data.customerName, data.customerEmail, data.customerPhone, data.imoId, data.transactionId, data.packageName].join(" ").toLowerCase();
        return (!term || searchable.includes(term)) && (chosenStatus === "all" || data.status === chosenStatus || chosenStatus === "Archived" && data.isArchived === true);
      });
      rows.sort((x, y) => (y.data.createdAt?.toMillis?.() || 0) - (x.data.createdAt?.toMillis?.() || 0));
      rows.forEach(({ id, data }) => {
        const card = document.createElement("article");
        card.className = "order-card";
        const details = document.createElement("p");
        details.textContent = "\u0985\u09B0\u09CD\u09A1\u09BE\u09B0: " + id + " | \u0995\u09BE\u09B8\u09CD\u099F\u09AE\u09BE\u09B0: " + (data.customerName || "\u09A8\u09C7\u0987") + " | \u0987\u09AE\u09C7\u0987\u09B2: " + (data.customerEmail || "\u09A8\u09C7\u0987") + " | \u09AB\u09CB\u09A8: " + (data.customerPhone || "\u09A8\u09C7\u0987") + " | IMO ID: " + (data.imoId || "\u09A8\u09C7\u0987") + " | \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C: " + (data.packageName || "\u09A8\u09C7\u0987") + " | Diamond: " + (Number(data.diamondQuantity) || Number(String(data.packageName || "").match(/[0-9]+/)?.[0]) || "\u09A8\u09C7\u0987") + " | \u09AE\u09C2\u09B2\u09CD\u09AF: \u09F3" + (data.price ?? "\u09A8\u09C7\u0987") + " | \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F: " + (data.paymentMethod || "\u09A8\u09C7\u0987") + " | Transaction ID: " + (data.transactionId || "\u09A8\u09C7\u0987") + " | \u0985\u09AC\u09B8\u09CD\u09A5\u09BE: " + (data.status || "Pending");
        card.appendChild(details);
        if (data.paymentScreenshotUrl) {
          const link = document.createElement("a");
          link.href = data.paymentScreenshotUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09A8\u09B6\u099F \u09A6\u09C7\u0996\u09C1\u09A8";
          card.appendChild(link);
        }
        if (canChange && !["Completed", "Rejected", "Cancelled"].includes(data.status)) {
          if (data.status === "Approved") {
            card.appendChild(makeButton("Confirm / Complete", () => updateOrderStatus(id, "Completed")));
          } else if (data.paymentVerified === true) {
            card.appendChild(makeButton("Confirm", () => updateOrderStatus(id, "Approved")));
          } else {
            card.appendChild(makeButton("\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8", () => verifyPayment(id)));
          }
          card.appendChild(makeButton("Cancel / Reject", () => updateOrderStatus(id, "Rejected")));
        }
        if (canArchive) card.appendChild(makeButton("Delete / Archive", () => archiveOrder(id)));
        if (box === archivedBox) card.appendChild(makeButton("Restore", () => restoreOrder(id)));
        box.appendChild(card);
      });
    };
    renderRows(activeBox, active, "\u0995\u09CB\u09A8\u09CB Pending \u09AC\u09BE Processing \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09A8\u09C7\u0987\u0964", true, true);
    renderRows(historyBox, history2, "\u098F\u0996\u09A8\u09CB \u0995\u09CB\u09A8\u09CB Approved / Completed \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09A8\u09C7\u0987\u0964", true, true);
    renderRows(rejectedBox, rejected, "Rejected \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09A8\u09C7\u0987\u0964", false, true);
    renderRows(archivedBox, archived, "Deleted / Archived \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09A8\u09C7\u0987\u0964", false, false);
  } catch (error) {
    console.error("Orders error:", error);
    [activeBox, historyBox, rejectedBox, archivedBox].filter(Boolean).forEach((box) => box.textContent = "\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 Firestore Rules \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964");
  }
}
async function verifyPayment(orderId) {
  if (!isAdmin) return;
  try {
    const orderSnapshot = await getDoc(doc(db, "orders", orderId));
    if (!orderSnapshot.exists()) throw new Error("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    const transactionId = String(orderSnapshot.data().transactionId || "").trim();
    if (!transactionId) throw new Error("Transaction ID \u09A8\u09BE \u09A5\u09BE\u0995\u09B2\u09C7 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F Verified \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964");
    if (orderSnapshot.data().paymentVerified === true) {
      alert("\u098F\u0987 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0986\u0997\u09C7\u0987 Verified \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964");
      return;
    }
    if (!confirm("Transaction ID: " + transactionId + "\n\n\u0986\u09AA\u09A8\u09BF \u0995\u09BF bKash / Nagad / Rocket-\u098F\u09B0 \u09B2\u09C7\u09A8\u09A6\u09C7\u09A8\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AE\u09BF\u09B2\u09BF\u09DF\u09C7 \u099F\u09BE\u0995\u09BE \u09AA\u09BE\u0993\u09DF\u09BE\u09B0 \u09AC\u09BF\u09B7\u09DF\u099F\u09BF \u09A8\u09BF\u099C\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7\u099B\u09C7\u09A8?\n\n\u09B6\u09C1\u09A7\u09C1 \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u09B9\u0993\u09DF\u09BE\u09B0 \u09AA\u09B0 OK \u099A\u09BE\u09AA\u09C1\u09A8\u0964")) return;
    await updateDoc(doc(db, "orders", orderId), {
      paymentVerified: true,
      paymentVerifiedAt: serverTimestamp(),
      paymentVerifiedBy: auth.currentUser?.uid || "",
      updatedAt: serverTimestamp()
    });
    await loadAdminOrders();
  } catch (error) {
    console.error("Payment verification error:", error);
    alert("\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF: " + (error.message || "\u0985\u099C\u09BE\u09A8\u09BE \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE"));
  }
}
async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;
  try {
    const notificationOrder = await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u099F\u09BF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
      const order = orderSnap.data();
      if (status === "Approved" && order.paymentVerified !== true) {
        throw new Error("\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 Transaction ID \u0993 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09A8\u09BF\u099C\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7 \u2018\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u2019 \u099A\u09BE\u09AA\u09C1\u09A8\u0964");
      }
      const paymentIsVerified = order.paymentVerified === true;
      const isYellowDiamondOrder = String(order.packageType || "").toLowerCase() === "yellow";
      if (order.status === "Completed" && status !== "Completed") {
        throw new Error("Completed \u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u099F\u09BE\u09B8 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964");
      }
      if (status === "Completed" && order.status !== "Approved") {
        throw new Error("\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 Payment Verified \u0995\u09B0\u09C7 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 Approved \u0995\u09B0\u09C1\u09A8, \u09A4\u09BE\u09B0\u09AA\u09B0 Completed \u0995\u09B0\u09C1\u09A8\u0964");
      }
      if (status === "Completed" && order.paymentVerified !== true) {
        throw new Error("Payment Verified \u09A8\u09BE \u0995\u09B0\u09C7 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 Completed \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964");
      }
      if (status === "Completed" && order.stockDeducted !== true && !isYellowDiamondOrder) {
        throw new Error("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 Approved \u09B9\u0993\u09DF\u09BE\u09B0 \u09B8\u09AE\u09DF Diamond Stock \u0995\u09BE\u099F\u09BE \u09B9\u09DF\u09A8\u09BF\u0964 \u0986\u0997\u09C7 Stock \u0993 Approval \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964");
      }
      const shouldDeduct = status === "Approved" && paymentIsVerified && order.stockDeducted !== true && order.status !== "Completed" && !isYellowDiamondOrder;
      const shouldRestore = ["Cancelled", "Rejected"].includes(status) && order.status === "Approved" && order.stockDeducted === true && order.stockRestored !== true && !isYellowDiamondOrder;
      const shouldDebitMoney = shouldDeduct && order.balanceDeducted !== true;
      const shouldRefundMoney = shouldRestore && order.balanceDeducted === true && order.balanceRefunded !== true;
      let balanceRef = null;
      let balanceSnap = null;
      let currentBalance = 0;
      const orderAmount = Number(order.price);
      if ((shouldDebitMoney || shouldRefundMoney) && (!Number.isFinite(orderAmount) || orderAmount < 0)) {
        throw new Error("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B8\u09A0\u09BF\u0995 \u09AE\u09C2\u09B2\u09CD\u09AF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF; \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964");
      }
      if (shouldDebitMoney || shouldRefundMoney) {
        balanceRef = doc(db, "settings", "mainBalance");
        balanceSnap = await transaction.get(balanceRef);
        currentBalance = Number(balanceSnap.exists() ? balanceSnap.data().amount : 0);
        if (!Number.isFinite(currentBalance) || currentBalance < 0) {
          throw new Error("Owner Main Balance \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF\u0964");
        }
        if (shouldDebitMoney && currentBalance < orderAmount) {
          throw new Error("Owner Main Balance \u0985\u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4\u0964 \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8 \u09F3" + orderAmount + ", \u0986\u099B\u09C7 \u09F3" + currentBalance);
        }
      }
      if (shouldDeduct) {
        const quantity = Number(order.diamondQuantity) || Number(String(order.packageName || "").match(/[0-9]+/)?.[0]) || 0;
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("\u098F\u0987 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 Diamond quantity \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09C7\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09A0\u09BF\u0995 \u0995\u09B0\u09C1\u09A8\u0964");
        }
        const stockRef = doc(db, "settings", "diamondStock");
        const stockSnap = await transaction.get(stockRef);
        const currentStock = Number(stockSnap.exists() ? stockSnap.data().quantity : 0);
        if (!Number.isFinite(currentStock) || currentStock < quantity) {
          throw new Error("\u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 Diamond Stock \u09A8\u09C7\u0987\u0964 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09B8\u09CD\u099F\u0995: " + currentStock);
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
          status,
          statusChangedAt: serverTimestamp(),
          paymentVerified: true,
          paymentVerifiedAt: order.paymentVerified === true ? order.paymentVerifiedAt || serverTimestamp() : serverTimestamp(),
          stockDeducted: true,
          stockDeductedQuantity: quantity,
          stockDeductedAt: serverTimestamp(),
          stockRestored: false,
          balanceDeducted: shouldDebitMoney || order.balanceDeducted === true,
          balanceDeductedAmount: shouldDebitMoney ? orderAmount : Number(order.balanceDeductedAmount) || 0,
          balanceDeductedAt: shouldDebitMoney ? serverTimestamp() : order.balanceDeductedAt || null,
          balanceRefunded: false,
          isArchived: false,
          updatedAt: serverTimestamp()
        });
      } else if (shouldRestore) {
        const quantity = Number(order.stockDeductedQuantity) || Number(order.diamondQuantity) || Number(String(order.packageName || "").match(/[0-9]+/)?.[0]) || 0;
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("\u09AB\u09C7\u09B0\u09A4 \u09A6\u09C7\u0993\u09DF\u09BE\u09B0 Diamond quantity \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 Admin-\u098F\u09B0 \u09B8\u09B9\u09BE\u09DF\u09A4\u09BE \u09A8\u09BF\u09A8\u0964");
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
          status,
          statusChangedAt: serverTimestamp(),
          stockDeducted: false,
          stockRestored: true,
          stockRestoredQuantity: quantity,
          stockRestoredAt: serverTimestamp(),
          balanceRefunded: shouldRefundMoney || order.balanceRefunded === true,
          balanceRefundedAmount: shouldRefundMoney ? orderAmount : Number(order.balanceRefundedAmount) || 0,
          balanceRefundedAt: shouldRefundMoney ? serverTimestamp() : order.balanceRefundedAt || null,
          isArchived: false,
          updatedAt: serverTimestamp()
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
          senderName: "GIO BD \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u0986\u09AA\u09A1\u09C7\u099F",
          text: completed ? "\u2705 \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09B0\u09BF\u09B8\u09BF\u09AD \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u0995\u09AE\u09AA\u09CD\u09B2\u09BF\u099F\u0964 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C: " + notificationOrder.packageName + " | \u09AE\u09C2\u09B2\u09CD\u09AF: \u09F3" + (notificationOrder.price ?? "\u2014") + " | Order ID: " + orderId : "\u274C \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u099F\u09BF \u0995\u09CD\u09AF\u09BE\u09A8\u09B8\u09C7\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C: " + notificationOrder.packageName + " | Order ID: " + orderId,
          orderId,
          orderStatus: status,
          createdAt: serverTimestamp()
        });
      } catch (notificationError) {
        console.error("Customer order notification could not be sent:", notificationError);
        alert("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u099F\u09BE\u09B8 \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09DF\u09C7\u099B\u09C7, \u09A4\u09AC\u09C7 \u0995\u09BE\u09B8\u09CD\u099F\u09AE\u09BE\u09B0 \u09A8\u09CB\u099F\u09BF\u09AB\u09BF\u0995\u09C7\u09B6\u09A8 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09AF\u09BE\u09DF\u09A8\u09BF: " + notificationError.message);
      }
    }
    await loadAdminOrders();
    await loadDashboardStats();
  } catch (error) {
    console.error("Update order error:", error);
    alert("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF: " + (error.message || "\u0985\u099C\u09BE\u09A8\u09BE \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE"));
  }
}
async function archiveOrder(orderId) {
  if (!isAdmin) return;
  try {
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    if (!orderSnap.exists()) throw new Error("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    const createdAt = orderSnap.data().createdAt?.toMillis?.() || 0;
    if (!createdAt || Date.now() - createdAt < 12 * 60 * 60 * 1e3) {
      throw new Error("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF \u09B9\u0993\u09DF\u09BE\u09B0 \u09E7\u09E8 \u0998\u09A3\u09CD\u099F\u09BE \u09AA\u09C2\u09B0\u09CD\u09A3 \u09B9\u09B2\u09C7 History Archive \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964");
    }
    if (!confirm("\u09E7\u09E8 \u0998\u09A3\u09CD\u099F\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u098F\u0987 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 History \u09A5\u09C7\u0995\u09C7 Archive \u0995\u09B0\u09AC\u09C7\u09A8? \u09AA\u09B0\u09C7 Restore \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7\u0964")) return;
    await updateDoc(doc(db, "orders", orderId), { isArchived: true, archivedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await loadAdminOrders();
    await loadDashboardStats();
  } catch (error) {
    console.error("Archive order error:", error);
    alert("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 Archive \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF: " + (error.message || ""));
  }
}
async function restoreOrder(orderId) {
  if (!isAdmin) return;
  try {
    await updateDoc(doc(db, "orders", orderId), { isArchived: false, restoredAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await loadAdminOrders();
    await loadDashboardStats();
  } catch (error) {
    console.error("Restore order error:", error);
    alert("\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u09AB\u09BF\u09B0\u09BF\u09DF\u09C7 \u0986\u09A8\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
  }
}
async function loadDashboardStats() {
  const container = $("dashboardStats");
  if (!container || !isAdmin) return;
  try {
    const [ordersSnapshot, stockSnapshot, balanceSnapshot] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDoc(doc(db, "settings", "diamondStock")),
      getDoc(doc(db, "settings", "mainBalance"))
    ]);
    let salesMoney = 0;
    let totalDiamonds = 0;
    ordersSnapshot.forEach((item) => {
      const data = item.data();
      if (data.status === "Completed" && data.isArchived !== true) {
        salesMoney += Number(data.price) || 0;
        totalDiamonds += Number(data.diamondQuantity) || Number(String(data.packageName || "").match(/[0-9]+/)?.[0]) || 0;
      }
    });
    const stock = Number(stockSnapshot.exists() ? stockSnapshot.data().quantity : 0);
    const balance = Number(balanceSnapshot.exists() ? balanceSnapshot.data().amount : 0);
    container.replaceChildren();
    const cards = [
      ["MAIN BALANCE", "\u09F3" + balance.toLocaleString("en-BD"), "main-balance"],
      ["TOTAL SALES", "\u09F3" + salesMoney.toLocaleString("en-BD"), "sales-money"],
      ["TOTAL DIAMOND", totalDiamonds.toLocaleString("en-BD") + " \u{1F48E}", "total-diamonds"],
      ["DIAMOND STOCK", stock.toLocaleString("en-BD") + " \u{1F48E}", "current-diamonds"]
    ];
    cards.forEach(([label, value, kind]) => {
      const card = document.createElement("div");
      card.className = "order-card dashboard-stat-card owner-diamond-card " + kind;
      const title = document.createElement("strong");
      title.textContent = label;
      const number = document.createElement("p");
      number.textContent = String(value);
      if (kind === "current-diamonds") {
        const controls = document.createElement("div");
        controls.className = "owner-stock-inline-controls";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "owner-stock-edit-button";
        edit.textContent = "\u270E Edit";
        const editor = document.createElement("div");
        editor.className = "owner-stock-inline-editor";
        editor.hidden = true;
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.step = "1";
        input.inputMode = "numeric";
        input.setAttribute("aria-label", "New Diamond Stock");
        input.value = String(stock);
        const save = document.createElement("button");
        save.type = "button";
        save.className = "owner-stock-save-button";
        save.textContent = "Save";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "owner-stock-cancel-button";
        cancel.textContent = "Cancel";
        const message = document.createElement("small");
        message.className = "owner-stock-inline-message";
        edit.addEventListener("click", () => {
          editor.hidden = false;
          edit.hidden = true;
          input.value = String(stock);
          input.focus();
        });
        cancel.addEventListener("click", () => {
          editor.hidden = true;
          edit.hidden = false;
          message.textContent = "";
        });
        save.addEventListener("click", async () => {
          if (!isAdmin) return;
          const quantity = Number(input.value);
          if (!Number.isSafeInteger(quantity) || quantity < 0) {
            message.textContent = "\u09E6 \u09AC\u09BE \u09A4\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09AA\u09C2\u09B0\u09CD\u09A3\u09B8\u0982\u0996\u09CD\u09AF\u09BE \u09A6\u09BF\u09A8\u0964";
            return;
          }
          save.disabled = true;
          message.textContent = "\u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u099A\u09CD\u099B\u09C7...";
          try {
            await setDoc(doc(db, "settings", "diamondStock"), {
              quantity,
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser?.uid || ""
            });
            await loadDashboardStats();
          } catch (error) {
            console.error("Inline stock update error:", error);
            message.textContent = "Stock \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09A8\u09BF\u0964 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964";
            save.disabled = false;
          }
        });
        editor.append(input, save, cancel, message);
        controls.append(edit, editor);
        card.appendChild(controls);
      }
      card.append(title, number);
      container.appendChild(card);
    });
    const balanceInput = $("mainBalanceAmount");
    if (balanceInput && document.activeElement !== balanceInput) balanceInput.value = String(balance);
    const stockInput = $("diamondStockQuantity");
    if (stockInput && document.activeElement !== stockInput) stockInput.value = String(stock);
  } catch (error) {
    console.error("Dashboard error:", error);
    container.textContent = "\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964";
  }
}
var mainBalanceForm = $("mainBalanceForm");
if (mainBalanceForm) {
  mainBalanceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    const amount = Number($("mainBalanceAmount")?.value);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      showMessage($("mainBalanceMessage"), "\u09E6 \u09AC\u09BE \u09A4\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09AA\u09C2\u09B0\u09CD\u09A3\u09B8\u0982\u0996\u09CD\u09AF\u09BE \u099F\u09BE\u0995\u09BE \u09B2\u09BF\u0996\u09C1\u09A8\u0964");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "mainBalance"), {
        amount,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || ""
      }, { merge: true });
      showMessage($("mainBalanceMessage"), "Main Balance \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
      await loadDashboardStats();
    } catch (error) {
      console.error("Main balance save error:", error);
      showMessage($("mainBalanceMessage"), "Main Balance \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09A8\u09BF: " + (error.message || "Rules \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964"));
    }
  });
}
var diamondStockForm = $("diamondStockForm");
if (diamondStockForm) {
  diamondStockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    const quantity = Number($("diamondStockQuantity")?.value);
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      showMessage($("diamondStockMessage"), "\u09E6 \u09AC\u09BE \u09A4\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09AA\u09C2\u09B0\u09CD\u09A3\u09B8\u0982\u0996\u09CD\u09AF\u09BE Diamond Stock \u09A6\u09BF\u09A8\u0964");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "diamondStock"), {
        quantity,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || ""
      });
      showMessage($("diamondStockMessage"), "Diamond Stock \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
      await loadDashboardStats();
    } catch (error) {
      console.error("Stock save error:", error);
      showMessage($("diamondStockMessage"), "Stock \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09A8\u09BF\u0964 Firestore Rules \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964");
    }
  });
}
async function loadPaymentSettings() {
  if (!isAdmin) return;
  try {
    const result = await getDoc(doc(db, "settings", "paymentMethods"));
    const data = result.exists() ? result.data() : {};
    ["bkash", "nagad", "rocket"].forEach((method) => {
      const number = $(method + "Number");
      const enabled = $(method + "Enabled");
      if (number) number.value = data[method]?.number || "";
      if (enabled) enabled.checked = data[method]?.enabled !== false;
    });
  } catch (error) {
    console.error("Payment settings load:", error);
    showMessage($("paymentMessage"), "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09C7\u099F\u09BF\u0982\u09B8 \u09B2\u09CB\u09A1 \u09B9\u09DF\u09A8\u09BF\u0964");
  }
}
var paymentSettingsForm = $("paymentSettingsForm");
if (paymentSettingsForm) {
  paymentSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    const settings = {};
    ["bkash", "nagad", "rocket"].forEach((method) => {
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
      showMessage($("paymentMessage"), "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09A8\u09AE\u09CD\u09AC\u09B0 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
    } catch (error) {
      console.error("Payment save:", error);
      showMessage($("paymentMessage"), "\u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09A8\u09BF\u0964 Firestore Rules \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964");
    }
  });
}
async function loadAdminPackages() {
  const container = $("adminPackages");
  if (!container || !isAdmin) return;
  container.textContent = "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7...";
  try {
    const snapshot = await getDocs(collection(db, "packages"));
    container.replaceChildren();
    if (snapshot.empty) {
      container.textContent = "\u098F\u0996\u09A8\u09CB \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AF\u09CB\u0997 \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964";
      return;
    }
    snapshot.forEach((item) => {
      const data = item.data();
      const card = document.createElement("div");
      card.className = "order-card";
      const details = document.createElement("p");
      details.textContent = (data.name || "\u09A8\u09BE\u09AE \u09A8\u09C7\u0987") + " (" + (Number(data.diamondQuantity) || Number(String(data.name || "").match(/[0-9]+/)?.[0]) || "\u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09A8\u09C7\u0987") + " Diamond) - \u09F3" + (data.price ?? "\u09A8\u09C7\u0987");
      card.appendChild(details);
      card.appendChild(makeButton("Edit Name / Quantity / Price", async () => {
        const nextName = prompt("\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09C7\u09B0 \u09A8\u09A4\u09C1\u09A8 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u09C1\u09A8:", String(data.name || ""));
        if (nextName === null) return;
        const nextQuantity = Number(prompt("\u09A8\u09A4\u09C1\u09A8 Diamond Quantity \u09B2\u09BF\u0996\u09C1\u09A8:", String(Number(data.diamondQuantity) || Number(String(data.name || "").match(/[0-9]+/)?.[0]) || 0)));
        if (!Number.isSafeInteger(nextQuantity) || nextQuantity <= 0) return alert("\u09B8\u09A0\u09BF\u0995 \u09AA\u09C2\u09B0\u09CD\u09A3\u09B8\u0982\u0996\u09CD\u09AF\u09BE Diamond Quantity \u09A6\u09BF\u09A8\u0964");
        const nextPrice = Number(prompt("\u09A8\u09A4\u09C1\u09A8 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AE\u09C2\u09B2\u09CD\u09AF \u09B2\u09BF\u0996\u09C1\u09A8:", String(data.price ?? "")));
        if (!nextName.trim() || !Number.isFinite(nextPrice) || nextPrice <= 0) return alert("\u09B8\u09A0\u09BF\u0995 \u09A8\u09BE\u09AE \u0993 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AE\u09C2\u09B2\u09CD\u09AF \u09A6\u09BF\u09A8\u0964");
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
          alert("\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u0986\u09AA\u09A1\u09C7\u099F \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF: " + (error.message || "\u0985\u099C\u09BE\u09A8\u09BE \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE"));
        }
      }));
      card.appendChild(makeButton(data.active === false ? "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u099A\u09BE\u09B2\u09C1 \u0995\u09B0\u09C1\u09A8" : "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AC\u09A8\u09CD\u09A7 \u0995\u09B0\u09C1\u09A8", async () => {
        try {
          await updateDoc(doc(db, "packages", item.id), {
            active: data.active === false,
            updatedAt: serverTimestamp()
          });
          await loadAdminPackages();
        } catch (error) {
          console.error("Package status error:", error);
          alert("\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
        }
      }));
      card.appendChild(makeButton("Delete", async () => {
        if (!confirm("\u098F\u0987 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u099F\u09BF \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?")) return;
        try {
          await deleteDoc(doc(db, "packages", item.id));
          await loadAdminPackages();
        } catch (error) {
          console.error("Delete package error:", error);
          alert("\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
        }
      }));
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Packages error:", error);
    container.textContent = "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964";
  }
}
async function loadYellowDiamondPackages() {
  const container = $("yellowDiamondAdminSlots");
  if (!container || !isAdmin) return;
  try {
    const snapshot = await getDocs(collection(db, "yellowDiamondPackages"));
    const bySlot = /* @__PURE__ */ new Map();
    snapshot.forEach((item) => {
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
      heading.textContent = "Yellow Diamond \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C " + slot;
      const quantityLabel = document.createElement("label");
      quantityLabel.htmlFor = "yellowPackageDiamond" + slot;
      quantityLabel.textContent = "Diamond \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3";
      const quantity = document.createElement("input");
      quantity.id = "yellowPackageDiamond" + slot;
      quantity.type = "number";
      quantity.min = "1";
      quantity.step = "1";
      quantity.placeholder = "\u09AF\u09C7\u09AE\u09A8: 1000";
      quantity.value = Number(data.diamondQuantity) > 0 ? String(data.diamondQuantity) : "";
      const priceLabel = document.createElement("label");
      priceLabel.htmlFor = "yellowPackagePrice" + slot;
      priceLabel.textContent = "\u09AE\u09C2\u09B2\u09CD\u09AF (\u09F3)";
      const price = document.createElement("input");
      price.id = "yellowPackagePrice" + slot;
      price.type = "number";
      price.min = "1";
      price.step = "1";
      price.placeholder = "\u09AF\u09C7\u09AE\u09A8: 100";
      price.value = Number(data.price) > 0 ? String(data.price) : "";
      const activeLabel = document.createElement("label");
      const active = document.createElement("input");
      active.id = "yellowPackageActive" + slot;
      active.type = "checkbox";
      active.checked = data.active === true;
      activeLabel.append(active, document.createTextNode(" Agent App-\u098F \u099A\u09BE\u09B2\u09C1 \u09B0\u09BE\u0996\u09C1\u09A8"));
      card.append(heading, quantityLabel, quantity, priceLabel, price, activeLabel);
      container.appendChild(card);
    }
  } catch (error) {
    console.error("Yellow Diamond packages load:", error);
    showMessage($("yellowPackageMessage"), "Yellow Diamond \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09B2\u09CB\u09A1 \u09B9\u09DF\u09A8\u09BF\u0964 Firestore Rules \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964");
  }
}
var yellowPackageForm = $("yellowPackageForm");
if (yellowPackageForm) {
  yellowPackageForm.addEventListener("submit", async (event) => {
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
          throw new Error("\u099A\u09BE\u09B2\u09C1 \u0995\u09B0\u09BE \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09C7 \u09B8\u09A0\u09BF\u0995 Diamond \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u0993 \u09AE\u09C2\u09B2\u09CD\u09AF \u09A6\u09BF\u09A8\u0964");
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
      showMessage($("yellowPackageMessage"), "Yellow Diamond \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u0997\u09C1\u09B2\u09CB \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
      await loadYellowDiamondPackages();
    } catch (error) {
      console.error("Yellow Diamond package save:", error);
      showMessage($("yellowPackageMessage"), error.message || "Yellow Diamond \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09A8\u09BF\u0964");
    } finally {
      if (button) button.disabled = false;
    }
  });
}
var packageForm = $("packageForm");
if (packageForm) {
  packageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    const name3 = $("newPackageName")?.value.trim();
    const diamondQuantity = Number($("newPackageQuantity")?.value) || Number(String(name3 || "").match(/[0-9]+/)?.[0]) || 0;
    const price = Number($("newPackagePrice")?.value);
    const message = $("packageMessage");
    if (!name3 || !Number.isFinite(price) || price <= 0 || !Number.isFinite(diamondQuantity) || diamondQuantity <= 0) {
      showMessage(message, "\u09B8\u09A0\u09BF\u0995 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09C7\u09B0 \u09A8\u09BE\u09AE \u0993 \u09AE\u09C2\u09B2\u09CD\u09AF \u09A6\u09BF\u09A8\u0964");
      return;
    }
    try {
      await addDoc(collection(db, "packages"), {
        name: name3,
        diamondQuantity,
        price,
        active: true,
        createdAt: serverTimestamp()
      });
      packageForm.reset();
      showMessage(message, "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AF\u09CB\u0997 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
      await loadAdminPackages();
    } catch (error) {
      console.error("Add package error:", error);
      showMessage(message, "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u09AF\u09CB\u0997 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964");
    }
  });
}
$("orderSearch")?.addEventListener("input", loadAdminOrders);
$("orderStatusFilter")?.addEventListener("change", loadAdminOrders);
var year = $("year");
if (year) year.textContent = (/* @__PURE__ */ new Date()).getFullYear();
async function loadSupportContact() {
  if (!isAdmin) return;
  try {
    const snap = await getDoc(doc(db, "settings", "supportContact"));
    const data = snap.exists() ? snap.data() : {};
    const input = $("whatsappNumber");
    if (input) input.value = data.whatsappNumber || "";
  } catch (error) {
    console.error("Support contact load:", error);
    showMessage($("supportContactMessage"), "WhatsApp \u09B8\u09C7\u099F\u09BF\u0982\u09B8 \u09B2\u09CB\u09A1 \u09B9\u09DF\u09A8\u09BF\u0964");
  }
}
var supportContactForm = $("supportContactForm");
if (supportContactForm) {
  supportContactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    const whatsappNumber = $("whatsappNumber")?.value.trim() || "";
    if (!/^[+0-9() -]{8,20}$/.test(whatsappNumber)) {
      showMessage($("supportContactMessage"), "\u09B8\u09A0\u09BF\u0995 WhatsApp \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8\u0964");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "supportContact"), {
        whatsappNumber,
        updatedAt: serverTimestamp()
      });
      showMessage($("supportContactMessage"), "WhatsApp \u09A8\u09AE\u09CD\u09AC\u09B0 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09C7\u099B\u09C7\u0964", true);
    } catch (error) {
      console.error("Support contact save:", error);
      showMessage($("supportContactMessage"), "\u09A8\u09AE\u09CD\u09AC\u09B0 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09DF\u09A8\u09BF\u0964 Firestore Rules \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964");
    }
  });
}
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/component/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/logger/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-4NFEPWkC.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
