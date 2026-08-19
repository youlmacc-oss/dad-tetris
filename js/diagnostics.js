/* Dad Tetris v1.4.3-video-opt — C13–C15 core suite helpers.
   Live F9 runner is in script.js (CORE_DIAG_IDS C1–C15). */
"use strict";

export const CORE_DIAG_IDS = [
  "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12",
  "C13", "C14", "C15",
];

export async function diagBgInheritFallback(api) {
  const resolveLevelBg = api.resolveLevelBg;
  const getMediaBlob = api.getMediaBlob;
  const personal99 = getMediaBlob ? await getMediaBlob("custom_bg_board_level_99") : "";
  const resolved = resolveLevelBg ? await resolveLevelBg("board", 99) : "";
  return !personal99 && !!resolved;
}

export function diagBgStorageIsolation(api) {
  const { bgStoreKey, commonBgStoreKey, bgCandidateKeys, isOwnedBgStoreKey } = api;
  if (!bgStoreKey || !commonBgStoreKey) {
    return false;
  }
  const personal = bgStoreKey("window", 1);
  const common = commonBgStoreKey("window", 1);
  const keys = bgCandidateKeys ? bgCandidateKeys("window", 1) : [];
  const commonLeaked = keys.some((key) => /^common_bg_/.test(String(key || "")));
  const ownedCommon = isOwnedBgStoreKey
    ? isOwnedBgStoreKey("common_bg_window_default", "window")
    : false;
  return personal !== common
    && String(personal).indexOf("custom_bg_") === 0
    && String(common).indexOf("common_bg_") === 0
    && !commonLeaked
    && !ownedCommon;
}

export async function diagBgmRestoreInterlock(mgr, delay) {
  if (!mgr || typeof mgr.duckBgm !== "function" || typeof mgr.restoreBgm !== "function" || !mgr.bgmGain) {
    return false;
  }
  if (typeof mgr.ensureGraph === "function") {
    mgr.ensureGraph();
  }
  const original = typeof mgr.getBgmVolumeSetting === "function"
    ? mgr.getBgmVolumeSetting()
    : Number(mgr.bgmGain.gain.value);
  mgr.duckBgm(0.1, 0);
  if (delay) {
    await delay(40);
  }
  mgr.restoreBgm(0);
  if (delay) {
    await delay(40);
  }
  const restored = Number(mgr.bgmGain.gain.value);
  const want = original;
  return Math.abs(restored - want) <= 0.02;
}
