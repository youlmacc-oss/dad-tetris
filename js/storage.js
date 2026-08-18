/* Dad Tetris v1.1.0-stable */
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

  async function copyLegacyDb(newDb) {
    if (legacyCopied || !newDb) {
      return;
    }
    legacyCopied = true;
    let oldDb = null;
    try {
      oldDb = await openNamedDb(LEGACY_DB, 1, LEGACY_STORE);
      if (!oldDb) {
        return;
      }
      const entries = await readAllEntries(oldDb, LEGACY_STORE);
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry || !isFileBlob(entry.value)) {
          continue;
        }
        remember(entry.key, entry.value);
        try {
          const tx = newDb.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put(entry.value, entry.key);
        } catch (err) {
          logMediaError(err, entry.key, "legacy-copy");
        }
      }
    } catch (err) {
      logMediaError(err, LEGACY_DB, "legacy-copy");
    } finally {
      try {
        if (oldDb) {
          oldDb.close();
        }
      } catch (err) {
        /* ignore */
      }
    }
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
