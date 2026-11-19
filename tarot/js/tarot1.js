function getSelectedCards() {
    const selected = {};
    document.querySelectorAll(".card-select").forEach(sel => {
        if (sel.value) selected[sel.dataset.pos] = sel.value;
    });
    return selected;
}

function refreshAllSelects() {
    const selected = getSelectedCards();
    document.querySelectorAll(".card-select").forEach(sel => {
        const currentVal = sel.value;
        const pos = sel.dataset.pos;
        sel.innerHTML = '<option value="">-- Chọn lá bài --</option>';
        FULL_DECK.forEach(card => {
            const usedByOther = Object.entries(selected)
                .some(([p, v]) => p !== pos && v === card);
            if (!usedByOther || card === currentVal) {
                const opt = document.createElement("option");
                opt.value = card;
                opt.textContent = card;
                if (card === currentVal) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    });
}

function renderCardPositions() {
    const container = document.getElementById("card-positions");
    container.innerHTML = POSITIONS.map(pos => `
        <div class="position-row">
            <div class="position-label">
                <span class="position-num">${pos.id}</span>
                <span class="position-name">${pos.pos_vi}: ${pos.name_vi}</span>
                <span class="position-desc">${pos.desc_vi}</span>
            </div>
            <div class="position-inputs">
                <select class="card-select" data-pos="${pos.id}">
                    <option value="">-- Chọn lá bài --</option>
                </select>
                <label class="toggle">
                    <input type="checkbox" class="toggle-input" data-pos="${pos.id}" />
                    <span class="toggle-slider"></span>
                    <span class="toggle-label" data-pos="${pos.id}">Thuận</span>
                </label>
            </div>
            <img id="card-img-${pos.id}" class="card-img" style="display:none;" alt="" />
        </div>
    `).join("");
    refreshAllSelects();
    container.addEventListener("change", e => {
        if (e.target.classList.contains("card-select")) {
            refreshAllSelects();
            updateCardImage(e.target.dataset.pos);
            saveCards();
        }
        if (e.target.classList.contains("toggle-input")) {
            const pos = e.target.dataset.pos;
            const label = container.querySelector(`.toggle-label[data-pos="${pos}"]`);
            label.textContent = e.target.checked ? "Ngược" : "Thuận";
            updateCardImage(pos);
            saveCards();
        }
    });
}

function renderBirthYearSelect() {
    const sel = document.getElementById("querent-birth");
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1940; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        sel.appendChild(opt);
    }
    sel.value = "2000";
}

function renderBirthDayMonthSelects() {
    const daySel = document.getElementById("querent-birth-day");
    const monthSel = document.getElementById("querent-birth-month");
    if (daySel) for (let d = 1; d <= 31; d++) {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        daySel.appendChild(opt);
    }
    if (monthSel) for (let m = 1; m <= 12; m++) {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        monthSel.appendChild(opt);
    }
}

/* Resource links (open in a new tab). Fill in the URLs here — a link stays
   hidden while its URL is empty. */
const TAROT_RESOURCES = {
    slides: "slides/tarot-intro-v0.2.0.pdf",
    video: ""
};

function initResourceLinks() {
    [["slides-link", TAROT_RESOURCES.slides], ["video-link", TAROT_RESOURCES.video]].forEach(([id, url]) => {
        const a = document.getElementById(id);
        if (!a) return;
        if (url) { a.href = url; a.classList.remove("is-pending"); }
        else { a.removeAttribute("href"); a.classList.add("is-pending"); a.title = "Link đang được cập nhật"; }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;
    renderBirthYearSelect();
    renderBirthDayMonthSelects();
    initResourceLinks();
    renderCardPositions();
    initCardPreview();
    loadQuerent();
    loadCards();
    initQuerentListeners();
    initQuerentSuggest();
    document.getElementById("generate-btn").addEventListener("click", () => generateJSON(POSITIONS));
    document.getElementById("copy-json-btn").addEventListener("click", copyJSON);
    document.getElementById("share-btn").addEventListener("click", shareSpreadFile);
    document.getElementById("download-spread-btn").addEventListener("click", downloadSpreadImage);
    document.getElementById("reset-btn").addEventListener("click", resetAll);
    document.getElementById("random-btn").addEventListener("click", randomDraw);
    document.getElementById("clear-cards-btn").addEventListener("click", clearCards);
    document.querySelectorAll('input[name="copy-format"]').forEach(r => r.addEventListener("change", renderOutputByFormat));
    document.getElementById("toggle-json").addEventListener("click", e => {
        if (e.target.closest("label, input")) return;
        const ta = document.getElementById("json-output"), show = ta.style.display === "none";
        ta.style.display = show ? "block" : "none";
        document.querySelector("#toggle-json i").className = show ? "fas fa-chevron-up" : "fas fa-chevron-down";
    });
});
