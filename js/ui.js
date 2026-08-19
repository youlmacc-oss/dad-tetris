/* Dad Tetris v1.4.3-video-opt */
"use strict";

import { dbManager, storageUtil, assertEventVideoFile, saveEventVideoBlob, deleteEventVideoBlob } from "./storage.js";
import { soundManager } from "./audio.js";
import { renderEngine, drawBlock, renderStaticBackground, renderGhostPreview, renderSkinPreview, applyForcedProfileCardLayout, purgeBoardWatermarks } from "./render.js";

let host = null;
let cheerKind = "idle";
let cheerResetTimer = 0;
let diagnosticsRunner = null;
let diagnosticsBusy = false;

function writeKeepDefaultBgNow(checked) {
  const val = checked ? "1" : "0";
  try {
    localStorage.setItem("dad_tetris_keep_default_bg", val);
    localStorage.setItem("keep_default_window_bg", val);
  } catch (err) {
    /* private mode */
  }
  if (window.gameSettings) {
    window.gameSettings.keepDefaultBg = checked ? 1 : 0;
    window.gameSettings.keepDefaultWindowBg = !!checked;
  }
  if (typeof window.syncSettings === "function") {
    try {
      window.syncSettings(window.gameSettings);
    } catch (syncErr) {
      /* live bundle still wrote LS */
    }
  }
  return val;
}

export function bindKeepDefaultBgToggle() {
  const keepDefaultEl = document.getElementById("keep-default-bg");
  if (keepDefaultEl && keepDefaultEl.dataset.keepBgBound !== "1") {
    keepDefaultEl.dataset.keepBgBound = "1";
    keepDefaultEl.addEventListener("change", (e) => {
      writeKeepDefaultBgNow(!!(e.target && e.target.checked));
    });
  }
  const aliasEl = document.getElementById("keep-default-bg-checkbox");
  if (aliasEl && aliasEl.dataset.keepBgBound !== "1") {
    aliasEl.dataset.keepBgBound = "1";
    aliasEl.addEventListener("change", (e) => {
      writeKeepDefaultBgNow(!!(e.target && e.target.checked));
    });
  }
}

export function bindBgTargetTabs() {
  document.querySelectorAll(".bg-target-btn").forEach((btn) => {
    if (!btn || btn.dataset.slotListBound === "1") {
      return;
    }
    btn.dataset.slotListBound = "1";
    btn.addEventListener("click", () => {
      const dest = btn.dataset.bgTarget === "board" ? "board" : "window";
      const setTarget = (host && typeof host.setCurrentBgTarget === "function")
        ? host.setCurrentBgTarget
        : window.setCurrentBgTarget;
      const render = (host && typeof host.renderBgSlotList === "function")
        ? host.renderBgSlotList
        : window.renderBgSlotList;
      const after = () => {
        if (typeof render === "function") {
          return render(dest);
        }
        return undefined;
      };
      try {
        if (typeof setTarget === "function") {
          return Promise.resolve(setTarget(dest)).then(after, after);
        }
      } catch (err) {
        /* fall through */
      }
      return after();
    });
  });
}

