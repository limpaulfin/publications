/* tarot-debug.js — Combo Debug (FP-015): (1) Tải JSON, (2) Gửi log debug, (3) DAR.
   This static deployment has no backend, so the bar ships one export button + DAR only; the export button SHARES the JSON file via the share sheet, it does not download (user rulings 2026-11-19).
   Export actions are gated by a numeric key (prompt, remembered per device). DAR toggles the DEO overlay (FP-002). */
const DEBUG_KEY = "1199";
window.__dbgErrors = window.__dbgErrors || [];

function dbgAskKey() {
    try { if (localStorage.getItem("tarotDbgUnlocked") === "1") return true; } catch (e) {}
    const k = prompt("Nhập mã số để xuất log debug:");
    if (k === null) return false;
    if (k.trim() !== DEBUG_KEY) { alert("Mã số không đúng."); return false; }
    try { localStorage.setItem("tarotDbgUnlocked", "1"); } catch (e) {}
    return true;
}

function dbgBundle() {
    const store = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.indexOf("tarot") === 0) store[key] = localStorage.getItem(key);
        }
    } catch (e) { /* storage unavailable */ }
    return {
        app: "Cau3Tarot (publications clone)",
        bundle_id: "dbg-" + Date.now().toString(36),
        exported_at: new Date().toISOString(),
        url: location.href,
        user_agent: navigator.userAgent,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        errors: window.__dbgErrors.slice(-50),
        local_storage: store,
        output_text: (document.getElementById("json-output") || {}).value || "",
        dom: document.documentElement.outerHTML
    };
}

function dbgFile(bundle) {
    return new File([JSON.stringify(bundle, null, 2)], bundle.bundle_id + ".json", { type: "application/json" });
}

function dbgDownload(bundle) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(dbgFile(bundle));
    a.download = bundle.bundle_id + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function shareDebugLog() {
    if (!dbgAskKey()) return;
    const bundle = dbgBundle();
    const file = dbgFile(bundle);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Log debug Tarot" }); }
        catch (e) { if (e && e.name !== "AbortError") dbgDownload(bundle); }
    } else {
        dbgDownload(bundle);
    }
    const el = document.getElementById("dbg-bundle-id");
    if (el) el.textContent = "Mã log: " + bundle.bundle_id;
}

/* ===== DAR = DEO overlay (FP-002, LANE_DOM) =====
   Every interactive/semantic leaf element gets a stable UUID in data-deo-id;
   the overlay paints a 6-char label above it + an orange anchor dot at its
   true top-left. Overlay never intercepts touches. State persists per device.
   Enabling via the button runs the green scan sweep first; disabling is
   instant and plays a two-tone peep. Load-restore is silent (no scan). */
const DEO_STORE_KEY = "tarot_deo_v1";
const DEO_SELECTOR = 'a[href],button,input,select,textarea,[role],[tabindex]:not([tabindex="-1"]),h1,h2,h3,h4,h5,h6,img,[data-deo]';
const DEO_MAX = 250;
const deoIds = new WeakMap();
let deoOn = false, deoRoot = null, deoTimer = null, deoObserver = null, deoScanning = false, deoRafPending = false;

function deoUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
}
function deoIdFor(el) {
    const seeded = el.getAttribute("data-deo-id");
    if (seeded) return seeded;
    let id = deoIds.get(el);
    if (!id) { id = deoUuid(); deoIds.set(el, id); }
    el.setAttribute("data-deo-id", id);
    return id;
}
function deoLabel6(id) { return id.replace(/-/g, "").slice(0, 6); }

function deoCollect() {
    const out = [];
    const cand = document.querySelectorAll(DEO_SELECTOR);
    for (const el of cand) {
        if (out.length >= DEO_MAX) break;
        if (deoRoot && deoRoot.contains(el)) continue;
        if (el.closest("[data-deo-scan]")) continue;
        if (el.checkVisibility && !el.checkVisibility()) continue;
        if (el.querySelector && el.querySelector(DEO_SELECTOR)) continue; /* leaf only */
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) continue;
        const cx = r.left + Math.min(r.width / 2, 24), cy = r.top + Math.min(r.height / 2, 12);
        const hit = document.elementFromPoint(cx, cy);
        if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) continue; /* occluded */
        out.push([el, r]);
    }
    return out;
}

function deoRender() {
    if (!deoRoot) return;
    deoRoot.textContent = "";
    for (const [el, r] of deoCollect()) {
        const id = deoIdFor(el);
        const dot = document.createElement("div");
        dot.className = "deo-dot";
        dot.style.left = r.left + "px";
        dot.style.top = r.top + "px";
        const label = document.createElement("div");
        label.className = "deo-label";
        label.textContent = deoLabel6(id);
        label.style.left = Math.max(2, Math.min(r.left, window.innerWidth - 44)) + "px";
        label.style.top = (r.top >= 14 ? r.top - 13 : r.bottom + 3) + "px";
        deoRoot.appendChild(dot);
        deoRoot.appendChild(label);
    }
}
function deoScheduleRender() {
    if (deoRafPending) return;
    deoRafPending = true;
    requestAnimationFrame(() => { deoRafPending = false; deoRender(); });
}
let deoDebounce = null;
function deoOnViewportChange() {
    if (deoDebounce) clearTimeout(deoDebounce);
    deoDebounce = setTimeout(deoScheduleRender, 150);
}

