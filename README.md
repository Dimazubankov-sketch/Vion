# Vion

Мессенджер в стиле X (Twitter) и Telegram. Светло-серый интерфейс, фиолетовый
акцент Vion. Next.js 16 (App Router) + TypeScript + Tailwind v4 +
`react-aria-components` + `@remixicon/react`.

## Запуск

```bash
npm run dev
```

Открой http://localhost:3210 (порт задан в `.claude/launch.json`; обычный
`next dev` поднимется на 3000).

Авторизация замокана: на экране входа введи любой email и пароль (8+ символов) —
или зарегистрируйся. Сессия хранится в `localStorage`, «Sign out» — в боковом меню.

## Структура

```
src/
  app/
    layout.tsx            # провайдеры (тема, авторизация), метаданные, анти-flash темы
    page.tsx              # гейт: экран входа или приложение
    globals.css           # дизайн-токены (светлая/тёмная), анимации
  lib/
    auth-context.tsx      # мок-авторизация + localStorage
    theme-context.tsx     # переключение светлая/тёмная тема
    mock-data.ts          # контакты, чаты, лента, уведомления
  components/
    logo.tsx              # знак Vion (SVG-вертушка) + словесный знак
    auth/
      auth-card.tsx       # карточка входа/регистрации (аналог BoardUI <AuthCard>)
      auth-screen.tsx     # экран авторизации
    app/
      app-shell.tsx       # оболочка: шапка, вкладки, нижняя навигация, оверлеи
      feed.tsx            # лента (X-стиль)
      notifications.tsx   # уведомления
      chat.tsx            # список чатов + переписка (Telegram-стиль)
      sidebar.tsx         # боковое меню (drawer)
      profile.tsx         # профиль (баннер, статистика, тепловая карта активности)
    ui/
      avatar.tsx          # аватар с онлайн-точкой
  utils/
    cx.ts                 # clsx + tailwind-merge
```

## Навигация

- **Нижняя панель** — 3 вкладки: Home (лента), Notifications, Messages (чат).
- **Аватар слева вверху** (или иконка меню) → боковое меню.
- В боковом меню **карточка пользователя** или пункт **Profile** → профиль.
- В чате: поиск → список чатов → тап по чату открывает переписку (с отправкой).

## Заметки

- Компоненты BoardUI Pro (`AuthCard`, `DashboardSidebar`, `SettingsModal` и др.)
  требуют платной лицензии Pro и тянут десятки внутренних зависимостей, поэтому
  здесь они воссозданы самостоятельно в том же стиле — проект запускается без Pro.
- Фирменный знак Vion — inline-SVG. Чтобы поставить официальный PNG, положи файл
  в `/public` и замени `VionMark` в `src/components/logo.tsx`.
- Аватары/фото — заглушки с `i.pravatar.cc` и `picsum.photos` (нужен интернет).