export function bindVolumeSliders() {
  const SETTINGS_KEY = "dadTetrisSettings";
  const clampPct = (val) => {
    const n = Number(val);
    if (!Number.isFinite(n)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(n)));
  };
  const mergeSettingsVol = (kind, n) => {
    try {
      let obj = {};
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        obj = raw ? JSON.parse(raw) : {};
      } catch (parseErr) {
        obj = {};
      }
      if (!obj || typeof obj !== "object") {
        obj = {};
      }
      if (kind === "bgm") {
        obj.bgmVolume = n;
      } else {
        obj.soundVolume = n;
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
    } catch (err) {
      /* private mode / diag shadow */
    }
    try {
      if (window.gameSettings) {
        if (kind === "bgm") {
          window.gameSettings.bgmVolume = n;
        } else {
          window.gameSettings.soundVolume = n;
        }
      }
    } catch (err) {
      /* ignore */
    }
  };

  const bgmSlider = document.getElementById("bgm-volume");
  if (bgmSlider && bgmSlider.dataset.uiVolSyncBound !== "1") {
    bgmSlider.dataset.uiVolSyncBound = "1";
    const syncBgm = (val) => {
      const n = clampPct(val);
      try {
        localStorage.setItem("dad_tetris_bgm_vol", String(n));
        localStorage.setItem("bgmVolume", String(n));
      } catch (err) { /* private mode / diag shadow */ }
      mergeSettingsVol("bgm", n);
      if (window.soundManager && typeof window.soundManager.setBgmVolume === "function") {
        window.soundManager.setBgmVolume(n / 100);
      }
    };
    bgmSlider.addEventListener("input", (e) => syncBgm(e.target.value));
    bgmSlider.addEventListener("change", (e) => syncBgm(e.target.value));
  }

  const sfxSlider = document.getElementById("sfx-volume") || document.getElementById("sound-volume");
  if (sfxSlider && sfxSlider.dataset.uiVolSyncBound !== "1") {
    sfxSlider.dataset.uiVolSyncBound = "1";
    const syncSfx = (val) => {
      const n = clampPct(val);
      try {
        localStorage.setItem("dad_tetris_sfx_vol", String(n));
        localStorage.setItem("sfxVolume", String(n));
      } catch (err) { /* private mode / diag shadow */ }
      mergeSettingsVol("sfx", n);
      if (window.soundManager && typeof window.soundManager.setSfxVolume === "function") {
        window.soundManager.setSfxVolume(n / 100);
      }
    };
    sfxSlider.addEventListener("input", (e) => syncSfx(e.target.value));
    sfxSlider.addEventListener("change", (e) => syncSfx(e.target.value));
  }
}

export function bindUiController(nextHost) {
  host = nextHost || host;
  if (host && typeof host.runVisualAutoTest === "function") {
    diagnosticsRunner = host.runVisualAutoTest;
  }
  bindBulkBgFilePicker();
  bindKeepDefaultBgToggle();
  bindBgTargetTabs();
  bindPlayerNicknameField();
  bindVolumeSliders();
  bindEventVideoSlots();
  return uiController;
}

export function bindEventVideoSlots() {
  if (typeof document === "undefined" || document.documentElement.dataset.eventVideoBound === "1") {
    return;
  }
  document.documentElement.dataset.eventVideoBound = "1";

  function warnEventVideo(file, check) {
    if (!check || check.ok) {
      return;
    }
    if (check.reason === "too_large") {
      const size = check.sizeMB || (file ? (file.size / (1024 * 1024)).toFixed(1) : "?");
      window.alert(`⚠️ [용량 초과] 영상 크기가 너무 큽니다 (${size}MB).\n게임의 원활한 작동을 위해 15MB 이하의 파일만 등록할 수 있습니다.`);
      return;
    }
    if (check.reason === "type") {
      window.alert("⚠️ 동영상 파일(MP4, WebM 등)만 업로드 가능합니다.");
    }
  }

  document.querySelectorAll("[data-video-file]").forEach((input) => {
    input.addEventListener("change", () => {
      const kind = input.dataset.videoFile;
      const file = input.files && input.files[0];
      const hostHandler = host && typeof host.handleEventVideoUpload === "function"
        ? host.handleEventVideoUpload
        : window.handleEventVideoUpload;
      const finish = () => {
        input.value = "";
      };
      if (!file) {
        finish();
        return;
      }
      if (typeof hostHandler === "function") {
        Promise.resolve(hostHandler(file, kind)).finally(finish);
        return;
      }
      const check = assertEventVideoFile(file);
      if (!check.ok) {
        warnEventVideo(file, check);
        finish();
        return;
      }
      Promise.resolve(saveEventVideoBlob(kind, file)).then((result) => {
        if (result && result.ok && host && typeof host.refreshVideoSlotUI === "function") {
          host.refreshVideoSlotUI(kind);
        }
      }).finally(finish);
    });
  });

  document.querySelectorAll("[data-delete-video]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.deleteVideo;
      const hostHandler = host && typeof host.deleteEventVideo === "function"
        ? host.deleteEventVideo
        : window.deleteEventVideo;
      if (typeof hostHandler === "function") {
        hostHandler(kind);
        return;
      }
      Promise.resolve(deleteEventVideoBlob(kind)).then(() => {
        if (host && typeof host.refreshVideoSlotUI === "function") {
          host.refreshVideoSlotUI(kind);
        }
      });
    });
  });
}

