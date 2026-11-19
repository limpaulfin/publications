/* Pull-to-refresh for the Tarot web app: drag down while at the very top of
   the page and release past the threshold to reload. Gives web-app users
   (no visible browser reload button) a native-feeling way to refresh. */
(function () {
    var THRESHOLD = 80, MAX_PULL = 120;
    var startY = null, pulling = false;

    var bar = document.createElement("div");
    bar.id = "ptr-bar";
    bar.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Kéo xuống để tải lại</span>';
    document.body.appendChild(bar);

    function setBar(dy, ready) {
        bar.style.transform = "translate(-50%, " + (dy - 48) + "px)";
        bar.classList.toggle("ptr-ready", ready);
        bar.querySelector("span").textContent = ready ? "Thả ra để tải lại" : "Kéo xuống để tải lại";
        bar.querySelector("i").style.transform = "rotate(" + Math.min(dy * 2, 180) + "deg)";
    }

    document.addEventListener("touchstart", function (e) {
        if (window.scrollY <= 0 && e.touches.length === 1) {
            startY = e.touches[0].clientY;
            pulling = true;
        } else {
            startY = null;
            pulling = false;
        }
    }, { passive: true });

    document.addEventListener("touchmove", function (e) {
        if (!pulling || startY === null) return;
        var dy = e.touches[0].clientY - startY;
        if (dy <= 0 || window.scrollY > 0) { setBar(0, false); bar.style.transform = "translate(-50%, -60px)"; return; }
        if (e.cancelable) e.preventDefault();
        setBar(Math.min(dy * 0.55, MAX_PULL), dy * 0.55 >= THRESHOLD);
    }, { passive: false });

    document.addEventListener("touchend", function (e) {
        if (!pulling) return;
        pulling = false;
        var dy = (e.changedTouches[0].clientY - startY) * 0.55;
        if (dy >= THRESHOLD) {
            bar.querySelector("span").textContent = "Đang tải lại...";
            bar.querySelector("i").style.transform = "";
            bar.classList.add("ptr-spin");
            setTimeout(function () { location.reload(); }, 250);
        } else {
            bar.style.transform = "translate(-50%, -60px)";
        }
        startY = null;
    });
})();
