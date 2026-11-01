# Curio Motion 1.0.0

[Стабильный выпуск опубликован на GitHub](https://github.com/vvvivaldy/curio-motion/releases/tag/v1.0.0).

Поставка — редактируемый TypeScript source-project, не npm-пакет. Выбирай `curio-motion-1.0.0-macos.zip` и его `.sha256`. Автоматический GitHub Source code ZIP — другой архив.

## Что проверено

- Публичный тег `v1.0.0` указывает на commit `03e70695b3626a23ca177a6ab5a906b836de968e`.
- SHA256 поставочного ZIP: `5b5343d99458e9e9852c37ef78a99708f26d0b4d6b6f966b6b4f5c5e1ed90f2a`.
- ZIP скачан без авторизации; серверная сумма, контрольные суммы файлов и соответствие исходникам тега совпали.
- Чистая установка, проверки, официальный экспорт и независимая сверка пройдены в указанном объёме.

Подробности и границы проверок: [итоговый отчёт](https://github.com/vvvivaldy/curio-motion/releases/download/v1.0.0/RELEASE_VERIFICATION_RU.md), [машиночитаемая квитанция](https://github.com/vvvivaldy/curio-motion/releases/download/v1.0.0/RELEASE_PUBLIC_VERIFICATION.json).

Проверенная среда — **macOS arm64**, Node 22.12.0 / npm 10.9.0 и Node 26.13.0 / npm 11.20.0; Chrome for Testing 156.0.8078.4 на macOS 26.6.2. Linux CI проверяет типы, тесты и сборку; Windows/Linux Player и MP4 не проверены. [Поддержка](SUPPORT_RU.md).

## Запуск

После распаковки, до изменения файлов:

```sh
node scripts/verify-package.mjs
npm ci
npm run check
npm run dev
```

Для Git checkout вместо проверки манифеста архива достаточно `npm ci` и `npm run check`. [Команды и Chrome](DEVELOPMENT.md) · [работа с агентами](USAGE_RU.md).

Ветка `main` может содержать последующую уборку документации и галереи. Опубликованные тег и ZIP 1.0.0 неизменны; для точного повторения релизной проверки выбирай их.

## Состав

20 stable API имён, локальные команды, персонажные примеры, записанные эффекты, учебная инфографика, blank scaffold и инструкции авторам. [Контракты](API_STABILITY.md) · [совместимость](COMPATIBILITY_RU.md) · [примеры и бета-история](EXAMPLES.md).

Рисунок, анатомию и постановку пишет автор; библиотека не преобразует любой референс автоматически. Для небольшой сцены достаточно автора и человека. Сложные взаимодействия стоит проверять независимым критиком.

Оригинальный код MIT. Remotion, artwork и recorded media имеют отдельные условия: [ASSETS](../ASSETS.md), [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md). Приватные референсы для запуска включённых сцен не нужны.