export function bindBulkBgFilePicker() {
  if (typeof document === "undefined" || document.documentElement.dataset.bulkBgDelegated === "1") {
    return;
  }
  document.documentElement.dataset.bulkBgDelegated = "1";
  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest && e.target.closest("#btn-bulk-select-files");
    if (!btn) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (btn.disabled) {
      return;
    }
    const input = document.getElementById("bulk-bg-file-input") || document.getElementById("input-bulk-bg");
    if (!input || input.disabled) {
      return;
    }
    try {
      input.value = "";
      if (typeof input.click === "function") {
        input.click();
      }
    } catch (err) {
      try {
        console.error("[bulk-bg] file picker", err);
      } catch (ignore) {
        /* ignore */
      }
    }
  }, true);
}

export function persistHostPlayerNickname(raw) {
  if (host && typeof host.persistPlayerNickname === "function") {
    return host.persistPlayerNickname(raw, { toast: true });
  }
  const name = String(raw == null ? "" : raw).trim().slice(0, 8) || "시스템";
  try {
    localStorage.setItem("dad_tetris_player_name", name);
  } catch (err) {
    try {
      console.error("[nickname] persist", err);
    } catch (ignore) {
      /* ignore */
    }
  }
  return name;
}

export function bindPlayerNicknameField() {
  const el = document.getElementById("input-player-nickname");
  if (!el || el.dataset.uiNickBound === "1") {
    return;
  }
  el.dataset.uiNickBound = "1";
  el.maxLength = 8;
  el.addEventListener("change", () => {
    persistHostPlayerNickname(el.value);
  });
}

export function updateAllBackgroundThumbnails() {
  if (host && typeof host.updateAllBackgroundThumbnails === "function") {
    return host.updateAllBackgroundThumbnails();
  }
  if (typeof window.updateAllBackgroundThumbnails === "function") {
    return window.updateAllBackgroundThumbnails();
  }
  return undefined;
}

export function applyBackgroundToCanvas(options) {
  if (host && typeof host.applyBackgroundToCanvas === "function") {
    return host.applyBackgroundToCanvas(options);
  }
  if (typeof window.applyBackgroundToCanvas === "function") {
    return window.applyBackgroundToCanvas(options);
  }
  return undefined;
}

export function getCheerKind() {
  return cheerKind;
}

function t(key, vars) {
  if (host && typeof host.t === "function") {
    return host.t(key, vars);
  }
  return key;
}

export function hapticTap(ms) {
  const settings = host && host.settings;
  if (!settings || !settings.haptic) {
    return;
  }
  try {
    const vibrate = navigator && navigator.vibrate;
    if (typeof vibrate !== "function") {
      return;
    }
    vibrate.call(navigator, Number.isFinite(ms) ? ms : 15);
  } catch (err) {
    /* unsupported, denied, or missing API */
  }
}

export function resetDadCheer() {
  window.clearTimeout(cheerResetTimer);
  cheerKind = "idle";
  const banner = document.getElementById("dad-cheer-banner");
  const textEl = document.getElementById("dad-cheer-text");
  const badge = document.getElementById("dad-cheer-badge");
  const tipEl = document.getElementById("dad-cheer-tip");
  if (textEl) {
    textEl.textContent = t("cheerDefault");
  }
  if (badge) {
    badge.textContent = t("cheerBadgeDad");
  }
  if (tipEl) {
    tipEl.textContent = t("cheerTipDefault");
  }
  if (banner) {
    banner.classList.remove("is-tetris", "is-combo", "is-freeze", "is-over", "is-bounce", "is-level");
  }
}

