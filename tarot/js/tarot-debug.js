/* tarot-debug.js — Combo Debug (FP-015): (1) Tải JSON, (2) Gửi log debug, (3) DAR.
   This static deployment has no backend, so the bar ships one export button + DAR only; the export button SHARES the JSON file via the share sheet, it does not download (user rulings 2026-11-19).
   Export actions are gated by a numeric key (prompt). DAR state is shown by colour only. */
const DEBUG_KEY = "1199";
window.__dbgErrors = window.__dbgErrors || [];
const DEO_SESSION_ID = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });

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
        deo_session_id: DEO_SESSION_ID,
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

/* DAR — DEO overlay toggle. State by colour alone (lit orange = on, dim grey = off). */
let darOn = false, darTimer = null;
function darRender() {
    const ov = document.getElementById("deo-overlay");
    if (!ov) return;
    let cards = [];
    try { cards = JSON.parse(localStorage.getItem("tarot1_cards") || "[]"); } catch (e) { cards = []; }
    const q = (document.getElementById("querent-name") || {}).value || "(trống)";
    ov.textContent =
        "DEO · " + DEO_SESSION_ID +
        " · " + new Date().toLocaleTimeString("vi-VN") +
        " · Người hỏi: " + q +
        " · Lá đã rút: " + (Array.isArray(cards) ? cards.length : 0) + "/10" +
        " · Lỗi ghi nhận: " + window.__dbgErrors.length;
}
function toggleDAR() {
    darOn = !darOn;
    const btn = document.getElementById("dbg-dar");
    const ov = document.getElementById("deo-overlay");
    if (btn) btn.classList.toggle("dar-on", darOn);
    if (ov) ov.style.display = darOn ? "block" : "none";
    if (darOn) { darRender(); darTimer = setInterval(darRender, 2000); }
    else if (darTimer) { clearInterval(darTimer); darTimer = null; }
}

document.addEventListener("DOMContentLoaded", () => {
    const d = document.getElementById("dbg-download");
    const s = document.getElementById("dbg-share");
    const r = document.getElementById("dbg-dar");
    if (d) d.addEventListener("click", shareDebugLog);
    if (s) s.addEventListener("click", shareDebugLog);
    if (r) r.addEventListener("click", toggleDAR);
});
