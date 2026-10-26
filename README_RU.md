# Curio Motion — быстрый старт

Самостоятельная авторская beta: референс + описание → агент пишет рисунок и движение кодом. PixiJS строит контуры, Remotion управляет кадром/Player и официальным экспортом. Генератор любых сцен пока не реализован.

1. Нужен Node ≥22.12. Распакуйте в отдельную папку, выполните `npm ci`, затем `npm run check`.
2. `npm run demo` — фильм, референс и исходники. `/player.html` — живой Remotion Player. `/index.html` — прямой Pixi baseline.
3. Для экспорта установите Chrome отдельно, задайте `CHROME_PATH` при необходимости, выполните `npm run render`. Вторая dev-консоль не нужна. Результат: `outputs/curio-motion-remotion.mp4`.
4. `npm run check:port` проверяет Pixel/Player совпадение и обратные seek; требует Chrome.

На macOS/Linux: `export CHROME_PATH="/путь/к/chrome"`. PowerShell: `$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'`.

Основной render использует официальный Remotion compositor. Только необязательный `render:baseline` требует отдельный FFmpeg: `FFMPEG_PATH` или PATH. Браузер/FFmpeg скрипты не скачивают.

[Полный английский README](README.md), [вход для нового агента](AGENT_START_HERE_RU.md), [готовый prompt](PROMPT_FOR_NEW_AGENT_RU.txt). Сначала воспроизвести baseline, затем выделить маленький API без изменения вида. Публикацию выполняет новый агент по поручению владельца, не автоматически.

Оригинальный код MIT; Remotion имеет отдельную лицензию. Windows/Linux runtime не проверен. Никаких зависимостей от чужого проекта/личных путей в исходниках нет.
