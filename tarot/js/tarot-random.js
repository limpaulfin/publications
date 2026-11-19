function waitImageLoad(img) {
    return new Promise(r => {
        if (img.complete && img.naturalWidth > 0) return r();
        img.addEventListener("load", r, { once: true });
        img.addEventListener("error", r, { once: true });
    });
}

async function revealPosition(pos, pool) {
    const row = document.querySelector(`.card-select[data-pos="${pos}"]`).closest(".position-row");
    const flicker = document.createElement("img");
    flicker.className = "card-img dice-flicker";
    row.appendChild(flicker);
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    const tog = document.querySelector(`.toggle-input[data-pos="${pos}"]`);
    const lblEl = document.querySelector(`.toggle-label[data-pos="${pos}"]`);
    const flickerInt = setInterval(() => {
        const c = FULL_DECK[Math.floor(Math.random() * FULL_DECK.length)];
        const f = cardToImageFile(c);
        if (f) flicker.src = `img/tarot/${f}`;
        const rev = Math.random() < 0.5;
        flicker.style.transform = rev ? "rotate(180deg)" : "none";
        tog.checked = rev;
        if (lblEl) lblEl.textContent = rev ? "Ngược" : "Thuận";
    }, 100);
    await new Promise(r => setTimeout(r, 2000));
    clearInterval(flickerInt);

    const card = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const reversed = Math.random() < 0.5;
    document.querySelector(`.card-select[data-pos="${pos}"]`).value = card;
    tog.checked = reversed;
    if (lblEl) lblEl.textContent = reversed ? "Ngược" : "Thuận";
    refreshAllSelects();
    updateCardImage(pos);

    const img = document.getElementById(`card-img-${pos}`);
    if (img) await waitImageLoad(img);
    flicker.remove();
    if (img) img.scrollIntoView({ behavior: "smooth", block: "center" });
    await new Promise(r => setTimeout(r, 1000));
}

async function randomDraw() {
    const btn = document.getElementById("random-btn");
    const icon = btn.querySelector("i");
    btn.disabled = true;
    icon.classList.add("rolling");

    document.querySelectorAll(".card-select").forEach(s => { s.value = ""; });
    document.querySelectorAll(".toggle-input").forEach(t => {
        t.checked = false;
        const lbl = document.querySelector(`.toggle-label[data-pos="${t.dataset.pos}"]`);
        if (lbl) lbl.textContent = "Thuận";
    });
    document.querySelectorAll(".card-img").forEach(i => { i.style.display = "none"; });
    document.querySelectorAll(".dice-spin, .dice-flicker").forEach(d => d.remove());
    refreshAllSelects();

    const pool = [...FULL_DECK];
    for (let pos = 1; pos <= 10; pos++) await revealPosition(pos, pool);

    saveCards();
    icon.classList.remove("rolling");
    btn.disabled = false;
    document.getElementById("generate-btn")?.scrollIntoView({ behavior: "smooth", block: "center" });
}