function deoStart() {
    deoRoot = document.createElement("div");
    deoRoot.id = "deo-overlay-root";
    document.body.appendChild(deoRoot);
    deoRender();
    deoTimer = setInterval(deoRender, 1000);
    window.addEventListener("scroll", deoOnViewportChange, { passive: true });
    window.addEventListener("resize", deoOnViewportChange);
    deoObserver = new MutationObserver(deoOnViewportChange);
    deoObserver.observe(document.body, { childList: true, subtree: true });
}
function deoStop() {
    if (deoTimer) { clearInterval(deoTimer); deoTimer = null; }
    window.removeEventListener("scroll", deoOnViewportChange);
    window.removeEventListener("resize", deoOnViewportChange);
    if (deoObserver) { deoObserver.disconnect(); deoObserver = null; }
    if (deoRoot) { deoRoot.remove(); deoRoot = null; }
    document.querySelectorAll("[data-deo-id]").forEach(el => el.removeAttribute("data-deo-id"));
}

function deoPeep() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square";
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime;
        o.frequency.setValueAtTime(880, t);
        o.frequency.setValueAtTime(620, t + 0.09);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.start(t); o.stop(t + 0.2);
        o.onended = () => { try { ctx.close(); } catch (e) {} };
    } catch (e) { /* audio is best-effort */ }
}

function deoRunScan() {
    return new Promise(resolve => {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { resolve(); return; }
        const host = document.createElement("div");
        host.setAttribute("data-deo-scan", "");
        host.style.cssText = "position:fixed;inset:0;z-index:2147483010;pointer-events:none;background:radial-gradient(ellipse at center, rgba(57,255,20,0.06) 0%, rgba(0,0,0,0.55) 75%)";
        const beam = document.createElement("div");
        beam.style.cssText = "position:absolute;left:0;right:0;top:0;height:90px;opacity:0;background:linear-gradient(to bottom, rgba(57,255,20,0) 0%, rgba(57,255,20,0.25) 55%, rgba(57,255,20,0.55) 92%, #39ff14 100%);box-shadow:0 0 24px 6px rgba(57,255,20,0.55), 0 0 60px 12px rgba(20,170,255,0.25)";
        host.appendChild(beam);
        document.body.appendChild(host);
        const anim = beam.animate([
            { transform: "translate3d(0,-120px,0)", opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.1 },
            { transform: "translate3d(0," + (window.innerHeight - 60) + "px,0)", opacity: 1, offset: 0.5 },
            { transform: "translate3d(0,-120px,0)", opacity: 1, offset: 0.95 },
            { transform: "translate3d(0,-120px,0)", opacity: 0, offset: 1 }
        ], { duration: 3150, easing: "ease-in-out" });
        /* Hacking SFX: same-origin file deo-scan-hack.mp3, started only once the
           beam animation is committed (+200ms lead); absent file => silent. */
        let sfxTimer = 0, sfxAudio = null;
        if (anim.ready) anim.ready.then(() => {
            sfxTimer = setTimeout(() => {
                try { sfxAudio = new Audio("deo-scan-hack.mp3"); const p = sfxAudio.play(); if (p) p.catch(() => {}); } catch (e) {}
            }, 200);
        }).catch(() => {});
        const cleanup = () => {
            clearTimeout(sfxTimer);
            if (sfxAudio) { try { sfxAudio.pause(); } catch (e) {} }
            host.remove();
        };
        anim.onfinish = () => { cleanup(); resolve(); };
        anim.oncancel = () => { cleanup(); resolve(); };
    });
}

function deoApply(on) {
    deoOn = on;
    const btn = document.getElementById("dbg-dar");
    if (btn) btn.classList.toggle("dar-on", deoOn);
    try { localStorage.setItem(DEO_STORE_KEY, deoOn ? "1" : "0"); } catch (e) {}
    if (deoOn) deoStart(); else deoStop();
}
async function toggleDAR() {
    if (deoScanning) return;
    if (!deoOn) {
        deoScanning = true;
        await deoRunScan();
        deoScanning = false;
        deoApply(true);
    } else {
        deoPeep();
        deoApply(false);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const d = document.getElementById("dbg-download");
    const s = document.getElementById("dbg-share");
    const r = document.getElementById("dbg-dar");
    if (d) d.addEventListener("click", shareDebugLog);
    if (s) s.addEventListener("click", shareDebugLog);
    if (r) r.addEventListener("click", toggleDAR);
    /* Silent load-restore of the DEO state (no scan, no sound). */
    let saved = null;
    try { saved = localStorage.getItem(DEO_STORE_KEY); } catch (e) {}
    if (saved === "1") deoApply(true);
});
