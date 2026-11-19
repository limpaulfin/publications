function cardToImageFile(cardValue) {
    if (!cardValue) return null;
    if (cardValue.startsWith("Major")) {
        const num = cardValue.match(/Major - (\d+)/);
        if (num) return `major-${num[1].padStart(2, "0")}.jpg`;
    }
    const match = cardValue.match(/^(Wands|Cups|Swords|Pentacles) - (\d+|Page|Knight|Queen|King)/);
    if (match) {
        const suit = match[1].toLowerCase();
        const rank = match[2];
        const numMap = { Page: "11", Knight: "12", Queen: "13", King: "14" };
        const num = numMap[rank] || rank.padStart(2, "0");
        return `${suit}-${num}.jpg`;
    }
    return null;
}

function updateCardImage(pos) {
    const select = document.querySelector(`.card-select[data-pos="${pos}"]`);
    const imgEl = document.getElementById(`card-img-${pos}`);
    if (!imgEl) return;
    const file = cardToImageFile(select.value);
    if (file) {
        imgEl.src = `img/tarot/${file}`;
        imgEl.style.display = "block";
        const reversed = document.querySelector(`.toggle-input[data-pos="${pos}"]`).checked;
        if (String(pos) === "2") {
            imgEl.style.transform = reversed ? "rotate(-90deg)" : "rotate(90deg)";
        } else {
            imgEl.style.transform = reversed ? "rotate(180deg)" : "none";
        }
        imgEl.classList.toggle("reversed", reversed);
    } else {
        imgEl.style.display = "none";
        imgEl.src = "";
        imgEl.classList.remove("reversed");
    }
    flashRow(pos);
}

function flashRow(pos) {
    const row = document.querySelector(`.card-select[data-pos="${pos}"]`)?.closest(".position-row");
    if (!row) return;
    row.classList.remove("flash-out");
    row.classList.add("flash");
    setTimeout(() => { row.classList.remove("flash"); row.classList.add("flash-out"); }, 300);
    setTimeout(() => row.classList.remove("flash-out"), 2000);
}

function renderSpreadVisual() {
    const container = document.getElementById("spread-visual");
    if (!container) return;
    function makeSlot(pos) {
        const sel = document.querySelector(`.card-select[data-pos="${pos.id}"]`);
        const tog = document.querySelector(`.toggle-input[data-pos="${pos.id}"]`);
        const file = sel ? cardToImageFile(sel.value) : null;
        const rev = tog ? tog.checked : false;
        const style = rev && pos.id !== 2 ? 'transform:rotate(180deg)' : '';
        const img = file
            ? `<img src="img/tarot/${file}" class="${rev ? 'reversed' : ''}" style="${style}" />`
            : `<div style="width:60px;height:90px;background:#eee;border-radius:3px;display:inline-block;"></div>`;
        return `<div class="spread-slot slot-${pos.id}"><span class="slot-num">${pos.id}</span>${img}<div class="slot-label">${pos.name_vi || pos.name}</div></div>`;
    }
    const s = {};
    POSITIONS.forEach(pos => { s[pos.id] = makeSlot(pos); });
    container.innerHTML =
        s[5] + `<div class="slot-center-pair">${s[1]}${s[2]}</div>` +
        s[4] + s[6] + s[10] +
        s[3] + s[9] +
        s[8] + s[7];
}

/* Download the spread exactly as displayed: every card is drawn onto a
   canvas at its live on-screen position, size and rotation (measured from
   the DOM), so the PNG matches the layout below pixel for pixel. */
function downloadSpreadImage() {
    const container = document.getElementById("spread-visual");
    if (!container || !container.querySelector("img")) { alert("Chưa có trải bài để tải ảnh."); return; }
    const scale = 2;
    const cRect = container.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cRect.width * scale);
    canvas.height = Math.round(cRect.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    container.querySelectorAll("img").forEach(img => {
        if (!img.complete || !img.naturalWidth) return;
        const r = img.getBoundingClientRect();
        if (!r.width) return;
        const cs = getComputedStyle(img);
        let angle = 0;
        if (cs.transform && cs.transform !== "none") {
            const m = cs.transform.match(/matrix\(([^)]+)\)/);
            if (m) { const p = m[1].split(",").map(Number); angle = Math.atan2(p[1], p[0]); }
        }
        ctx.save();
        ctx.globalAlpha = parseFloat(cs.opacity || "1");
        if (img.classList.contains("reversed")) { ctx.shadowColor = "rgba(200,30,30,0.55)"; ctx.shadowBlur = 6; }
        ctx.translate(r.left - cRect.left + r.width / 2, r.top - cRect.top + r.height / 2);
        ctx.rotate(angle);
        const swapped = Math.abs(Math.abs(angle) - Math.PI / 2) < 0.01;
        const w = swapped ? r.height : r.width;
        const h = swapped ? r.width : r.height;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    });
    container.querySelectorAll(".slot-num").forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const cs = getComputedStyle(el);
        ctx.save();
        ctx.fillStyle = cs.backgroundColor;
        ctx.beginPath();
        ctx.arc(r.left - cRect.left + r.width / 2, r.top - cRect.top + r.height / 2, r.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cs.color;
        ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.textContent.trim(), r.left - cRect.left + r.width / 2, r.top - cRect.top + r.height / 2 + 0.5);
        ctx.restore();
    });
    container.querySelectorAll(".slot-label").forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const cs = getComputedStyle(el);
        ctx.save();
        ctx.fillStyle = cs.color;
        ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(el.textContent.trim(), r.left - cRect.left + r.width / 2, r.top - cRect.top, r.width);
        ctx.restore();
    });
    const date = new Date().toISOString().split("T")[0];
    const btn = document.getElementById("download-spread-btn");
    const original = btn ? btn.innerHTML : "";
    const done = () => { if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Đã chia sẻ!'; setTimeout(() => { btn.innerHTML = original; }, 2000); } };
    canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `celtic-cross-${date}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: "Trải bài Celtic Cross" }); done(); }
            catch (e) { /* user cancelled the share sheet */ }
        } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            done();
        }
    }, "image/png");
}

function updateAllCardImages() {
    document.querySelectorAll(".card-select").forEach(sel => {
        const pos = sel.dataset.pos;
        const imgEl = document.getElementById(`card-img-${pos}`);
        const file = cardToImageFile(sel.value);
        if (imgEl && file) {
            imgEl.src = `img/tarot/${file}`;
            imgEl.style.display = "block";
            const reversed = document.querySelector(`.toggle-input[data-pos="${pos}"]`).checked;
            if (pos === "2") {
                imgEl.style.transform = reversed ? "rotate(-90deg)" : "rotate(90deg)";
            } else {
                imgEl.style.transform = reversed ? "rotate(180deg)" : "none";
            }
            imgEl.classList.toggle("reversed", reversed);
        }
    });
}
