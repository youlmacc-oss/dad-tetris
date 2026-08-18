"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join("data", "leaderboard.json");
const SCORE_CAP = 9999999;
const MAX_STORE = 50;

function asRow(row, index) {
  if (!row || !Number.isFinite(Number(row.score))) {
    return null;
  }
  const score = Math.max(0, Math.min(SCORE_CAP, Math.round(Number(row.score))));
  if (score <= 0) {
    return null;
  }
  const countryCode = String(row.countryCode || "US").toUpperCase().slice(0, 2);
  const name = String(row.name || row.playerName || "시스템").trim().slice(0, 12) || "시스템";
  const date = String(row.date || "");
  const id = String(row.id || `${date}-${score}-${index}`);
  return {
    id,
    name,
    score,
    level: Math.max(1, Math.round(Number(row.level) || 1)),
    lines: Math.max(0, Math.round(Number(row.lines) || 0)),
    date,
    countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : "US",
  };
}

function fingerprint(row) {
  return `${row.name}|${row.score}|${row.level}|${String(row.date).slice(0, 16)}|${row.countryCode}`;
}

function mergeLists(lists) {
  const byId = new Map();
  const byFp = new Map();
  lists.flat().map(asRow).filter(Boolean).forEach((row) => {
    const fp = fingerprint(row);
    const prevFp = byFp.get(fp);
    if (prevFp && prevFp.id !== row.id) {
      return;
    }
    const prev = byId.get(row.id);
    if (!prev || row.score > prev.score || (row.score === prev.score && row.date > prev.date)) {
      byId.set(row.id, row);
      byFp.set(fp, row);
    }
  });
  return Array.from(byId.values())
    .sort((a, b) => b.score - a.score || b.level - a.level || String(b.date).localeCompare(String(a.date)))
    .slice(0, MAX_STORE);
}

function readBoard() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.records)) {
      return parsed.records;
    }
  } catch (err) {
    /* empty */
  }
  return [];
}

function incomingRows() {
  const extra = [];
  const rawPayload = process.env.RANK_PAYLOAD || "";
  if (rawPayload) {
    try {
      extra.push(JSON.parse(rawPayload));
    } catch (err) {
      /* ignore */
    }
  }
  const eventPath = process.env.GITHUB_EVENT_PATH || "";
  if (eventPath && fs.existsSync(eventPath)) {
    try {
      const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
      const payload = (event && event.client_payload) || (event && event.inputs) || {};
      if (payload.row) {
        extra.push(payload.row);
      }
      if (Array.isArray(payload.records)) {
        extra.push(...payload.records);
      }
      if (payload.payload) {
        const nested = typeof payload.payload === "string" ? JSON.parse(payload.payload) : payload.payload;
        if (nested && nested.row) {
          extra.push(nested.row);
        }
        if (nested && Array.isArray(nested.records)) {
          extra.push(...nested.records);
        }
      }
    } catch (err) {
      /* ignore */
    }
  }
  return extra.flatMap((item) => {
    if (Array.isArray(item)) {
      return item;
    }
    if (item && Array.isArray(item.records)) {
      return item.records;
    }
    return [item];
  });
}

const records = mergeLists([readBoard(), incomingRows()]);
const out = {
  v: 1,
  updatedAt: new Date().toISOString(),
  records,
};
fs.mkdirSync(path.dirname(FILE), { recursive: true });
fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n");
console.log("leaderboard records=" + records.length);