export function updateCheerMsg(kind, message, tip, options) {
  const force = !!(options && options.force);
  const diagOpen = !!(host && host.diagOpen);
  const diagRunning = !!(host && host.diagRunning);
  if (!force && (diagOpen || diagRunning)) {
    return false;
  }
  const banner = document.getElementById("dad-cheer-banner");
  const textEl = document.getElementById("dad-cheer-text");
  const badge = document.getElementById("dad-cheer-badge");
  const tipEl = document.getElementById("dad-cheer-tip");
  if (!banner || !textEl) {
    return false;
  }
  cheerKind = kind || "status";
  textEl.textContent = message;
  if (badge) {
    if (kind === "freeze") {
      badge.textContent = "⏳ DAD";
    } else if (kind === "level") {
      badge.textContent = t("cheerBadgeDad");
    } else {
      badge.textContent = t("cheerBadgeStatus");
    }
  }
  if (tipEl) {
    tipEl.textContent = tip || t("cheerTipDefault");
  }
  const animate = !(options && options.animate === false);
  if (animate) {
    banner.classList.remove("is-tetris", "is-combo", "is-freeze", "is-over", "is-bounce", "is-level");
    void banner.offsetWidth;
    if (kind === "tetris") {
      banner.classList.add("is-tetris");
    } else {
      banner.classList.add("is-bounce");
      if (kind === "combo") {
        banner.classList.add("is-combo");
      } else if (kind === "freeze") {
        banner.classList.add("is-freeze");
      } else if (kind === "over") {
        banner.classList.add("is-over");
      } else if (kind === "level") {
        banner.classList.add("is-level");
      }
    }
    window.clearTimeout(cheerResetTimer);
    cheerResetTimer = window.setTimeout(resetDadCheer, kind === "level" ? 4500 : 3000);
  }
  return true;
}

export function flashDadCheer(kind, message, tip) {
  return updateCheerMsg(kind, message, tip);
}

export function flashDadCheerForClear(cleared, extra) {
  const lineCombo = host && host.lineCombo != null ? host.lineCombo : 0;
  const tspin = !!(extra && extra.tspin);
  if (cleared >= 4) {
    flashDadCheer("tetris", t("cheerTetrisCrush"), t("cheerTipTetris"));
    return;
  }
  if (tspin) {
    flashDadCheer("combo", t("cheerTSpin"), t("cheerTipClear3"));
    return;
  }
  if (lineCombo >= 3) {
    flashDadCheer("combo", t("cheerUltraCombo"), t("cheerTipCombo", { combo: lineCombo }));
    return;
  }
  if (lineCombo >= 2) {
    flashDadCheer("combo", t("cheerCombo", { combo: lineCombo }), t("cheerTipCombo", { combo: lineCombo }));
    return;
  }
  if (cleared === 3) {
    flashDadCheer("clear", t("cheerClear3"), t("cheerTipClear3"));
  } else if (cleared === 2) {
    flashDadCheer("clear", t("cheerClear2"), t("cheerTipClear2"));
  } else if (cleared === 1) {
    flashDadCheer("clear", t("cheerClear1"), t("cheerTipClear1"));
  }
}

export function applyLanguage(langCode) {
  if (host && typeof host.applyLanguage === "function") {
    return host.applyLanguage(langCode);
  }
  if (typeof window.applyLanguage === "function") {
    return window.applyLanguage(langCode);
  }
  return langCode;
}

export function getTranslations() {
  if (typeof window === "undefined") {
    return {};
  }
  return window.TRANSLATIONS || (window.DAD_I18N && window.DAD_I18N.dict) || {};
}

