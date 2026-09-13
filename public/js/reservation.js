document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('reservation-form');
  const dateInput = document.getElementById('reservation-date');
  const timeInput = document.getElementById('reservation-time');
  const guestsInput = document.getElementById('reservation-guests');
  const tableSelect = document.getElementById('reservation-table');
  const nameInput = document.getElementById('reservation-name');
  const phoneInput = document.getElementById('reservation-phone');
  const message = document.getElementById('reservation-message');

  if (!form) return;

  const showMessage = (text, type = '') => {
    if (!message) return;

    message.textContent = text;
    message.className = `reservation-message ${type}`.trim();
  };

  const getTables = async () => {
    const response = await fetch('/api/tables', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить столики');
    }

    return response.json();
  };

  const getCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin'
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data?.user) {
        if (nameInput && !nameInput.value) {
          nameInput.value = data.user.name || '';
        }

        if (phoneInput && !phoneInput.value) {
          phoneInput.value = data.user.phone || '';
        }
      }

      return data?.user || null;
    } catch {
      return null;
    }
  };

  const loadTables = async () => {
    try {
      const data = await getTables();

      const tables = Array.isArray(data)
        ? data
        : Array.isArray(data?.tables)
          ? data.tables
          : [];

      if (!tableSelect) return;

      tableSelect.innerHTML = '<option value="">Выберите столик</option>';

      tables.forEach(table => {
        if (table.active === false) return;

        const option = document.createElement('option');

        option.value = table.id;

        const capacity = table.capacity
          ? `до ${table.capacity} гостей`
          : '';

        option.textContent = capacity
          ? `${table.name || `Столик ${table.id}`} — ${capacity}`
          : (table.name || `Столик ${table.id}`);

        tableSelect.appendChild(option);
      });
    } catch (error) {
      console.error(error);
      showMessage('Не удалось загрузить столики. Попробуйте обновить страницу.', 'error');
    }
  };

  const refreshAvailability = async () => {
    if (!dateInput || !timeInput || !guestsInput || !tableSelect) return;

    const date = dateInput.value;
    const time = timeInput.value;
    const guests = Number(guestsInput.value);

    if (!date || !time || !guests) return;

    try {
      const params = new URLSearchParams({
        date,
        time,
        guests: String(guests)
      });

      const response = await fetch(`/api/tables?${params.toString()}`, {
        credentials: 'same-origin'
      });

      if (!response.ok) return;

      const data = await response.json();

      const tables = Array.isArray(data)
        ? data
        : Array.isArray(data?.tables)
          ? data.tables
          : [];

      const currentValue = tableSelect.value;

      tableSelect.innerHTML = '<option value="">Выберите столик</option>';

      tables.forEach(table => {
        if (table.active === false) return;

        const available =
          table.available !== false &&
          table.isAvailable !== false;

        if (!available) return;

        if (table.capacity && Number(table.capacity) < guests) {
          return;
        }

        const option = document.createElement('option');

        option.value = table.id;

        const capacity = table.capacity
          ? `до ${table.capacity} гостей`
          : '';

        option.textContent = capacity
          ? `${table.name || `Столик ${table.id}`} — ${capacity}`
          : (table.name || `Столик ${table.id}`);

        tableSelect.appendChild(option);
      });

      if (
        currentValue &&
        [...tableSelect.options].some(
          option => option.value === currentValue
        )
      ) {
        tableSelect.value = currentValue;
      }
    } catch (error) {
      console.error('Ошибка проверки столиков:', error);
    }
  };

  await getCurrentUser();
  await loadTables();

  if (dateInput) {
    dateInput.addEventListener('change', refreshAvailability);
  }

  if (timeInput) {
    timeInput.addEventListener('change', refreshAvailability);
  }

  if (guestsInput) {
    guestsInput.addEventListener('change', refreshAvailability);
    guestsInput.addEventListener('input', refreshAvailability);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    showMessage('');

    const name = nameInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const date = dateInput?.value || '';
    const time = timeInput?.value || '';
    const guests = Number(guestsInput?.value || 0);
    const tableId = tableSelect?.value || '';

    if (!name) {
      showMessage('Введите имя.', 'error');
      nameInput?.focus();
      return;
    }

    if (!phone) {
      showMessage('Введите номер телефона.', 'error');
      phoneInput?.focus();
      return;
    }

    if (!date) {
      showMessage('Выберите дату.', 'error');
      dateInput?.focus();
      return;
    }

    if (!time) {
      showMessage('Выберите время.', 'error');
      timeInput?.focus();
      return;
    }

    if (!guests || guests < 1) {
      showMessage('Укажите количество гостей.', 'error');
      guestsInput?.focus();
      return;
    }

    if (!tableId) {
      showMessage('Выберите столик.', 'error');
      tableSelect?.focus();
      return;
    }

    const body = {
      name,
      phone,
      date,
      time,
      guests,
      tableId
    };

    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      showMessage('Отправляем бронирование...', 'loading');

      const response = await fetch('/api/reservations', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        credentials: 'same-origin',

        body: JSON.stringify(body)
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Не удалось создать бронирование.'
        );
      }

      showMessage(
        data?.message ||
        'Бронирование успешно создано! Мы свяжемся с вами для подтверждения.',
        'success'
      );

      form.reset();

      await loadTables();
    } catch (error) {
      console.error('Ошибка бронирования:', error);

      showMessage(
        error?.message ||
        'Не удалось создать бронирование. Попробуйте ещё раз.',
        'error'
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
});