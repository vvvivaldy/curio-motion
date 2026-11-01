# Curio Motion — выпуск 1.0.1

Версия 1.0.1 поставляет очищенные исходники: без завершённых планов этапов, промежуточных отчётов и заменённых MP4/GIF. Актуальные примеры и отмеченные бета-пробы разделены в [каталоге](EXAMPLES.md). Код анимации, записанные звуки, зависимости и stable API не изменены относительно очищенной main.

[Страница выпуска](https://github.com/vvvivaldy/curio-motion/releases/tag/v1.0.1). Выбирай `curio-motion-1.0.1-macos.zip` и его `.sha256`: автоматический GitHub Source code ZIP — другой архив.

## Проверка поставки

Этот документ входит в исходный снимок до загрузки. Фактические tag/commit, SHA256, результаты чистой установки, GitHub CI и скачивания публичного ZIP фиксируются во внешних [отчёте](https://github.com/vvvivaldy/curio-motion/releases/download/v1.0.1/RELEASE_VERIFICATION_RU.md) и [машиночитаемой квитанции](https://github.com/vvvivaldy/curio-motion/releases/download/v1.0.1/RELEASE_PUBLIC_VERIFICATION.json). Номер версии сам по себе не подтверждает публикацию.

Перед изменением распакованного архива:

```sh
node scripts/verify-package.mjs
npm ci
npm run check
npm run dev
```

Для Git checkout достаточно `npm ci` и `npm run check`. [Команды и Chrome](DEVELOPMENT.md) · [работа с агентами](USAGE_RU.md).

## Поддержка и совместимость

Официальный объём — **macOS arm64** с отдельно установленным Chrome/Chromium и WebGL. Контрольные версии Node выпуска: 22.12.0 и 26.13.0. Установка, просмотр и MP4 на Windows/Linux не объявлены проверенными; Linux CI отдельно проверяет типы, тесты и сборку. [Поддержка](SUPPORT_RU.md) · [контракты](API_STABILITY.md) · [совместимость](COMPATIBILITY_RU.md).

1.0.1 — обновление состава поставки и документации, без новых рисунков и движений. Сохранённые фильмы имеют те же байты; прежняя художественная приёмка не выдаётся за новый просмотр или прослушивание. Рисунок, анатомию и постановку новой сцены по-прежнему пишет и проверяет автор.

## История и права

[Релиз 1.0.0](https://github.com/vvvivaldy/curio-motion/releases/tag/v1.0.0), его тег, архив и [итоговый отчёт](https://github.com/vvvivaldy/curio-motion/releases/download/v1.0.0/RELEASE_VERIFICATION_RU.md) сохраняются неизменными. Удалённые исторические материалы доступны в том Git-снимке.

Поставка — редактируемый TypeScript source-project (`private: true`), не npm-пакет. Оригинальный код MIT; Remotion, artwork и recorded media имеют отдельные условия: [ASSETS](../ASSETS.md), [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md). Приватные референсы не нужны для запуска включённых сцен.
