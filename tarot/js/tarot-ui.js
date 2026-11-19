function getQuestion() {
    const sel = document.getElementById("question-select");
    const topic = sel.options[sel.selectedIndex]?.text || sel.value;
    const detail = document.getElementById("custom-question").value.trim();
    return { topic: topic, detail: detail || "" };
}

async function generateJSON(POSITIONS) {
    const missing = [];
    POSITIONS.forEach(pos => {
        if (!document.querySelector(`.card-select[data-pos="${pos.id}"]`).value) {
            missing.push(pos.id);
        }
    });
    if (missing.length > 0) {
        alert("Vui lòng chọn lá bài cho vị trí: " + missing.join(", "));
        return;
    }

    const name = document.getElementById("querent-name").value.trim();
    const gender = document.getElementById("querent-gender").value;
    const birth = document.getElementById("querent-birth").value.trim();
    const birthDay = document.getElementById("querent-birth-day")?.value || "";
    const birthMonth = document.getElementById("querent-birth-month")?.value || "";
    const question = getQuestion();

    const cards = POSITIONS.map(pos => {
        const cardVal = document.querySelector(`.card-select[data-pos="${pos.id}"]`).value;
        const reversed = document.querySelector(`.toggle-input[data-pos="${pos.id}"]`).checked;
        return {
            position: pos.id,
            layout: pos.layout,
            name: pos.name,
            description: pos.desc,
            card: cardVal,
            orientation: reversed ? "reversed" : "upright"
        };
    });

    let querent_id = null;
    try { querent_id = await ensureQuerent(); } catch { /* API down — continue offline */ }

    const history = getCheckedHistory();
    const pad2 = n => String(n).padStart(2, "0");
    const birthDate = (birth && birthMonth && birthDay) ? `${birth}-${pad2(birthMonth)}-${pad2(birthDay)}` : "";
    let age = "";
    if (birthDate) {
        const now = new Date(), bd = new Date(birthDate + "T00:00:00");
        age = now.getFullYear() - bd.getFullYear() - ((now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) ? 1 : 0);
    } else if (birth) {
        age = new Date().getFullYear() - parseInt(birth);
    }
    const result = {
        querent_id: querent_id,
        querent: { name: name || "", gender: gender, birth_year: birth || "", birth_month: birthMonth || "", birth_day: birthDay || "", birth_date: birthDate, age: age },
        question: question,
        spread: "Celtic Cross (10 cards)",
        date: new Date().toISOString().split("T")[0],
        cards: cards
    };
    if (history) result.historical_context = history;

    const output = document.getElementById("json-output");
    const resultCard = document.getElementById("result-card");
    output.dataset.rawJson = JSON.stringify(result, null, 2);
    renderOutputByFormat();
    resultCard.style.display = "block";
    renderSpreadVisual();
    saveSpread(result).then(r => { if (r.success) console.log("Saved:", r.id); }).catch(() => {});
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
}

function renderOutputByFormat() {
    const output = document.getElementById("json-output");
    const raw = output.dataset.rawJson || output.value || "";
    if (!raw) return;
    const fmt = document.querySelector('input[name="copy-format"]:checked')?.value || "base64";
    output.value = fmt === "base64" ? btoa(unescape(encodeURIComponent(raw))) : raw;
    output.style.height = "auto";
    output.style.height = output.scrollHeight + "px";
}

function copyJSON() {
    const output = document.getElementById("json-output");
    navigator.clipboard.writeText(output.value).then(() => {
        const btn = document.getElementById("copy-json-btn");
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Đã sao chép!';
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    });
}

/* Share the spread as a .txt FILE (not text): native share sheet with the
   file attached where supported (Android + iOS), download as fallback. */
async function shareSpreadFile() {
    const output = document.getElementById("json-output");
    const text = output.value || output.dataset.rawJson || "";
    if (!text) { alert("Hãy bấm Giải bài trước khi chia sẻ."); return; }
    const date = new Date().toISOString().split("T")[0];
    const file = new File([text], `celtic-cross-${date}.txt`, { type: "text/plain" });
    const btn = document.getElementById("share-btn");
    const original = btn.innerHTML;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: "Trải bài Celtic Cross" });
            btn.innerHTML = '<i class="fas fa-check"></i> Đã chia sẻ!';
        } catch { /* user cancelled the share sheet — not an error */ }
    } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        btn.innerHTML = '<i class="fas fa-check"></i> Đã tải file!';
    }
    setTimeout(() => { btn.innerHTML = original; }, 2000);
}
