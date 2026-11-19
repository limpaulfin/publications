/* tarot-api.js — Supabase REST API client (direct from frontend) */
const SB_URL = "https://wkjqtgjcrdeevhmsrtil.supabase.co/rest/v1";
const SB_KEY = "sb_publishable_AjXzIwWJ1bXT22kEkUUjTw_7KEC0se6";
const SB_HEADERS = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

async function sbFetch(path, options = {}) {
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(SB_URL + path, { ...options, headers: { ...SB_HEADERS, ...options.headers }, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) return { success: false };
        const data = await res.json();
        return { success: true, data: Array.isArray(data) ? data : data };
    } catch { return { success: false }; }
}

async function searchQuerents(query) {
    return sbFetch(`/querents?name=ilike.*${encodeURIComponent(query)}*&limit=10&select=id,name,gender,birth_year`);
}

async function apiCreateQuerent({ name, gender, birth_year }) {
    const r = await sbFetch("/querents", {
        method: "POST", headers: { "Prefer": "return=representation" },
        body: JSON.stringify({ name, gender: gender || null, birth_year: birth_year ? parseInt(birth_year) : null })
    });
    if (r.success && Array.isArray(r.data)) r.data = r.data[0];
    return r;
}

async function apiUpdateQuerent(id, { name, gender, birth_year }) {
    const r = await sbFetch(`/querents?id=eq.${id}`, {
        method: "PATCH", headers: { "Prefer": "return=representation" },
        body: JSON.stringify({ name, gender: gender || null, birth_year: birth_year ? parseInt(birth_year) : null })
    });
    if (r.success && Array.isArray(r.data)) r.data = r.data[0];
    return r;
}

async function loadQuerentSpreads(querentId) {
    return sbFetch(`/spreads?querent_id=eq.${querentId}&order=created_at.desc&limit=20`);
}

async function saveSpread(data) {
    const row = {
        querent_id: data.querent_id || null, querent: data.querent, question: data.question,
        spread: data.spread, date: data.date, cards: data.cards
    };
    const r = await sbFetch("/spreads", {
        method: "POST", headers: { "Prefer": "return=representation" },
        body: JSON.stringify(row)
    });
    if (r.success && Array.isArray(r.data) && r.data[0]) return { success: true, id: r.data[0].id };
    return r;
}

async function loadSpreads() {
    return sbFetch("/spreads?order=created_at.desc&limit=50");
}

async function apiDeleteQuerentSpreads(querentId) {
    try { await fetch(SB_URL + `/spreads?querent_id=eq.${querentId}`, { method: "DELETE", headers: SB_HEADERS }); return { success: true }; } catch { return { success: false }; }
}

async function apiDeleteQuerent(id) {
    try { await fetch(SB_URL + `/querents?id=eq.${id}`, { method: "DELETE", headers: SB_HEADERS }); return { success: true }; } catch { return { success: false }; }
}

async function apiDeleteSpread(id) {
    try {
        await fetch(SB_URL + `/spreads?id=eq.${id}`, { method: "DELETE", headers: SB_HEADERS });
        return { success: true };
    } catch { return { success: false }; }
}
