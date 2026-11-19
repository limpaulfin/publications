/* QR sharing for the Tarot app: the QR button opens a panel with a QR code
   of this page's address; from there the user can share the QR IMAGE as a
   file or share the LINK itself, so other people can open the app. */
(function () {
    function appUrl() {
        return location.origin + location.pathname;
    }

    function buildPanel() {
        var panel = document.createElement("div");
        panel.id = "qr-panel";
        panel.className = "qr-panel";
        panel.style.display = "none";
        panel.innerHTML =
            '<div class="qr-box">' +
            '<h2><i class="fas fa-qrcode"></i> Mã QR của app Tarot</h2>' +
            '<div id="qr-code" class="qr-code"></div>' +
            '<div class="qr-url">' + appUrl() + "</div>" +
            '<div class="btn-row">' +
            '<button id="share-qr-img-btn" class="generate-btn share-btn"><i class="fas fa-image"></i> Chia sẻ ảnh QR</button>' +
            '<button id="share-link-btn" class="generate-btn copy-btn-tarot"><i class="fas fa-link"></i> Chia sẻ link</button>' +
            "</div>" +
            '<button id="qr-close-btn" class="generate-btn qr-close-btn"><i class="fas fa-times"></i> Đóng</button>' +
            "</div>";
        document.body.appendChild(panel);
        panel.addEventListener("click", function (e) { if (e.target === panel) hidePanel(); });
        document.getElementById("qr-close-btn").addEventListener("click", hidePanel);
        document.getElementById("share-qr-img-btn").addEventListener("click", shareQrImage);
        document.getElementById("share-link-btn").addEventListener("click", shareLink);
        return panel;
    }

    var qrBuilt = false;
    function showPanel() {
        var panel = document.getElementById("qr-panel") || buildPanel();
        panel.style.display = "flex";
        if (!qrBuilt) {
            qrBuilt = true;
            var holder = document.getElementById("qr-code");
            if (typeof QRCode !== "undefined") {
                new QRCode(holder, { text: appUrl(), width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
            } else {
                holder.innerHTML = '<div class="qr-fallback">Không tải được thư viện QR.<br/>Hãy dùng nút Chia sẻ link bên dưới.</div>';
            }
        }
    }

    function hidePanel() {
        var panel = document.getElementById("qr-panel");
        if (panel) panel.style.display = "none";
    }

    function feedback(btn, text) {
        var original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> ' + text;
        setTimeout(function () { btn.innerHTML = original; }, 2000);
    }

    async function shareQrImage() {
        var btn = document.getElementById("share-qr-img-btn");
        var canvas = document.querySelector("#qr-code canvas");
        var img = document.querySelector("#qr-code img");
        var dataUrl = canvas ? canvas.toDataURL("image/png") : (img ? img.src : "");
        if (!dataUrl) { alert("Chưa tạo được mã QR."); return; }
        var blob = await (await fetch(dataUrl)).blob();
        var file = new File([blob], "tarot-qr.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: "QR app Tarot thập giá" }); feedback(btn, "Đã chia sẻ!"); } catch { /* cancelled */ }
        } else {
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = "tarot-qr.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
            feedback(btn, "Đã tải ảnh!");
        }
    }

    async function shareLink() {
        var btn = document.getElementById("share-link-btn");
        var url = appUrl();
        if (navigator.share) {
            try { await navigator.share({ title: "Tarot thập giá (Cậu3Tarot)", url: url }); feedback(btn, "Đã chia sẻ!"); } catch { /* cancelled */ }
        } else {
            try { await navigator.clipboard.writeText(url); feedback(btn, "Đã chép link!"); }
            catch { alert(url); }
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("qr-btn");
        if (btn) btn.addEventListener("click", showPanel);
    });
})();
