# NOIRÉ — Fix Report V4

### Booking conflicts
Исправлено правило занятости: активная бронь занимает выбранный стол на интервал `NOIRE_RESERVATION_DURATION_MINUTES` (default 90). Пересекающиеся интервалы запрещены; отменённые и завершённые брони не блокируют стол. Публичный и admin API используют один helper.

### Payments
Card/Cash уже существовали и были перепроверены. Добавлен визуальный NOIRÉ selector без сбора данных карты. Backend принимает только `card`/`cash`.

### Device photos
Backend и frontend уже поддерживали data URLs. Найден и исправлен важный регресс: public menu/gallery image sanitizers отклоняли `data:image/...`, поэтому загруженные с устройства фото могли сохраняться, но не показываться публично.

### Timezone
Admin table default time переведён на business timezone. Reservation frontend и admin clock уже получают timezone через `/api/site-settings`/`/api/admin`.

### DB cleanup
Удалены повторные `CREATE TABLE IF NOT EXISTS` вызовы из order/shift claim functions.

### Regression
Mock smoke runtime подтвердил основные customer/admin/role/order/reservation/menu/gallery/employee/shift/history сценарии.
