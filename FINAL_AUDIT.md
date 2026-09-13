# NOIRÉ — Production Audit / Final Pass

Дата: 2026-09-13

## Результат

Повторный проход выполнен по исходному большому audit-промту после production-доработок.
Критических P0-блокеров по статическому аудиту не найдено.

## Закрытые блоки

- Neon auxiliary tables создаются автоматически.
- Production seed не использует bundled test/PII data.
- Demo password `noire2026` удалён.
- Admin/customer authentication использует HttpOnly session cookie; Bearer compatibility path удалён.
- Session invalidation через `sessionVersion` сохранена.
- CSRF/origin protection добавлена для cookie-authenticated state-changing API.
- Distributed rate limiting перенесён в PostgreSQL; cleanup включён.
- Durable audit log добавлен в отдельную PostgreSQL таблицу.
- Normalized PostgreSQL projection добавлена для orders, reservations, customers, employees, tables, shifts.
- JSONB store сохранён как compatibility/source layer, чтобы не потерять существующие функции; normalized projection синхронизируется транзакционно при store save.
- Reservation idempotency добавлена.
- Order idempotency сохранена.
- Idempotency TTL cleanup добавлен.
- Device image uploads переводятся в Vercel Blob; data-URL fallback оставлен только для local development.
- Старые Blob objects удаляются при замене/удалении изображения.
- Employee/menu/gallery photo uploads поддержаны.
- Mobile, roles, order flow, reservation flow, AI, history и existing UI/API contracts сохранены.

## Особый акцент

### 4. PostgreSQL

Добавлены нормализованные таблицы и индексы. Миграция является additive/shadow-safe: существующий JSONB store и API не удалены, поэтому существующий функционал не ломается. Store save и normalized projection обновляются в одной DB transaction.

### 5. Idempotency / cleanup

Order + reservation requests поддерживают `Idempotency-Key`. Pending requests восстанавливаются после timeout, завершённые ключи хранятся 24 часа. PostgreSQL cleanup удаляет просроченные idempotency/rate-limit rows.

### 7. Object storage

Фото с устройства больше не должны храниться в JSONB в production: сервер принимает существующий data-URL формат UI и переносит изображение в Vercel Blob, сохраняя в меню/галерее/сотруднике только URL. Для Vercel Blob актуальный SDK поддерживает server uploads; Vercel также поддерживает OIDC authentication без долгоживущего токена. См. официальную документацию Vercel.

## Ограничения среды

- Реальный production Neon/Vercel не подключён в этой сессии.
- `npm install` в рабочем окружении снова завершился по timeout, поэтому полный runtime E2E с настоящими npm dependencies здесь невозможен.
- Выполнен syntax/static audit и module-load smoke с минимальными test stubs.
- ZIP integrity проверена через `unzip -t`.

## Перед боевым запуском

1. Подключить Neon.
2. Подключить Vercel Blob store к проекту.
3. Настроить production env.
4. Выполнить реальный browser E2E на Vercel Preview/Production.
5. Проверить Resend password reset.
6. Проверить реальные upload/delete Blob operations.
