function checkAuth() {
    if (localStorage.getItem("tarot_auth") === "ok") return true;
    const pass = prompt("Nhập mật khẩu để truy cập:");
    if (pass === "Fong") { localStorage.setItem("tarot_auth", "ok"); return true; }
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:20vh'>Không có quyền truy cập</h2>";
    return false;
}