export function formatDiagExportLog() {
  if (host && typeof host.formatDiagExportLog === "function") {
    return host.formatDiagExportLog();
  }
  if (typeof window.formatDiagExportLog === "function") {
    return window.formatDiagExportLog();
  }
  const log = document.getElementById("diag-log");
  return log ? String(log.textContent || "") : "";
}

export function copyDiagLog() {
  if (host && typeof host.copyDiagLog === "function") {
    return host.copyDiagLog();
  }
  if (typeof window.copyDiagLog === "function") {
    return window.copyDiagLog();
  }
  return Promise.resolve(false);
}

export function exportDiagLog() {
  if (host && typeof host.exportDiagLog === "function") {
    return host.exportDiagLog();
  }
  if (typeof window.exportDiagLog === "function") {
    return window.exportDiagLog();
  }
  return false;
}

export function setBoardIdlePanelHidden(hidden) {
  if (host && typeof host.setBoardIdlePanelHidden === "function") {
    return host.setBoardIdlePanelHidden(hidden);
  }
  if (typeof window.setBoardIdlePanelHidden === "function") {
    return window.setBoardIdlePanelHidden(hidden);
  }
  document.documentElement.classList.toggle("hide-board-idle", !!hidden);
  document.body.classList.toggle("hide-board-idle", !!hidden);
}

export function runDiagnostics() {
  if (diagnosticsBusy) {
    return Promise.resolve();
  }
  diagnosticsBusy = true;
  try {
    setBoardIdlePanelHidden(true);
  } catch (err) {
    /* ignore */
  }
  const finish = () => {
    diagnosticsBusy = false;
    try {
      setBoardIdlePanelHidden(false);
    } catch (err) {
      /* ignore */
    }
  };
  try {
    let result;
    if (typeof diagnosticsRunner === "function") {
      result = diagnosticsRunner();
    } else if (host && typeof host.runVisualAutoTest === "function") {
      result = host.runVisualAutoTest();
    } else {
      finish();
      return Promise.resolve();
    }
    if (result && typeof result.then === "function") {
      return result.then((value) => value, () => undefined).then((value) => {
        finish();
        return value;
      });
    }
    finish();
    return result;
  } catch (err) {
    finish();
    return Promise.resolve();
  }
}

export const CORE_DIAG_IDS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15"];
export const GUIDE_CHAPTER_TABS = ["controls", "skins", "board", "dad", "media", "bulk", "lang"];

export function coreDiagPassCount() {
  return CORE_DIAG_IDS.filter((id) => {
    const el = document.querySelector(`[data-diag-badge="${id}"]`);
    return !!(el && (el.classList.contains("is-pass") || el.classList.contains("is-fix")));
  }).length;
}

let hudLockUntil = 0;
let hudLockDepth = 0;

function withHudLock(fn) {
  if (typeof fn !== "function") {
    return function noop() {};
  }
  return function hudLocked() {
    if (hudLockDepth > 0) {
      return;
    }
    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    if (now < hudLockUntil) {
      return;
    }
    hudLockUntil = now + 50;
    hudLockDepth += 1;
    try {
      return fn.apply(this, arguments);
    } catch (err) {
      try {
        console.error("[DAD TETRIS] HUD action failed", err);
      } catch (ignore) {
        /* ignore */
      }
    } finally {
      hudLockDepth -= 1;
    }
  };
}

function callWindowFn(name) {
  try {
    const fn = window[name];
    if (typeof fn === "function") {
      return fn();
    }
  } catch (err) {
    try {
      console.error("[DAD TETRIS] window." + name, err);
    } catch (ignore) {
      /* ignore */
    }
  }
  return undefined;
}

