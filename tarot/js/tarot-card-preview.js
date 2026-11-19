/* tarot-card-preview.js — Click slot number to full-screen card preview */
const PREVIEW_MS = 3000;
let _previewTimer = null;

function initCardPreview() {
    const grid = document.getElementById("spread-visual"); if (!grid) return;
    grid.addEventListener("click", (e) => {
        const slot = e.target.closest(".spread-slot"); if (!slot) return;
        _showPreview(slot);
    });
}

function _showPreview(slot) {
    const img = slot?.querySelector("img"); if (!img?.src) return;
    let ov = document.getElementById("card-preview-overlay");
    if (!ov) {
        ov = document.createElement("div"); ov.id = "card-preview-overlay"; ov.className = "card-preview-overlay";
        ov.innerHTML = '<img class="card-preview-img" />'; document.body.appendChild(ov);
        ov.addEventListener("click", () => _hidePreview());
    }
    const pImg = ov.querySelector("img"); pImg.src = img.src;
    const ct = getComputedStyle(img).transform;
    const m = ct.match(/matrix\(([^)]+)\)/);
    const vals = m ? m[1].split(",").map(Number) : [];
    const isRotated = vals.length === 6 && Math.abs(vals[0]) < 0.1 && Math.abs(vals[1]) > 0.9;
    const isReversed = img.classList.contains("reversed") || (img.style.transform || "").includes("180");
    pImg.className = "card-preview-img";
    if (isRotated) pImg.classList.add("rotated");
    if (isReversed) pImg.classList.add("reversed");
    ov.classList.add("active");
    clearTimeout(_previewTimer);
    _previewTimer = setTimeout(() => _hidePreview(), PREVIEW_MS);
}

function _hidePreview() {
    const ov = document.getElementById("card-preview-overlay");
    if (ov) ov.classList.remove("active");
}
