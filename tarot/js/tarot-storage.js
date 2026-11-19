const STORAGE_KEY = "tarot1_querent";
const STORAGE_CARDS_KEY = "tarot1_cards";

function saveQuerent() {
    const data = {
        name: document.getElementById("querent-name").value,
        gender: document.getElementById("querent-gender").value,
        birth: document.getElementById("querent-birth").value,
        birth_day: document.getElementById("querent-birth-day")?.value || "",
        birth_month: document.getElementById("querent-birth-month")?.value || "",
        topic: document.getElementById("question-select").value,
        detail: document.getElementById("custom-question").value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveCards() {
    const cards = {};
    document.querySelectorAll(".card-select").forEach(sel => {
        cards[sel.dataset.pos] = {
            card: sel.value,
            reversed: document.querySelector(`.toggle-input[data-pos="${sel.dataset.pos}"]`).checked
        };
    });
    localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(cards));
}

function loadQuerent() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.name) document.getElementById("querent-name").value = data.name;
    if (data.gender) document.getElementById("querent-gender").value = data.gender;
    if (data.birth) document.getElementById("querent-birth").value = data.birth;
    if (data.birth_day) document.getElementById("querent-birth-day").value = data.birth_day;
    if (data.birth_month) document.getElementById("querent-birth-month").value = data.birth_month;
    if (data.topic) document.getElementById("question-select").value = data.topic;
    if (data.detail) document.getElementById("custom-question").value = data.detail;
}

function loadCards() {
    const raw = localStorage.getItem(STORAGE_CARDS_KEY);
    if (!raw) return;
    const cards = JSON.parse(raw);
    for (const [pos, data] of Object.entries(cards)) {
        const sel = document.querySelector(`.card-select[data-pos="${pos}"]`);
        if (sel && data.card) sel.value = data.card;
        const tog = document.querySelector(`.toggle-input[data-pos="${pos}"]`);
        if (tog && data.reversed) {
            tog.checked = true;
            const label = document.querySelector(`.toggle-label[data-pos="${pos}"]`);
            if (label) label.textContent = "Ngược";
        }
    }
    refreshAllSelects();
    updateAllCardImages();
}

function clearCards() {
    localStorage.removeItem(STORAGE_CARDS_KEY);
    document.querySelectorAll(".card-select").forEach(s => { s.value = ""; });
    document.querySelectorAll(".toggle-input").forEach(t => { t.checked = false; });
    document.querySelectorAll(".toggle-label").forEach(l => { l.textContent = "Thuận"; });
    document.querySelectorAll(".card-img").forEach(i => { i.style.display = "none"; });
    document.querySelectorAll(".dice-spin, .dice-flicker").forEach(d => d.remove());
    document.getElementById("result-card").style.display = "none";
    const out = document.getElementById("json-output");
    if (out) { out.value = ""; delete out.dataset.rawJson; }
    refreshAllSelects();
}

function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_CARDS_KEY);
    document.getElementById("querent-name").value = "";
    document.getElementById("querent-gender").value = "Male";
    document.getElementById("querent-birth").value = "";
    document.getElementById("querent-birth-day").value = "";
    document.getElementById("querent-birth-month").value = "";
    document.getElementById("question-select").value = "Blind Reading";
    document.getElementById("custom-question").value = "";
    document.querySelectorAll(".card-select").forEach(s => { s.value = ""; });
    document.querySelectorAll(".toggle-input").forEach(t => { t.checked = false; });
    document.querySelectorAll(".toggle-label").forEach(l => { l.textContent = "Thuận"; });
    document.querySelectorAll(".card-img").forEach(i => { i.style.display = "none"; });
    document.getElementById("result-card").style.display = "none";
    refreshAllSelects();
    // Clear querent state (ID, badge, localStorage object)
    selectedQuerent = null;
    _saveSelectedQuerent();
    _setIdBadge("");
    // Clear history panels
    const hc = document.getElementById("querent-history");
    if (hc) { hc.innerHTML = ""; hc.style.display = "none"; }
    const hi = document.getElementById("history-inject");
    if (hi) { hi.innerHTML = ""; hi.style.display = "none"; }
}

function initQuerentListeners() {
    ["querent-name", "querent-gender", "querent-birth", "querent-birth-day", "querent-birth-month", "question-select", "custom-question"].forEach(id => {
        document.getElementById(id).addEventListener("change", saveQuerent);
    });
    document.getElementById("querent-name").addEventListener("input", saveQuerent);
    document.getElementById("custom-question").addEventListener("input", saveQuerent);
}
