# Примеры и история беты

## Актуальные примеры

Это выбранные сцены из текущей ветки. Рисунок, пропорции и постановка заданы их исходниками; качество не распространяется автоматически на нового персонажа.

| Пример | Player / composition | Фильм и описание |
| --- | --- | --- |
| «Ноябрь отменён», английская версия | `november-cancelled` / `NovemberCancelled` | [Фильм](assets/november-cancelled-en.mp4), [исходники и экспорт](NOVEMBER_CANCELLED.md) |
| Утренний маршрут | `morning-delivery` / `MorningDelivery` | [Фильм](assets/morning-delivery-accepted-v1.mp4), [устройство](MORNING_DELIVERY_RU.md) |
| Енот и письмо | `raccoon-courier` / `RaccoonCourier` | [Фильм](assets/raccoon-courier-anatomy-sound-v3.mp4), [устройство](RACCOON_COURIER_RU.md) |
| Учебная инфографика | `delivery-infographic` / `DeliveryInfographic` | [Фильм](assets/delivery-infographic-first-pass.mp4), [данные](DELIVERY_INFOGRAPHIC_RU.md) |
| Кот, часы и картина, V3 | `cat-picture-story-v3` / `CatPictureStoryV3` | [Фильм](assets/cat-picture-story-v3.mp4), [устройство](CAT_PICTURE_STORY.md) |
| Чёрный кот и стул, V3 | `black-cat-chair` / `BlackCatChair` | [Фильм](assets/black-cat-chair-v3.mp4), [исходники и команды](BLACK_CAT.md) |
| Человек, записанные шаги и деревянный стул | `human-chair-sound-v2` / `HumanChairSoundV2` | [Фильм](assets/human-chair-sound-v2.mp4), [звук](HUMAN_CHAIR_SOUND_RU.md) |
| Неон: уверенная / осторожная игра | `human-chair-neon-confident` / `human-chair-neon-cautious` | [Уверенный](assets/human-chair-neon-confident-v1.mp4), [осторожный](assets/human-chair-neon-cautious-v1.mp4) |
| Тушь / бумажная рисовка | `human-chair-ink` / `human-chair-paper` | [Тушь](assets/human-chair-ink-v1.mp4), [бумага](assets/human-chair-paper-v1.mp4) |
| Робот с лейкой, V2 | `amber-robot` / `AmberRobot` | [Фильм](assets/amber-robot-v2.mp4), [повторное использование API](REUSE.md) |
| Обезьяна на эскалаторе, V5 | `pink-monkey` / `PinkMonkey` | [Фильм](assets/demo-v5.mp4) |
| Перенос коробки | `ivory-carrier` / `IvoryCarrier` | Живая сцена и экспорт из исходников; готовый фильм не включён |

Открывай `/player.html?example=<имя>` для живой сцены или `/viewer.html?example=<имя>` для сохранённого фильма. Значения инфографики 12/18/30 — учебные. Немой `human-chair-v3.mp4` сохранён как технический baseline команд записанного звука и стилей, отдельно от звуковой версии.

## Бета и ранние пробы

Эти работы сделаны **до стабильного релиза** и не являются текущей витриной качества.

| Проба | Статус |
| --- | --- |
| Кабан A/B (`serious-boar`, `serious-boar-v2`) | Историческая проверка самостоятельного автора. B и его исходники оставлены для изучения механизмов; в галерее вынесен в раздел «Бета». A и сравнения — в истории Git. |
| `motion-foundations` | Техническая проба контактов и движения, а не законченный мультфильм. Вынесена в раздел «Бета». |
| Кот V1/V2 | Ранние варианты до исправлений ориентации, суставов и бега. Заменены V3; старые экспорты удалены из текущей папки. |
| `human-chair-sound`, звук V1 | Отклонённый владельцем синтезированный звук: шаги и посадка звучали как песок. Для использования выбирай записанный V2. |
| Первые версии обезьяны, робота, чёрного кота и человека | Заменены выбранными версиями из таблицы выше. Промежуточные MP4/GIF удалены из текущей папки. |

[Старые фильмы](https://github.com/vvvivaldy/curio-motion/tree/v1.0.0/docs/assets) · [исторические проверки и сравнения](https://github.com/vvvivaldy/curio-motion/tree/v1.0.0/docs/reviews) · [прежняя бета 0.2](https://github.com/vvvivaldy/curio-motion/releases/tag/v0.2.0-beta.1).

Исходники старых вариантов, необходимые тестам и актуальным сценам, сохранены. Для воспроизведения исторической проверки выбирай её исходный тег/commit: новый checkout не выдаётся за прежнюю среду и фильм. Существующие теги и выпущенные ZIP не менялись.
