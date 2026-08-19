/* Dad Tetris v1.3.4-vol-c10 */
"use strict";

let host = null;

export function bindSoundManager(nextHost) {
  host = nextHost || host;
  return soundManager;
}

function st() {
  return (host && host.settings) || {};
}

function def() {
  return (host && host.defaults) || {};
}

function landSfxCutoffHz(p) {
  const n = Number(p);
  const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 40;
  return Math.round(150 * Math.pow(2200 / 150, pct / 100));
}

function landSfxDecaySec(p) {
  const n = Number(p);
  const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 30;
  return 0.08 + (pct / 100) * 0.72;
}

export const soundManager = {
  moduleId: "audio",
  ctx: null,
  muted: false,
  bgm: null,
  bgmDucked: false,
  bgmDuckRatio: 0.1,
  bgmRampTimer: 0,
  ensure() {
    if (!host || host.gameTerminated) {
      return;
    }
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    } catch (err) {
      this.ctx = null;
    }
  },
  ensureGraph(options) {
    this.ensure();
    if (!this.ctx) {
      return false;
    }
    try {
      if (!this.sfxGain) {
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.ctx.destination);
      }
      if (!this.bgmGain) {
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.ctx.destination);
      }
      if (!this.timestopFilter) {
        this.timestopFilter = this.ctx.createBiquadFilter();
        this.timestopFilter.type = "lowpass";
        this.timestopFilter.frequency.value = 18000;
      }
      this.connectBgmGraph();
      if (!(options && options.skipGains)) {
        this.applyMasterGains();
      }
      return true;
    } catch (err) {
      return false;
    }
  },
  connectBgmGraph() {
    const audio = this.bgm && this.bgm.audio;
    if (!this.ctx || !audio || !this.bgmGain || !this.timestopFilter || this.bgmSource) {
      return;
    }
    try {
      this.bgmSource = this.ctx.createMediaElementSource(audio);
      this.bgmSource.connect(this.timestopFilter);
      this.timestopFilter.connect(this.bgmGain);
    } catch (err) {
      /* already connected or autoplay policy */
    }
  },
  applyMasterGains() {
    if (!host || typeof host.unit !== "function") {
      return;
    }
    const muted = !!this.muted;
    const sfxOn = !muted && !!st().sound;
    const bgmOn = !muted && !!st().bgm;
    const sfxV = sfxOn ? Math.max(0, Math.min(1, host.unit(st().soundVolume, def().soundVolume))) : 0;
    let bgmV = bgmOn ? Math.max(0, Math.min(1, host.unit(st().bgmVolume, def().bgmVolume))) : 0;
    if (bgmOn && this.bgmDucked) {
      bgmV *= Math.max(0, Math.min(1, Number(this.bgmDuckRatio) || 0.1));
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = sfxV;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.value = bgmV;
    }
  },
  getBgmVolumeSetting() {
    let pct = NaN;
    try {
      if (host && host.settings && host.settings.bgmVolume != null) {
        pct = Number(host.settings.bgmVolume);
      }
    } catch (err) {
      pct = NaN;
    }
    if (!Number.isFinite(pct)) {
      try {
        const saved = localStorage.getItem("dad_tetris_bgm_vol")
          || localStorage.getItem("bgmVolume")
          || String((def() && def().bgmVolume) || 70);
        pct = Number(saved);
      } catch (err) {
        pct = (def() && def().bgmVolume) || 70;
      }
    }
    if (!Number.isFinite(pct)) {
      pct = 70;
    }
    let unit = (host && typeof host.unit === "function")
      ? host.unit(pct, (def() && def().bgmVolume) || 70)
      : (pct > 1 ? pct / 100 : pct);
    unit = Math.max(0, Math.min(1, Number(unit) || 0));
    if (this.muted || st().bgm === false) {
      return 0;
    }
    try {
      const muteA = localStorage.getItem("dad_tetris_muted");
      const muteB = localStorage.getItem("dadTetrisMuted");
      if (muteA === "true" || muteA === "1" || muteB === "true" || muteB === "1") {
        return 0;
      }
    } catch (err) {
      /* ignore */
    }
    return unit;
  },
  rampBgmGain(targetVol, duration) {
    this.ensureGraph({ skipGains: true });
    const target = Math.max(0, Math.min(1, Number(targetVol) || 0));
    const dur = Math.max(0, Number(duration) || 0);
    const audio = (this.bgm && this.bgm.audio) || this.bgmAudioElement;
    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        const current = Number(this.bgmGain.gain.value);
        const from = Number.isFinite(current) ? current : target;
        this.bgmGain.gain.cancelScheduledValues(now);
        this.bgmGain.gain.setValueAtTime(from, now);
        if (dur <= 0) {
          this.bgmGain.gain.setValueAtTime(target, now);
        } else {
          this.bgmGain.gain.linearRampToValueAtTime(target, now + dur);
        }
      } catch (err) {
        try {
          this.bgmGain.gain.value = target;
        } catch (setErr) {
          /* ignore */
        }
      }
    }
    if (audio) {
      try {
        audio.volume = this.bgmSource ? 1 : target;
      } catch (volErr) {
        /* ignore */
      }
    }
    window.clearTimeout(this.bgmRampTimer);
    if (dur > 0) {
      this.bgmRampTimer = window.setTimeout(() => {
        if (this.bgmGain) {
          try {
            this.bgmGain.gain.value = this.bgmDucked
              ? this.getBgmVolumeSetting() * (Number(this.bgmDuckRatio) || 0.1)
              : this.getBgmVolumeSetting();
          } catch (snapErr) {
            /* ignore */
          }
        }
        if (audio && !this.bgmSource) {
          try {
            audio.volume = this.getBgmVolumeSetting() * (this.bgmDucked ? (Number(this.bgmDuckRatio) || 0.1) : 1);
          } catch (elErr) {
            /* ignore */
          }
        } else if (audio) {
          try {
            audio.volume = 1;
          } catch (elErr) {
            /* ignore */
          }
        }
      }, Math.round(dur * 1000) + 16);
    }
  },
  duckBgm(targetRatio, duration) {
    this.bgmDucked = true;
    this.bgmDuckRatio = Math.max(0, Math.min(1, Number(targetRatio)));
    if (!Number.isFinite(this.bgmDuckRatio)) {
      this.bgmDuckRatio = 0.1;
    }
    const currentVol = this.getBgmVolumeSetting();
    this.rampBgmGain(currentVol * this.bgmDuckRatio, duration == null ? 0.3 : duration);
  },
  restoreBgm(duration) {
    this.bgmDucked = false;
    const originalVol = this.getBgmVolumeSetting();
    this.rampBgmGain(originalVol, duration == null ? 0.3 : duration);
  },
  setSfxVolume(v) {
    const n = Number(v);
    const unit = Number.isFinite(n) ? Math.max(0, Math.min(1, n > 1 ? n / 100 : n)) : 0;
    if (host && host.settings) {
      host.settings.soundVolume = Math.round(unit * 100);
    }
    this.ensureGraph();
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.muted ? 0 : unit;
    }
    if (typeof this.applyMasterGains === "function" && !this.muted) {
      this.applyMasterGains();
      if (this.sfxGain && !this.muted) {
        this.sfxGain.gain.value = unit;
      }
    }
  },
  setBgmVolume(v) {
    const n = Number(v);
    const unit = Number.isFinite(n) ? Math.max(0, Math.min(1, n > 1 ? n / 100 : n)) : 0;
    if (host && host.settings) {
      host.settings.bgmVolume = Math.round(unit * 100);
    }
    this.ensureGraph();
    const ducked = this.bgmDucked ? Math.max(0, Math.min(1, Number(this.bgmDuckRatio) || 0.1)) : 1;
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.muted ? 0 : unit * ducked;
    }
    if (typeof this.applyMasterGains === "function" && !this.muted) {
      this.applyMasterGains();
      if (this.bgmGain && !this.muted) {
        this.bgmGain.gain.value = unit * ducked;
      }
    }
  },
  applyTimestopPitch(active) {
    this.ensureGraph();
    const on = !!active;
    this.timestopPitch = on ? 0.55 : 1;
    if (this.bgm && this.bgm.audio) {
      try {
        this.bgm.audio.preservesPitch = false;
        this.bgm.audio.playbackRate = this.timestopPitch;
      } catch (err) {
        /* playbackRate optional */
      }
    }
    if (this.timestopFilter) {
      this.timestopFilter.frequency.value = on ? 420 : 18000;
    }
    return this.timestopPitch;
  },
  scale(vol) {
    if (!host || typeof host.unit !== "function") {
      return 0;
    }
    return vol * host.unit(st().soundVolume, def().soundVolume);
  },
  play(kind, opts) {
    if (!host || host.gameTerminated || this.muted || host.celebrateOpen || !st().sound || st().soundVolume <= 0) {
      return;
    }
    try {
      this.ensure();
      if (!this.ctx) {
        return;
      }
      const pitch = Math.max(0.5, Number(opts && opts.pitch) || 1);
      this.lastPitch = pitch;
      if (kind === "move") {
        this.pop(430 * pitch, 0.05, 0.07);
      } else if (kind === "rotate") {
        this.pop(520 * pitch, 0.04, 0.06);
        this.pop(780 * pitch, 0.06, 0.05, 0.018);
      } else if (kind === "softdrop") {
        this.pop(340 * pitch, 0.028, 0.04);
      } else if (kind === "drop") {
        this.thud(pitch);
      } else if (kind === "clear") {
        this.burst(false, pitch);
      } else if (kind === "tetris") {
        this.burst(true, pitch);
      } else if (kind === "freeze") {
        this.freezeBend();
      } else if (kind === "fanfare") {
        this.fanfare();
      } else if (kind === "tick") {
        this.pop(880, 0.045, 0.09);
        this.pop(1240, 0.05, 0.055, 0.014);
      } else if (kind === "resume") {
        this.pop(620, 0.07, 0.1);
        this.pop(980, 0.09, 0.08, 0.028);
      }
    } catch (err) {
      /* autoplay policy / missing audio */
    }
  },
  playPitched(kind, pitch) {
    this.play(kind, { pitch });
  },
  freezeBend() {
    if (!this.ctx) {
      return;
    }
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(72, t + 0.42);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(280, t + 0.42);
    gain.gain.setValueAtTime(this.scale(0.16), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  },
  pop(freq, dur, vol, delay) {
    const t = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.55), t + dur);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, t);
    gain.gain.setValueAtTime(this.scale(vol), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  },
  thud(pitch) {
    const t = this.ctx.currentTime;
    const mul = Math.max(0.5, Number(pitch) || 1);
    const cutoff = landSfxCutoffHz(st().landSfxLowpass);
    const decay = landSfxDecaySec(st().landSfxDecay);
    const decayP = Number(st().landSfxDecay);
    const decayN = Number.isFinite(decayP) ? Math.max(0, Math.min(100, decayP)) : 30;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(64 * mul, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + Math.max(0.06, Math.min(0.26, decay * 0.85)));
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(this.scale(0.62), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.connect(filter);
    filter.connect(gain);
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.028 + (decayN / 100) * 0.05;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.12 + (decayN / 100) * 0.22;
    gain.connect(this.ctx.destination);
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + decay + 0.04);

    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    const clickDur = 0.06 + decay * 0.16;
    click.type = "triangle";
    click.frequency.setValueAtTime(150 * mul, t);
    click.frequency.exponentialRampToValueAtTime(46, t + Math.min(0.12, clickDur));
    clickGain.gain.setValueAtTime(this.scale(0.24), t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + clickDur);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start(t);
    click.stop(t + clickDur + 0.02);
  },
  burst(tetris, pitch) {
    const t = this.ctx.currentTime;
    const mul = Math.max(0.5, Number(pitch) || 1);
    const dur = tetris ? 0.38 : 0.22;
    const samples = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples, 1.4);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = mul;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(tetris ? 700 : 1100, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.scale(tetris ? 0.32 : 0.22), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);

    const notes = tetris ? [392, 523, 659, 784, 1046] : [523, 784, 1046];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const start = t + i * 0.038;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq * mul, start);
      g.gain.setValueAtTime(this.scale(tetris ? 0.12 : 0.1), start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  },
  fanfare() {
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.11;
      const hold = i === notes.length - 1 ? 0.58 : 0.22;
      osc.type = i === notes.length - 1 ? "triangle" : "square";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(this.scale(i === notes.length - 1 ? 0.2 : 0.14), start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + hold);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + hold + 0.04);
    });
  },
};

