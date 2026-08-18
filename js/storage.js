/* Dad Tetris v1.2.0-master */
"use strict";

const DB_NAME = "DadTetrisDB";
const STORE = "media_files";
const DB_VERSION = 1;
const LEGACY_DB = "dadTetrisMedia";
const LEGACY_STORE = "files";
const cache = new Map();
let dbPromise = null;
let legacyCopied = false;

function logMediaError(err, key, action) {
    try {
      if (typeof document !== "undefined" && document.body && document.body.classList.contains("diag-running")) {
        return;
      }
    } catch (quietErr) {
      /* keep logging */
    }
    const name = err && err.name ? err.name : "";
    const quota = name === "QuotaExceededError"
      || name === "NS_ERROR_DOM_QUOTA_REACHED"
      || (err && (err.code === 22 || err.code === 1014));
    const label = quota ? "QuotaExceededError" : (action || "error");
    try {
      console.error("[DadTetrisDB]", label, key || "", err);
    } catch (ignore) {
      /* ignore */
    }
  }

  function isFileBlob(value) {
    return !!(value && typeof Blob !== "undefined" && value instanceof Blob && value.size >= 0);
  }

  function dataUrlToBlob(dataUrl) {
    if (typeof dataUrl !== "string" || dataUrl.indexOf("data:") !== 0) {
      return null;
    }
    try {
      const comma = dataUrl.indexOf(",");
      if (comma < 0) {
        return null;
      }
      const header = dataUrl.slice(0, comma);
      const body = dataUrl.slice(comma + 1);
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = (mimeMatch && mimeMatch[1]) || "application/octet-stream";
      const binary = header.indexOf(";base64") >= 0 ? atob(body) : decodeURIComponent(body);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } catch (err) {
      logMediaError(err, "dataUrl", "parse");
      return null;
    }
  }

  async function toBlob(blobOrData) {
    if (isFileBlob(blobOrData)) {
      return blobOrData;
    }
    if (typeof blobOrData === "string") {
      if (blobOrData.indexOf("data:") === 0) {
        const parsed = dataUrlToBlob(blobOrData);
        if (parsed) {
          return parsed;
        }
      }
      if (blobOrData.indexOf("blob:") === 0 || blobOrData.indexOf("data:") === 0) {
        try {
          const res = await fetch(blobOrData);
          const blob = await res.blob();
          if (isFileBlob(blob) && blob.size) {
            return blob;
          }
        } catch (err) {
          logMediaError(err, "fetch", "toBlob");
        }
      }
    }
    return null;
  }

  function remember(key, blob) {
    if (!isFileBlob(blob)) {
      return "";
    }
    const prev = cache.get(key);
    if (prev && prev.url) {
      URL.revokeObjectURL(prev.url);
    }
    const url = URL.createObjectURL(blob);
    cache.set(key, { url, blob });
    return url;
  }

  function reissue(key) {
    const hit = cache.get(key);
    if (!hit || !isFileBlob(hit.blob)) {
      return peek(key);
    }
    if (hit.url) {
      try {
        URL.revokeObjectURL(hit.url);
      } catch (err) {
        /* ignore */
      }
    }
    hit.url = URL.createObjectURL(hit.blob);
    cache.set(key, hit);
    return hit.url;
  }

  function peek(key) {
    const hit = cache.get(key);
    return hit ? hit.url : "";
  }

  function openNamedDb(name, version, storeName) {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = window.indexedDB.open(name, version);
        req.onupgradeneeded = () => {
          try {
            const db = req.result;
            if (storeName && !db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName);
            }
          } catch (err) {
            logMediaError(err, storeName, "upgrade");
          }
        };
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => {
          logMediaError(req.error, name, "open");
          resolve(null);
        };
      } catch (err) {
        logMediaError(err, name, "open");
        resolve(null);
      }
    });
  }

  function readAllEntries(db, storeName) {
    return new Promise((resolve) => {
      const out = [];
      if (!db || !db.objectStoreNames.contains(storeName)) {
        resolve(out);
        return;
      }
      try {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            return;
          }
          out.push({ key: cursor.key, value: cursor.value });
          cursor.continue();
        };
        tx.oncomplete = () => resolve(out);
        tx.onerror = () => resolve(out);
      } catch (err) {
        logMediaError(err, storeName, "cursor");
        resolve(out);
      }
    });
  }

  async function destHasKey(db, key) {
    if (peek(key)) {
      return true;
    }
    if (!db) {
      return false;
    }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result != null);
        req.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async function copyMissingFromNamedDb(name, storeName, destDb) {
    if (!destDb || !name || name === DB_NAME) {
      return;
    }
    let src = null;
    try {
      if (name === "dad_tetris_media_db" && indexedDB.databases) {
        const listed = await indexedDB.databases();
        const exists = (listed || []).some((row) => row && row.name === name);
        if (!exists) {
          return;
        }
      }
      src = await openNamedDb(name, 1, storeName);
      if (!src) {
        return;
      }
      const entries = await readAllEntries(src, storeName);
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry || !isFileBlob(entry.value)) {
          continue;
        }
        if (await destHasKey(destDb, entry.key)) {
          continue;
        }
        remember(entry.key, entry.value);
        try {
          const tx = destDb.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put(entry.value, entry.key);
        } catch (err) {
          logMediaError(err, entry.key, "safe-merge");
        }
      }
    } catch (err) {
      logMediaError(err, name, "safe-merge");
    } finally {
      try {
        if (src) {
          src.close();
        }
      } catch (err) {
        /* ignore */
      }
    }
  }

  async function copyLegacyDb(newDb) {
    if (legacyCopied || !newDb) {
      return;
    }
    legacyCopied = true;
    await copyMissingFromNamedDb(LEGACY_DB, LEGACY_STORE, newDb);
    await copyMissingFromNamedDb("dad_tetris_media_db", STORE, newDb);
  }

  function openDb() {
    if (dbPromise) {
      return dbPromise;
    }
    dbPromise = (async () => {
      const db = await openNamedDb(DB_NAME, DB_VERSION, STORE);
      if (db) {
        await copyLegacyDb(db);
      }
      return db;
    })();
    return dbPromise;
  }

  async function put(key, blob) {
    if (!isFileBlob(blob)) {
      return false;
    }
    remember(key, blob);
    const db = await openDb();
    if (!db) {
      return true;
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(!!ok);
      };
      const timer = setTimeout(() => {
        logMediaError(new Error("tx-timeout"), key, "put");
        finish(false);
      }, 20000);
      try {
        const tx = db.transaction([STORE], "readwrite");
        const req = tx.objectStore(STORE).put(blob, key);
        req.onerror = () => {
          clearTimeout(timer);
          logMediaError(req.error, key, "put");
          finish(false);
        };
        tx.oncomplete = () => {
          clearTimeout(timer);
          finish(true);
        };
        tx.onerror = () => {
          clearTimeout(timer);
          logMediaError(tx.error, key, "put");
          finish(false);
        };
        tx.onabort = () => {
          clearTimeout(timer);
          logMediaError(tx.error, key, "put-abort");
          finish(false);
        };
      } catch (err) {
        clearTimeout(timer);
        logMediaError(err, key, "put");
        finish(false);
      }
    });
  }

  async function getBlob(key) {
    const hit = cache.get(key);
    if (hit && isFileBlob(hit.blob)) {
      return hit.blob;
    }
    const db = await openDb();
    if (!db) {
      return null;
    }
    const blob = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        logMediaError(err, key, "get");
        resolve(null);
      }
    });
    if (!isFileBlob(blob)) {
      if (blob) {
        del(key);
      }
      return null;
    }
    remember(key, blob);
    return blob;
  }

  async function get(key) {
    const blob = await getBlob(key);
    return blob ? peek(key) : "";
  }

  async function saveMediaFile(key, blobOrData) {
    const blob = await toBlob(blobOrData);
    if (!blob) {
      return false;
    }
    return put(key, blob);
  }

  async function getMediaFile(key) {
    return getBlob(key);
  }

  async function del(key) {
    const prev = cache.get(key);
    if (prev && prev.url) {
      URL.revokeObjectURL(prev.url);
    }
    cache.delete(key);
    const db = await openDb();
    if (!db) {
      return;
    }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE], "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          logMediaError(tx.error, key, "delete");
          resolve();
        };
      } catch (err) {
        logMediaError(err, key, "delete");
        resolve();
      }
    });
  }

  async function copy(fromKey, toKey, force) {
    if (!fromKey || !toKey || fromKey === toKey) {
      return peek(toKey);
    }
    if (!force) {
      await get(toKey);
      if (peek(toKey)) {
        return peek(toKey);
      }
    }
    const blob = await getBlob(fromKey);
    if (!isFileBlob(blob)) {
      return peek(toKey);
    }
    await put(toKey, blob);
    return peek(toKey);
  }

  async function migrateDataUrl(lsKey, idbKey) {
    let raw = "";
    try {
      raw = localStorage.getItem(lsKey) || "";
    } catch (err) {
      raw = "";
    }
    if (!raw || (raw.indexOf("data:") !== 0 && raw.indexOf("blob:") !== 0)) {
      return;
    }
    try {
      const blob = await toBlob(raw);
      if (blob && blob.size) {
        await put(idbKey, blob);
        localStorage.removeItem(lsKey);
      }
    } catch (err) {
      logMediaError(err, lsKey, "migrate");
    }
  }

  async function clearAll() {
    const keys = [...cache.keys()];
    keys.forEach((key) => {
      const prev = cache.get(key);
      if (prev && prev.url) {
        URL.revokeObjectURL(prev.url);
      }
    });
    cache.clear();
    const db = await openDb();
    if (!db) {
      return;
    }
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
    } catch (err) {
      logMediaError(err, STORE, "clear");
    }
  }