export const HUD_CLICK_MAP = [
  { ids: ["game-start", "btn-start"], fn: "startGame" },
  { ids: ["game-end", "btn-end"], fn: "endGame" },
  { ids: ["settings-open", "btn-settings"], fn: "openSettingsModal" },
  { ids: ["settings-x", "settings-save", "settings-close"], fn: "closeSettingsModal" },
  { ids: ["settings-backdrop"], fn: "closeSettingsModal" },
  { ids: ["btn-guide", "guide-open"], fn: "openGuideModal" },
  { ids: ["guide-x", "guide-close", "guide-backdrop"], fn: "closeGuideModal" },
  { ids: ["btn-diagnostics", "btn-diag", "diag-open"], fn: "runDiagnostics" },
  { ids: ["autoplay-toggle"], fn: "toggleAutoPlay" },
  { ids: ["mobile-pad-toggle"], fn: "toggleMobilePad" },
  { ids: ["settings-reset"], fn: "resetAllSettings" },
];

export function exposeWindowUi(api) {
  const src = api || {};
  const w = window;
  const startGame = withHudLock(src.startGame);
  const endGame = withHudLock(src.endGame);
  const openSettingsModal = withHudLock(src.openSettingsModal);
  const closeSettingsModal = withHudLock(src.closeSettingsModal);
  const openGuideModal = withHudLock(src.openGuideModal);
  const closeGuideModal = withHudLock(src.closeGuideModal);
  const runDiagnosticsFn = withHudLock(src.runDiagnostics || src.openDiagModal);
  const toggleAutoPlay = withHudLock(src.toggleAutoPlay || src.toggleAutoplay);
  const toggleMobilePad = withHudLock(src.toggleMobilePad);
  const resetAllSettings = withHudLock(function guardedResetAllSettings() {
    if (document.body && document.body.classList.contains("diag-running")) {
      return;
    }
    if (typeof src.resetAllSettings === "function") {
      return src.resetAllSettings.apply(this, arguments);
    }
  });
  w.startGame = startGame;
  w.endGame = endGame;
  w.openSettingsModal = openSettingsModal;
  w.closeSettingsModal = closeSettingsModal;
  w.openGuideModal = openGuideModal;
  w.closeGuideModal = closeGuideModal;
  w.runDiagnostics = runDiagnosticsFn;
  w.openDiagModal = withHudLock(src.openDiagModal || src.runDiagnostics);
  w.toggleAutoPlay = toggleAutoPlay;
  w.toggleAutoplay = toggleAutoPlay;
  w.toggleMobilePad = toggleMobilePad;
  w.resetAllSettings = resetAllSettings;
  return {
    startGame,
    endGame,
    openSettingsModal,
    closeSettingsModal,
    openGuideModal,
    closeGuideModal,
    runDiagnostics: runDiagnosticsFn,
    toggleAutoPlay,
    toggleMobilePad,
    resetAllSettings,
  };
}

export function bindHudClickFallback() {
  HUD_CLICK_MAP.forEach((item) => {
    (item.ids || []).forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.dadHudFallback === "1") {
        return;
      }
      el.dataset.dadHudFallback = "1";
      el.addEventListener("click", (e) => {
        if (el.disabled) {
          return;
        }
        try {
          if (item.fn === "resetAllSettings" && document.body && document.body.classList.contains("diag-running")) {
            return;
          }
          if (e && typeof e.preventDefault === "function" && el.tagName === "BUTTON") {
            /* keep default button behaviour */
          }
          callWindowFn(item.fn);
        } catch (err) {
          try {
            console.error("[DAD TETRIS] click", id, err);
          } catch (ignore) {
            /* ignore */
          }
        }
      });
    });
  });
}

export function applyRankingShareMeta() {
  const notice = t("ranking_notice");
  const setMeta = (attr, key, value) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  try {
    setMeta("name", "description", notice);
    setMeta("property", "og:description", notice);
    setMeta("name", "twitter:description", notice);
  } catch (err) {
    /* ignore */
  }
  return notice;
}

