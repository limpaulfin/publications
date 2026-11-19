const DEBOUNCE_MS = 600, COOLDOWN_MS = 2000, MIN_QUERY = 2;
let selectedQuerent = JSON.parse(localStorage.getItem("tarot1_querent_obj") || "null");
let _suggestTimer = null, _inFlight = false, _lastFetch = 0, _hIdx = -1;

function initQuerentSuggest() {
    const inp = document.getElementById("querent-name");
    const wrapper = document.createElement("div"); wrapper.style.position = "relative";
    inp.parentNode.insertBefore(wrapper, inp); wrapper.appendChild(inp);
    const box = document.createElement("div"); box.id = "querent-suggest"; box.className = "suggest-dropdown"; wrapper.appendChild(box);
    inp.setAttribute("autocomplete", "off");
    inp.addEventListener("input", () => {
        clearTimeout(_suggestTimer); selectedQuerent = null; _saveSelectedQuerent(); _setIdBadge("");
        const q = inp.value.trim();
        if (q.length < MIN_QUERY) { box.innerHTML = ""; box.style.display = "none"; return; }
        _suggestTimer = setTimeout(() => _doSearch(q, box), DEBOUNCE_MS);
    });
    inp.addEventListener("keydown", (e) => {
        const items = box.querySelectorAll(".suggest-item");
        if (!items.length || box.style.display === "none") return;
        if (e.key === "ArrowDown") { e.preventDefault(); _hIdx = Math.min(_hIdx + 1, items.length - 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); _hIdx = Math.max(_hIdx - 1, 0); }
        else if (e.key === "Enter" && _hIdx >= 0) { e.preventDefault(); _pick(items[_hIdx]); return; }
        else return;
        items.forEach((el, i) => el.classList.toggle("active", i === _hIdx));
    });
    inp.addEventListener("blur", () => setTimeout(() => { box.style.display = "none"; }, 250));
    if (selectedQuerent?.id) { _setIdBadge(selectedQuerent.id); _loadHistory(selectedQuerent.id); }
    else { _restoreFromLegacy(inp.value.trim()); }
}

async function _doSearch(query, box) {
    if (_inFlight || Date.now() - _lastFetch < COOLDOWN_MS) return;
    _inFlight = true; _lastFetch = Date.now(); _showLoading(true);
    try {
        const r = await searchQuerents(query);
        if (!r.success || !r.data.length) { box.style.display = "none"; return; }
        _hIdx = -1;
        box.innerHTML = r.data.map(q =>
            `<div class="suggest-item" data-id="${q.id}" data-name="${q.name}" data-gender="${q.gender||""}" data-birth="${q.birth_year||""}">
            <strong>${q.name}</strong> <span>${q.gender||""} ${q.birth_year||""}</span></div>`
        ).join("");
        box.style.display = "block";
        box.querySelectorAll(".suggest-item").forEach(el => el.addEventListener("mousedown", () => _pick(el)));
    } finally { _inFlight = false; _showLoading(false); }
}

function _pick(el) {
    const inp = document.getElementById("querent-name"); inp.value = el.dataset.name;
    if (el.dataset.gender) document.getElementById("querent-gender").value = el.dataset.gender;
    if (el.dataset.birth) document.getElementById("querent-birth").value = el.dataset.birth;
    selectedQuerent = { id: el.dataset.id, name: el.dataset.name, gender: el.dataset.gender, birth_year: el.dataset.birth };
    document.getElementById("querent-suggest").style.display = "none";
    _setIdBadge(el.dataset.id); _saveSelectedQuerent();
    if (typeof saveQuerent === "function") saveQuerent();
    _loadHistory(el.dataset.id);
}

function _saveSelectedQuerent() { localStorage.setItem("tarot1_querent_obj", JSON.stringify(selectedQuerent)); }

async function _restoreFromLegacy(name) {
    if (!name || name.length < MIN_QUERY) return;
    _showLoading(true); try {
        const r = await searchQuerents(name);
        if (!r.success || !r.data.length) return;
        const match = r.data.find(q => q.name === name) || r.data[0];
        selectedQuerent = { id: match.id, name: match.name, gender: match.gender||"", birth_year: match.birth_year||"" };
        _setIdBadge(match.id); _saveSelectedQuerent(); _loadHistory(match.id);
    } catch {} finally { _showLoading(false); }
}

async function ensureQuerent() {
    const name = document.getElementById("querent-name").value.trim(), gender = document.getElementById("querent-gender").value, birth = document.getElementById("querent-birth").value.trim();
    if (!name) return null;
    if (selectedQuerent?.id) {
        const changed = selectedQuerent.name !== name || (selectedQuerent.gender||"") !== gender || (selectedQuerent.birth_year||"") !== birth;
        if (changed) { await apiUpdateQuerent(selectedQuerent.id, {name, gender, birth_year: birth}); selectedQuerent = {...selectedQuerent, name, gender, birth_year: birth}; _saveSelectedQuerent(); }
        return selectedQuerent.id;
    }
    const r = await apiCreateQuerent({name, gender, birth_year: birth});
    if (r.success) { selectedQuerent = {id: r.data.id, name, gender, birth_year: birth}; _setIdBadge(r.data.id); _saveSelectedQuerent(); return r.data.id; }
    return null;
}
