/* tarot-querent-ui.js — UI helpers for querent: badge, loading, delete */

function _showLoading(show) {
    let el = document.getElementById("querent-loading");
    if (!el) { el = document.createElement("div"); el.id = "querent-loading"; el.className = "querent-loading"; el.innerHTML = '<div class="spinner"></div><span>Đang tải...</span>'; (document.getElementById("querent-id-badge")?.parentElement || document.getElementById("querent-name").parentElement).appendChild(el); }
    el.classList.toggle("active", show);
}

function _setIdBadge(id) {
    let b = document.getElementById("querent-id-badge");
    if (!b) { b = document.createElement("small"); b.id = "querent-id-badge"; b.style.cssText = "color:#999;font-size:11px;display:flex;align-items:center;gap:6px;margin-top:2px;"; document.getElementById("querent-name").parentElement.appendChild(b); }
    b.innerHTML = id ? `ID: ${id.slice(0,8)}... <span id="delete-querent-btn" style="color:#c33;cursor:pointer;font-size:13px" title="Xóa người hỏi">✕</span>` : "";
    const del = document.getElementById("delete-querent-btn"); if (del) del.onclick = _deleteQuerent;
}

async function _deleteQuerent() {
    if (!selectedQuerent?.id || !confirm("Xóa người hỏi + toàn bộ lịch sử trải bài? Không thể hoàn tác.")) return;
    await apiDeleteQuerentSpreads(selectedQuerent.id);
    const r = await apiDeleteQuerent(selectedQuerent.id);
    if (!r.success) { alert("Xóa thất bại"); return; }
    selectedQuerent = null; _saveSelectedQuerent(); _setIdBadge("");
    document.getElementById("querent-name").value = ""; document.getElementById("querent-gender").value = ""; document.getElementById("querent-birth").value = ""; document.getElementById("querent-birth-day").value = ""; document.getElementById("querent-birth-month").value = "";
    const hist = document.getElementById("querent-history"); if (hist) hist.innerHTML = "";
    if (typeof saveQuerent === "function") saveQuerent();
}
