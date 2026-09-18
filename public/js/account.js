const money = (n) =>
  new Intl.NumberFormat("ru-RU").format(Number(n) || 0) + " ֏";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );

  const accountT = (key, vars = {}) =>
    window.noireT
        ? window.noireT(key, vars)
        : key.replace(
            /\{(\w+)\}/g,
            (_, name) => vars[name] ?? `{${name}}`
        ); 

async function api(url, opt = {}) {
  const r = await fetch(url, {
    ...opt,
    credentials: "same-origin",
    headers: { ...(opt.headers || {}) },
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.message || "Ошибка");
  return d;
}
async function load() {
  try {
  const me = await api("/api/auth/me");

document.querySelector("#hello").textContent =
  accountT("Добро пожаловать, {name}", {
    name: me.user.name
  });
    document.querySelector("#profile").innerHTML =
`<div class="profile-item"><small>${accountT("Имя")}</small>${esc(me.user.firstName || me.user.name || "")}</div><div class="profile-item"><small>${accountT("Фамилия")}</small>${esc(me.user.lastName || "—")}</div><div class="profile-item"><small>${accountT("Отчество")}</small>${esc(me.user.middleName || "—")}</div><div class="profile-item"><small>Email</small>${esc(me.user.email || accountT("Не указан"))}</div><div class="profile-item"><small>${accountT("Телефон")}</small>${esc(me.user.phone || accountT("Не указан"))}</div>`;
    const [d, rsv] = await Promise.all([
      api("/api/auth/orders"),
      api("/api/auth/reservations"),
    ]);
    document.querySelector("#orders").innerHTML =
      d.orders
        .map(
          (o) =>
`<article class="order-card"><div class="order-top"><b>${accountT("Заказ #{number}", { number: o.number })}</b><strong>${money(o.total)}</strong></div><div class="order-items">${(o.items || []).map((i) => `${esc(i.name)} × ${i.quantity}`).join("<br>")}</div><small>${window.noireFormatDateTime ? noireFormatDateTime(o.createdAt) : new Date(o.createdAt).toLocaleString()} · ${esc(o.status)}</small></article>`,         )
       .join("") || `<p>${accountT("Заказов пока нет.")}</p>`;
    document.querySelector("#reservations").innerHTML =
      (rsv.reservations || [])
        .map(
          (r) =>
`<article class="order-card"><div class="order-top"><b>${accountT("Бронь #{number}", { number: r.number })}</b><strong>${esc(window.noireFormatDate ? noireFormatDate(r.date) : r.date)} ${esc(r.time)}</strong></div><div class="order-items">${accountT("{count} гостей", { count: r.guests })} · ${r.tableId ? accountT("Стол T{number}", { number: String(r.tableId).padStart(2, "0") }) : accountT("стол не указан")}</div><small>${esc(r.status)}</small></article>`,        )
        .join("") || `<p>${accountT("Бронирований пока нет.")}</p>`;
  } catch (e) {
    location.href = "/login.html";
  }
}
document.querySelector("#logout").onclick = async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {}
  location.href = "/";
};
load();

document.addEventListener(
    "noire:languagechange",
    () => {
        if (typeof load === "function") {
            load();
        }
    }
);