export function drawRankShareCard(record) {
  const canvas = document.getElementById("rank-share-card");
  if (!canvas || typeof canvas.getContext !== "function") {
    return null;
  }
  canvas.width = 400;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const row = record || {};
  const name = String(row.name || t("dad") || "DAD").slice(0, 16);
  const score = Number.isFinite(Number(row.score)) ? Number(row.score) : 0;
  const level = Number.isFinite(Number(row.level)) ? Number(row.level) : 1;
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, 400, 500);
  ctx.fillStyle = "#7cf0ff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  const emblem = (row.board === "global")
    ? (t("rankCardGlobal") || "🌐 DAD TETRIS GLOBAL LEADERBOARD")
    : (t("rankCardKorea") || "🇰🇷 DAD TETRIS KOREA TOP RECORD");
  ctx.fillText(emblem, 200, 58);
  ctx.fillStyle = "#e8f6ff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(name, 200, 160);
  ctx.fillStyle = "#00d2ff";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText(String(score), 200, 230);
  ctx.fillStyle = "#9aa8b8";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Lv.${level}`, 200, 268);
  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = "#9aa8b8";
  ctx.font = "9px sans-serif";
  ctx.fillText(t("rankingShareWatermark"), 200, 478);
  ctx.restore();
  applyRankingShareMeta();
  return canvas;
}

export function applyMobileArcadeLayout() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  const on = window.matchMedia("(max-width: 768px)").matches;
  document.body.classList.toggle("is-mobile-arcade", on);
  if (!on) {
    document.body.classList.remove("is-mobile-arcade");
    document.body.classList.remove("is-mobile-board-lock");
  } else {
    document.body.classList.add("is-mobile-board-lock");
  }
  return on;
}

export function initMobileResize() {
  applyMobileArcadeLayout();
  if (typeof window !== "undefined" && typeof window.resizeCanvas === "function") {
    window.resizeCanvas();
  }
  return applyMobileArcadeLayout();
}

export function mobileTouchElementsOk() {
  if (typeof document === "undefined") {
    return false;
  }
  const ids = [
    "header-mini-menu", "settings-open", "btn-guide", "btn-diagnostics",
    "overlay", "overlay-hint",
    "mobile-controls", "btn-left", "btn-down", "btn-right",
    "btn-rotate", "btn-drop", "btn-hold", "btn-timestop",
    "stats-bar-row", "score", "level", "lines",
  ];
  return ids.every((id) => !!document.getElementById(id));
}

export const uiController = {
  moduleId: "ui",
  bind: bindUiController,
  updateCheerMsg,
  flashDadCheer,
  flashDadCheerForClear,
  resetDadCheer,
  getCheerKind,
  hapticTap,
  runDiagnostics,
  applyLanguage,
  applyRankingShareMeta,
  drawRankShareCard,
  setHallTab(kind) {
    if (host && typeof host.setHallTab === "function") {
      return host.setHallTab(kind);
    }
  },
  setBoardIdlePanelHidden,
  getTranslations,
  formatDiagExportLog,
  copyDiagLog,
  exportDiagLog,
  openSettings() {
    if (host && typeof host.openSettings === "function") {
      return host.openSettings();
    }
  },
  closeSettings() {
    if (host && typeof host.closeSettings === "function") {
      return host.closeSettings();
    }
  },
  exposeWindowUi,
  bindHudClickFallback,
  applyMobileArcadeLayout,
  initMobileResize,
  mobileTouchElementsOk,
  applyForcedProfileCardLayout,
  purgeBoardWatermarks,
  bindEventVideoSlots,
  verifyModules() {
    const storageOk = !!(dbManager && storageUtil && typeof dbManager.saveMediaFile === "function" && typeof storageUtil.get === "function");
    const audioOk = !!(soundManager && typeof soundManager.play === "function" && typeof soundManager.ensure === "function");
    const renderOk = !!(renderEngine && typeof drawBlock === "function" && typeof renderStaticBackground === "function" && typeof renderGhostPreview === "function" && typeof renderSkinPreview === "function");
    const uiOk = !!(uiController && typeof updateCheerMsg === "function" && typeof runDiagnostics === "function");
    const engineOk = !!(host && typeof host.GameEngine === "function");
    return { storageOk, audioOk, renderOk, uiOk, engineOk, ok: storageOk && audioOk && renderOk && uiOk && engineOk };
  },
};
