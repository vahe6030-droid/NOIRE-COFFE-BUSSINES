let tables = [];
let selected = null;
const floor = document.querySelector("#floor");
const form = document.querySelector("#reservationForm");

const reservationT = (key, vars = {}) =>
    window.noireT
        ? window.noireT(key, vars)
        : key.replace(
            /\{(\w+)\}/g,
            (_, name) => vars[name] ?? `{${name}}`
        );
        
function draw(blocked = []) {
  floor.innerHTML = tables
    .map(
      (t) =>
        `<button type="button" class="seat ${blocked.includes(t.id) ? "blocked" : ""} ${selected === t.id ? "selected" : ""}" data-id="${t.id}" style="left:${t.x}%;top:${t.y}%" ${blocked.includes(t.id) ? "disabled" : ""}><b>${t.name}</b><small>${t.seats} места</small></button>`,
    )
    .join("");
  floor.querySelectorAll(".seat").forEach(
    (b) =>
      (b.onclick = () => {
        selected = Number(b.dataset.id);

        document.querySelector("#tableId").value = selected;

        document.querySelector("#selectedInfo").textContent =
          reservationT("Выбран стол T{number}.", {
            number: String(selected).padStart(2, "0")
          });

        draw(currentBlocked);
      }),
);
}
let currentBlocked = [];
let reservationDurationMinutes = 90;
async function refresh() {
  const d = document.querySelector("#bookingDate").value,
    t = document.querySelector("#bookingTime").value;
  if (!d || !t) {
    currentBlocked = [];
    draw();
    return;
  }
  try {
    const r = await fetch(
      `/api/tables/availability?date=${encodeURIComponent(d)}&time=${encodeURIComponent(t)}`,
    );
    if (!r.ok) throw new Error("availability");
    const x = await r.json();
    currentBlocked = x.blocked || [];
    reservationDurationMinutes = Number(x.reservationDurationMinutes) || 90;
    if (currentBlocked.includes(selected)) {
    selected = null;

    document.querySelector("#tableId").value = "";

    document.querySelector("#selectedInfo").textContent =
        reservationT(
            "Выбранный стол уже занят на это время."
        );
}
    draw(currentBlocked);
  } catch {
    currentBlocked = [];
    draw();
   showToast(
    reservationT("Не удалось обновить доступность столов")
);
  }
}
(async function fillReservationCustomer() {
  try {
    const r = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!r.ok) return;
    const u = (await r.json()).user || {};
    const f = document.querySelector("#reservationForm");
    if (f) {
      if (f.elements.name && !f.elements.name.value)
        f.elements.name.value =
          [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ") ||
          u.name ||
          "";
      if (f.elements.phone && !f.elements.phone.value)
        f.elements.phone.value = u.phone || "";
    }
  } catch (e) {}
})();
(async () => {
  try {
    const r = await fetch("/api/tables");
    if (!r.ok) throw new Error("tables");
    tables = await r.json();
    if (!Array.isArray(tables)) throw new Error("tables");
    draw();
    let tz = "Asia/Yerevan";
    try {
      const settings = await fetch("/api/site-settings").then((x) => x.json());
      tz = settings.timezone || tz;
    } catch {}
    document.querySelector("#bookingDate").min = new Intl.DateTimeFormat(
      "en-CA",
      { timeZone: tz },
    ).format(new Date());
    if (window.noireInitTimeInputs) noireInitTimeInputs();
    document.querySelector("#bookingDate").addEventListener("change", refresh);
    document.querySelector("#bookingTime").addEventListener("change", refresh);
    document.querySelector("#guests").addEventListener("change", () => {
      if (selected) {
        const t = tables.find((x) => x.id === selected);
       if (t && t.seats < Number(document.querySelector("#guests").value)) {
    selected = null;

    document.querySelector("#tableId").value = "";

    document.querySelector("#selectedInfo").textContent =
        reservationT(
            "Для такого количества гостей выберите более большой стол."
        );

    draw(currentBlocked);
}
      }
    });
  } catch {
    floor.innerHTML = `
  <p style="color:#aaa;padding:20px">
    ${reservationT("Столы временно недоступны. Обновите страницу.")}
  </p>
`;

showToast(
  reservationT("Не удалось загрузить столы")
);
}
})();
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = form.querySelector("button[type=submit]");
  if (!selected) {
   showToast(
    reservationT("Сначала выберите стол")
);
    return;
  }
  b.disabled = true;
b.textContent = reservationT("Бронируем…");
  try {
    const body = Object.fromEntries(new FormData(form));
    body.guests = Number(body.guests);
    body.budget = Number(body.budget || 0);
    body.tableId = selected;
    const r = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
form.innerHTML = `
  <div style="grid-column:1/-1;text-align:center;padding:60px 10px">
    <div style="font-size:64px;color:#e2bd82">✓</div>

    <h2 style="font:600 38px 'Playfair Display',serif;margin:12px">
      ${reservationT("Стол забронирован")}
    </h2>

    <p style="color:#9e9389">
      ${reservationT("Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.", {
        number: d.reservation.number
      })}
    </p>
  </div>
`;  } catch (err) {
   showToast(
    err.message ||
    reservationT("Не удалось создать бронь")
);
    if (err.message && /занят|занято/i.test(err.message)) {
      await refresh();
    }
    b.disabled = false;
    b.textContent = "Забронировать стол";
  }
});

document.addEventListener(
    "noire:languagechange",
    () => {
        const selectedInfo = document.querySelector("#selectedInfo");

        if (selectedInfo && selected) {
            selectedInfo.textContent =
                reservationT("Выбран стол T{number}.", {
                    number: String(selected).padStart(2, "0")
                });
        }
    }
);