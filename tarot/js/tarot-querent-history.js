async function _loadHistory(qid) {
    const r = await loadQuerentSpreads(qid), c = document.getElementById("querent-history");
    if (!c) return;
    if (!r.success || !r.data.length) { c.style.display = "none"; return; }
    c.innerHTML = `<h4>Lịch sử (${r.data.length})</h4>` + r.data.map(s => {
        const dt = new Date(s.created_at).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
        const json = JSON.stringify(s,null,2).replace(/</g,"&lt;");
        return `<div class="history-item"><span class="history-click" data-sid="${s.id}">${dt} — ${s.question?.topic||"?"}</span> <button class="del-spread" data-sid="${s.id}" title="Xóa">✕</button><pre class="history-json" id="hj-${s.id}" style="display:none">${json}</pre></div>`;
    }).join("");
    c.style.display = "block";
    c.querySelectorAll(".history-click").forEach(el => el.addEventListener("click", () => {
        const pre = document.getElementById("hj-" + el.dataset.sid);
        if (pre) pre.style.display = pre.style.display === "none" ? "block" : "none";
    }));
    c.querySelectorAll(".del-spread").forEach(btn => btn.addEventListener("click", async () => {
        if (!confirm("Xóa trải bài này?")) return;
        await apiDeleteSpread(btn.dataset.sid);
        btn.closest(".history-item").remove(); const n = c.querySelectorAll(".history-item").length;
        if (!n) c.style.display = "none"; else c.querySelector("h4").textContent = `Lịch sử (${n})`;
        _renderHistoryInject();
    }));
    _renderHistoryInject();
}

function _renderHistoryInject() {
    const src = document.querySelectorAll("#querent-history .history-item");
    const box = document.getElementById("history-inject");
    if (!box || !src.length) { if (box) box.style.display = "none"; return; }
    box.innerHTML = "<h4>Inject lịch sử vào JSON</h4>" + Array.from(src).map(el => {
        const sid = el.querySelector(".history-click")?.dataset.sid;
        const pre = document.getElementById("hj-" + sid);
        let ago = "", topic = "";
        if (pre) { try { const d = JSON.parse(pre.textContent); ago = _timeAgo(d.created_at); topic = d.question?.topic || "?"; } catch {} }
        return `<label><input type="checkbox" class="history-check" data-sid="${sid}"> ${ago} — ${topic}</label>`;
    }).join("<br>");
    box.style.display = "block";
    box.querySelectorAll(".history-check").forEach(cb => cb.addEventListener("change", _syncHistoryToJSON));
}

function _syncHistoryToJSON() {
    const output = document.getElementById("json-output");
    if (!output || !output.value) return;
    try {
        const obj = JSON.parse(output.value);
        const hist = getCheckedHistory();
        if (hist) obj.historical_context = hist; else delete obj.historical_context;
        output.value = JSON.stringify(obj, null, 2);
        output.style.height = "auto"; output.style.height = output.scrollHeight + "px";
    } catch {}
}

function _timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000), hrs = Math.floor(mins / 60), days = Math.floor(hrs / 24), months = Math.floor(days / 30);
    if (months > 0) return `${months} month${months>1?"s":""} ago`;
    if (days > 0) return `${days} day${days>1?"s":""} ago`;
    if (hrs > 0) return `${hrs} hour${hrs>1?"s":""} ago`;
    return `${mins} minute${mins>1?"s":""} ago`;
}

function getCheckedHistory() {
    const checks = document.querySelectorAll("#history-inject .history-check:checked");
    if (!checks.length) return null;
    const sessions = Array.from(checks).map(cb => {
        const pre = document.getElementById("hj-"+cb.dataset.sid);
        if (!pre) return null;
        const data = JSON.parse(pre.textContent);
        return {
            session_id: data.id || cb.dataset.sid,
            created_at: data.created_at,
            date: data.date || (data.created_at ? data.created_at.split("T")[0] : ""),
            question: data.question || {},
            spread: data.spread || "",
            cards: data.cards || [],
            time_ago: _timeAgo(data.created_at)
        };
    }).filter(Boolean);
    return {
        usage_policy: HISTORY_USAGE_POLICY,
        sessions: sessions,
        interpretation_policy: HISTORY_INTERPRETATION_POLICY
    };
}
