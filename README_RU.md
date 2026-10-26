# Curio Motion

**Авторская 2D-анимация кодом на TypeScript.** PixiJS рисует контуры, Remotion управляет кадрами, живым Player и экспортом MP4.

[![Проверки](https://github.com/vvvivaldy/curio-motion/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/vvvivaldy/curio-motion/actions/workflows/ci.yml) [![Оригинальный код: MIT](https://img.shields.io/badge/original_code-MIT-e9959a)](LICENSE)

[English](README.md) · [API](docs/API.md) · [Как участвовать](CONTRIBUTING.md) · [План развития](docs/ROADMAP.md)

[![Реальный рендер: персонаж идёт, поворачивается, садится на эскалатор и чешет нос](docs/assets/demo.gif)](https://github.com/vvvivaldy/curio-motion/blob/main/docs/assets/demo-v4.mp4)

[Полный фильм](https://github.com/vvvivaldy/curio-motion/blob/main/docs/assets/demo-v4.mp4): 12 секунд, 1280 × 720, 24 кадра/с, без звука. GIF получен из официального Remotion-рендера. Сама сцена строит новые контуры на каждом кадре.

## Быстрый запуск

Нужны **Node ≥22.12**, npm и современный браузер с WebGL.

```sh
git clone https://github.com/vvvivaldy/curio-motion.git
cd curio-motion
npm ci
npm run demo
```

Откройте адрес из терминала, обычно `http://127.0.0.1:4176/viewer.html`. Если порт занят, Vite выберет другой.

- `/viewer.html` — фильм, референс и исходники.
- `/player.html` — живой Remotion Player с воспроизведением и перемоткой.
- `/index.html` — прямой Pixi baseline для сравнения.

```sh
npm run check  # типы, численные тесты, сборка
npm run render # официальный экспорт MP4; нужен существующий Chrome/Chromium
```

Результат: `outputs/curio-motion-remotion.mp4`. Если браузер не найден, задайте `CHROME_PATH`. Браузер автоматически не скачивается. Аккаунт и сетевой AI-сервис не нужны; установка зависимостей требует доступа к npm.

[Инструкция разработчика](docs/DEVELOPMENT.md) содержит команды для разных платформ, настройку Chrome, обновление GIF и описание проверок.

## Что можно менять

Рисунок, пропорции, опоры и действие находятся в [`src/examples/pink-monkey/`](src/examples/pink-monkey). Общие функции времени, глаз, шагов, координат, IK, согласованных контуров и контактных якорей — в [`src/core/`](src/core). [Пример API](README.md#use-the-local-api) показывает отрисовку произвольного кадра без накопленного состояния.

Цель эксперимента — проверяемый исходный код анимации: цельный референс и описание действия помогают автору написать рисунок и движение. Растровые части персонажа и готовое видео не используются как вход сцены. [Архитектура](docs/ARCHITECTURE.md) описывает разделение PixiJS и Remotion.

## Состояние проекта

Экспериментальная beta с **одним авторским примером**. Автоматический генератор любых сцен, разбор действий на естественном языке, аудиопайплайн и облачный сервис не реализованы. Локальный API не опубликован как npm-пакет.

Рендер проверялся на macOS. Ubuntu CI проверяет типы, численные свойства и сборку; браузерный рендер на Windows/Linux пока не подтверждён. [Доказательства проверок](docs/VERIFICATION.md) и исходный baseline сохранены.

## Участие и лицензия

[Сообщить об ошибке](https://github.com/vvvivaldy/curio-motion/issues/new?template=bug.yml) · [Предложить улучшение](https://github.com/vvvivaldy/curio-motion/issues/new?template=feature.yml). Порядок работы и требования к проверкам описаны в [CONTRIBUTING.md](CONTRIBUTING.md).

Оригинальный код — **[MIT](LICENSE)**. Remotion имеет [отдельную лицензию](docs/licenses/REMOTION-LICENSE.md); сохранены [уведомления о зависимостях](THIRD_PARTY_NOTICES.md). AI-происхождение референса и материалы проекта описаны в [ASSETS.md](ASSETS.md).
