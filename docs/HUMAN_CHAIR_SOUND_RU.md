# Записанный звук: человек и деревянный стул

Актуальный пример — `human-chair-sound-v2`: записанные шаги по твёрдому полу и скрип деревянного стула поверх принятой анимации. [Фильм](assets/human-chair-sound-v2.mp4).

```sh
npm ci
npm run dev
# В браузере: /player.html?example=human-chair-sound-v2
```

Для официального экспорта используй установленный Chrome/Chromium:

```sh
CHROME_PATH='/path/to/installed/chrome' npm run render:sound:recorded
```

| Файл | Назначение |
| --- | --- |
| `src/examples/human-chair-sound-v2/cues.ts` | Время контактов, варианты и громкости |
| `src/examples/human-chair-sound-v2/assets.ts` | Выбранные записи |
| `src/examples/human-chair-sound-v2/sound.tsx` | Аудио на временной шкале Remotion |
| `public/audio/sfx/catalog.json` | Материалы, источники, лицензии и обработка |
| `scripts/render-human-chair-recorded.ts` | Экспорт и привязка входов к результату |

Немой `human-chair-v3.mp4` сохранён как baseline для проверки изображения. Варианты туши, бумаги и неона используют записанный звук V2.

Процедурный V1 был отклонён владельцем: шаги и посадка напоминали песок. Его экспорт убран из текущей папки; исходники и генератор сохранены как бета-проба и для регрессии. Команда `render:sound` пишет такой эксперимент в `outputs/`. [История беты](EXAMPLES.md).

[Каталог звуков](SFX_CATALOG_RU.md), [credits](../public/audio/sfx/CREDITS.md) и [кредиты стула](../public/audio/sfx/chair/CREDITS.md) содержат авторов и условия. Численная проверка синхронизации не заменяет прослушивание.