export function createSoundManager(nextHost) {
  bindSoundManager(nextHost);
  const sfx = soundManager;
  const bgm = {
    audio: new Audio(),
    fileName: "",
    fadeTimer: 0,
    fading: false,
    init() {
      this.audio.loop = true;
      this.audio.preload = "none";
      this.fileName = st().bgmFileName || "";
      this.audio.addEventListener("error", () => {
        host.isAudioLoading = false;
        this.stopFade();
        host.silenceAudioEl(this.audio);
        host.syncBgmUi();
      });
    },
    targetVolume() {
      if (!host || typeof host.unit !== "function") {
        return 0;
      }
      return host.unit(st().bgmVolume, def().bgmVolume);
    },
    applyVolume() {
      if (this.fading) {
        return;
      }
      if (sfx && typeof sfx.ensureGraph === "function") {
        sfx.ensureGraph();
      } else if (sfx && typeof sfx.applyMasterGains === "function") {
        sfx.applyMasterGains();
      }
      const unit = this.targetVolume();
      const ducked = sfx && sfx.bgmDucked
        ? unit * Math.max(0, Math.min(1, Number(sfx.bgmDuckRatio) || 0.1))
        : unit;
      if (sfx && sfx.bgmSource) {
        this.audio.volume = 1;
      } else {
        this.audio.volume = ducked;
      }
    },
    canPlay() {
      if (!host) {
        return false;
      }
      return !host.gameTerminated && st().bgm && !!this.audio.src && !host.paused && (!host.gameOver || host.autoplayConquered) && !host.celebrateOpen;
    },
    stopFade() {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = 0;
      this.fading = false;
    },
    fadeTo(target, ms, done) {
      this.stopFade();
      this.fading = true;
      const start = this.audio.volume;
      const t0 = performance.now();
      this.fadeTimer = window.setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
        this.audio.volume = start + (target - start) * p;
        if (p >= 1) {
          this.stopFade();
          if (done) {
            done();
          }
        }
      }, 30);
    },
    fadeOut() {
      sfx.muted = true;
      this.stopFade();
      if (sfx && typeof sfx.duckBgm === "function") {
        sfx.duckBgm(0.1, 0.3);
        return;
      }
      if (!this.audio.src || this.audio.paused) {
        return;
      }
      this.fadeTo(0, 280, () => {
        this.audio.pause();
      });
    },
    restoreAfterVideo(duration) {
      this.stopFade();
      sfx.muted = false;
      if (sfx && typeof sfx.restoreBgm === "function") {
        sfx.restoreBgm(duration == null ? 0.3 : duration);
        return;
      }
      this.applyVolume();
    },
    fadeIn() {
      if (!host) {
        return;
      }
      this.restoreAfterVideo(0.3);
      if (!this.canPlay()) {
        this.applyVolume();
        host.syncBgmUi();
        return;
      }
      if (this.audio.paused) {
        if (host.isAudioLoading) {
          return;
        }
        host.isAudioLoading = true;
        this.audio.play().catch(() => {
          try {
            this.audio.pause();
          } catch (err) {
            /* autoplay blocked */
          }
        }).finally(() => {
          host.isAudioLoading = false;
        });
      }
      host.syncBgmUi();
    },
    play() {
      if (!host) {
        return;
      }
      sfx.muted = false;
      this.stopFade();
      this.applyVolume();
      this.audio.loop = true;
      if (!this.canPlay()) {
        try {
          this.audio.pause();
        } catch (err) {
          /* ignore */
        }
        host.syncBgmUi();
        return;
      }
      if (host.isAudioLoading) {
        return;
      }
      host.isAudioLoading = true;
      this.audio.play().catch(() => {
        try {
          this.audio.pause();
        } catch (err) {
          /* ignore */
        }
      }).finally(() => {
        host.isAudioLoading = false;
      });
      host.syncBgmUi();
    },
    pause() {
      if (!host) {
        return;
      }
      this.stopFade();
      try {
        this.audio.pause();
      } catch (err) {
        /* ignore */
      }
      host.syncBgmUi();
    },
    setFile(file) {
      if (!host || !file) {
        return;
      }
      this.fileName = file.name;
      st().bgmFileName = file.name;
      host.mediaStore.put("bgm", file).then((ok) => {
        if (!ok) {
          try {
            console.error("[DadTetrisDB] BGM save failed");
          } catch (err) {
            /* ignore */
          }
        }
      }).catch((err) => {
        try {
          console.error("[DadTetrisDB] BGM save failed", err);
        } catch (ignore) {
          /* ignore */
        }
      });
      host.safeSetMediaSrc(this.audio, host.mediaStore.peek("bgm"));
      this.audio.loop = true;
      this.audio.currentTime = 0;
    },
  };
  soundManager.bgm = bgm;
  return { sfx, bgm, soundManager };
}