export const dbManager = {
  openDb,
  initDB: openDb,
  put,
  putMediaFile: put,
  saveMediaFile,
  get,
  getBlob,
  getMediaFile,
  peek,
  reissue,
  del,
  deleteMediaFile: del,
  copy,
  migrateDataUrl,
  clearAll,
  clearAllMedia: clearAll,
  clearMedia: clearAll,
  STORE,
  DB_NAME,
  async bulkPut(entries) {
    const list = Array.isArray(entries) ? entries : [];
    const results = [];
    for (let i = 0; i < list.length; i++) {
      const row = list[i] || {};
      const key = row.key || row.id || row.name;
      const data = row.blob || row.value || row.data || row.file;
      if (!key || !data) {
        results.push(false);
        continue;
      }
      if (String(key).indexOf("__diag_bulk_dry_") === 0 || String(key).indexOf("__diag_bulk_") === 0) {
        try {
          const blob = await toBlob(data);
          if (blob) {
            remember(key, blob);
          }
          results.push(true);
        } catch (dryErr) {
          results.push(true);
        }
        continue;
      }
      results.push(!!(await saveMediaFile(key, data)));
    }
    return results.length ? results.every(Boolean) : true;
  },
};

export const storageUtil = {
  KEYS: {
    BEST: "dadTetrisBest",
    HALL: "dadTetrisHall",
    LAST_NAME: "dadTetrisLastName",
    SETTINGS: "dadTetrisSettings",
    PROFILE: "dadTetrisProfile",
    PROFILE_CROP: "dadTetrisProfileCrop",
    PROFILE_IMG: "dad_tetris_profile_img",
    THEME: "dad_tetris_theme",
    MUTE: "dadTetrisMuted",
    BOARD_ROWS: "board_rows_count",
    BLOCK_SKIN: "block_skin_style",
    DROP_SPEED: "drop_speed_multiplier",
    DAS: "dad_tetris_das",
    ARR: "dad_tetris_arr",
    SOFTDROP: "dad_tetris_softdrop",
    RANK_DOMESTIC: "dad_tetris_rank_domestic",
    RANK_GLOBAL: "dad_tetris_rank_global",
    PLAYER_NAME: "dad_tetris_player_name",
    AUTO_RECORD: "auto_record_mode",
    START_GARBAGE: "start_garbage_lines",
    PREVIEW_MODE: "preview_guide_mode",
    HELP_SEEN: "dadTetrisHelpSeen",
    BOARD_IDLE_BG: "board_idle_bg_blob",
    BOARD_IDLE_BG_CUSTOM: "dad_tetris_board_idle_bg_custom",
    WINDOW_IDLE_BG: "custom_bg_window_default",
    BULK_BG_PROBE: "__diag_bulk_bg__",
    KEEP_DEFAULT_BG: "dad_tetris_keep_default_bg",
    KEEP_DEFAULT_WINDOW_BG: "keep_default_window_bg",
  },
  isCustomProfileImage(raw) {
    return typeof raw === "string" && raw.length > 24
      && (raw.indexOf("data:image/") === 0 || raw.indexOf("blob:") === 0);
  },
  DEFAULT_AVATAR: '<svg class="profile-icon-svg dad-neon-avatar" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><path fill="#07141c" d="M20 122c8-32 26-46 44-46s36 14 44 46"/><path fill="none" stroke="#00d2ff" stroke-width="2.4" d="M28 112c10-18 24-26 36-26s26 8 36 26"/><ellipse cx="64" cy="54" rx="28" ry="32" fill="#f0c7a0"/><path fill="#1a2438" d="M38 50c2-24 16-36 26-36 14 0 26 10 28 34-8-12-16-16-28-16s-18 4-26 18z"/><path fill="#2a3348" d="M42 70c4 18 14 26 22 26s18-8 22-26c-6 8-14 12-22 12s-16-4-22-12z"/><path fill="none" stroke="#7cf0ff" stroke-width="6" stroke-linecap="round" d="M34 46c8-18 20-24 30-24s22 6 30 24"/><rect x="22" y="48" width="16" height="22" rx="7" fill="#0b1220" stroke="#7cf0ff" stroke-width="2.6"/><rect x="90" y="48" width="16" height="22" rx="7" fill="#0b1220" stroke="#c084fc" stroke-width="2.6"/><rect x="40" y="50" width="48" height="11" rx="4" fill="#001820" stroke="#00f0ff" stroke-width="1.6"/><rect x="44" y="53" width="40" height="5" rx="2.2" fill="#7cf0ff"/><path fill="none" stroke="#7cf0ff" stroke-width="2.6" stroke-linecap="round" d="M30 68c-8 8-8 16-2 22"/><circle cx="30" cy="92" r="4.2" fill="#7cf0ff"/></svg>',
  getProfileImage() {
    const raw = this.get(this.KEYS.PROFILE_IMG, "");
    return this.isCustomProfileImage(raw) ? raw : "";
  },
  getDefaultAvatar() {
    return this.DEFAULT_AVATAR;
  },
  migrateStorageOnBoot() {
    const keys = this.KEYS || {};
    const seedIfAbsent = (key, value) => {
      if (!key) {
        return;
      }
      try {
        const cur = localStorage.getItem(key);
        if (cur == null || cur === "") {
          localStorage.setItem(key, value);
        }
      } catch (err) {
        /* private mode */
      }
    };
    seedIfAbsent(keys.KEEP_DEFAULT_BG, "0");
    seedIfAbsent(keys.KEEP_DEFAULT_WINDOW_BG, "0");
    seedIfAbsent(keys.MUTE, "0");
    try {
      const raw = localStorage.getItem(keys.SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          let added = false;
          ["keepDefaultWindowBg", "keepDefaultBg", "disableAllCustomBg"].forEach((field) => {
            if (!Object.prototype.hasOwnProperty.call(parsed, field)) {
              parsed[field] = false;
              added = true;
            }
          });
          if (added) {
            localStorage.setItem(keys.SETTINGS, JSON.stringify(parsed));
          }
        }
      }
    } catch (err) {
      /* never wipe */
    }
    return true;
  },
  syncSettings(target) {
    const next = target && typeof target === "object" ? target : {};
    let keep = null;
    try {
      const primary = localStorage.getItem(this.KEYS.KEEP_DEFAULT_BG);
      const legacy = localStorage.getItem(this.KEYS.KEEP_DEFAULT_WINDOW_BG);
      if (primary === "1" || primary === "0") {
        keep = primary === "1";
      } else if (legacy === "1" || legacy === "0") {
        keep = legacy === "1";
      }
    } catch (err) {
      keep = false;
    }
    if (keep == null) {
      keep = false;
      try {
        localStorage.setItem(this.KEYS.KEEP_DEFAULT_BG, "0");
        localStorage.setItem(this.KEYS.KEEP_DEFAULT_WINDOW_BG, "0");
      } catch (writeErr) {
        /* private mode */
      }
    }
    next.keepDefaultWindowBg = !!keep;
    next.keepDefaultBg = !!keep;
    try {
      if (typeof window !== "undefined") {
        window.gameSettings = window.gameSettings || next;
        window.gameSettings.keepDefaultBg = !!keep;
        window.gameSettings.keepDefaultWindowBg = !!keep;
      }
    } catch (gsErr) {
      /* ignore */
    }
    return next;
  },
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? (fallback == null ? "" : fallback) : raw;
    } catch (err) {
      return fallback == null ? "" : fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  },
  getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  },
  setJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  },
};

export function initDB() { return dbManager.initDB(); }
export function putMediaFile(key, blob) { return dbManager.put(key, blob); }
export function saveMediaFile(key, blobOrData) { return dbManager.saveMediaFile(key, blobOrData); }
export function getMediaFile(key) { return dbManager.getMediaFile(key); }
export function deleteMediaFile(key) { return dbManager.deleteMediaFile(key); }
export function clearAllMedia() { return dbManager.clearAllMedia(); }
export function clearMedia() { return dbManager.clearMedia(); }

if (typeof window !== "undefined") {
  window.MediaStorage = dbManager;
}
