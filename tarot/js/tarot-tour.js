/* tarot-tour.js — Guided tour (coach marks): tapping the (i) button dims the
   page and spotlights one control at a time, with a caption saying what it
   is and what to do with it. */
(function () {
    var STEPS = [
        { sel: "#querent-name", title: "Tên người hỏi", text: "Nhập tên người được coi. Gõ vài chữ đầu, app sẽ gợi ý những người đã coi trước đây." },
        { sel: ".dob-row", title: "Ngày sinh", text: "Chọn ngày, tháng, năm sinh của người hỏi. Năm đã để sẵn 2000 cho dễ chọn tiếp." },
        { sel: "#question-select", title: "Chủ đề câu hỏi", text: "Chọn chủ đề của buổi coi, và ghi thêm câu hỏi cụ thể ở ô dưới nếu có." },
        { sel: "#random-btn", title: "Rút bài ngẫu nhiên", text: "Bấm nút xúc xắc để rút ngẫu nhiên đủ 10 lá. Nút tẩy bên cạnh xoá toàn bộ lá bài và kết quả." },
        { sel: "#card-positions", title: "10 vị trí bài", text: "Hoặc chọn tay từng lá cho mỗi vị trí. Gạt công tắc bên phải khi lá bài bị ngược." },
        { sel: "#generate-btn", title: "Giải bài", text: "Khi đã đủ thông tin và đủ 10 lá, bấm Giải bài để tạo kết quả trải bài." },
        { sel: "#download-spread-btn", title: "Tải ảnh trải bài", text: "Tải ảnh toàn bộ trải bài về máy, đúng kích thước và vị trí như đang thấy trên màn hình." },
        { sel: "#copy-json-btn", title: "Gửi kết quả đi", text: "Sao chép kết quả, hoặc bấm Chia sẻ để gửi thẳng một file kết quả cho người coi." }
    ];
    var idx = 0, hole = null, tip = null, catcher = null;

    function visible(el) {
        if (!el) return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    function build() {
        catcher = document.createElement("div");
        catcher.id = "tour-catch";
        hole = document.createElement("div");
        hole.id = "tour-hole";
        tip = document.createElement("div");
        tip.id = "tour-tip";
        tip.innerHTML =
            '<div class="tour-step-count"></div>' +
            '<div class="tour-title"></div>' +
            '<div class="tour-text"></div>' +
            '<div class="tour-nav">' +
            '<button type="button" class="tour-skip">Bỏ qua</button>' +
            '<button type="button" class="tour-next">Tiếp</button>' +
            "</div>";
        document.body.appendChild(catcher);
        document.body.appendChild(hole);
        document.body.appendChild(tip);
        tip.querySelector(".tour-skip").addEventListener("click", end);
        tip.querySelector(".tour-next").addEventListener("click", next);
        catcher.addEventListener("click", function () { /* swallow taps */ });
    }

    function place() {
        var step = STEPS[idx];
        var el = document.querySelector(step.sel);
        var r = el.getBoundingClientRect();
        var pad = 6;
        hole.style.left = (r.left - pad) + "px";
        hole.style.top = (r.top - pad) + "px";
        hole.style.width = (r.width + pad * 2) + "px";
        hole.style.height = (r.height + pad * 2) + "px";
        tip.querySelector(".tour-step-count").textContent = "Bước " + (idx + 1) + "/" + STEPS.length;
        tip.querySelector(".tour-title").textContent = step.title;
        tip.querySelector(".tour-text").textContent = step.text;
        tip.querySelector(".tour-next").textContent = idx === STEPS.length - 1 ? "Xong" : "Tiếp";
        var tipH = tip.offsetHeight || 150;
        var below = r.bottom + pad + 12;
        var top = below + tipH < window.innerHeight ? below : Math.max(10, r.top - pad - 12 - tipH);
        tip.style.top = top + "px";
    }

    function show(i) {
        idx = i;
        while (idx < STEPS.length && !visible(document.querySelector(STEPS[idx].sel))) idx++;
        if (idx >= STEPS.length) { end(); return; }
        var el = document.querySelector(STEPS[idx].sel);
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(place, 380);
    }

    function next() {
        if (idx >= STEPS.length - 1) { end(); return; }
        show(idx + 1);
    }

    function end() {
        [catcher, hole, tip].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
        catcher = hole = tip = null;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("tour-btn");
        if (btn) btn.addEventListener("click", function () { build(); show(0); });
    });
})();
