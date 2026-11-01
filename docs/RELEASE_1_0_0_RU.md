# Curio Motion 1.0.0

Редактируемый TypeScript source-project для 2D-анимации. Pixi рисует векторные сцены; Remotion задаёт кадры, живой Player и официальный MP4. `private: true` сохраняется: npm-пакета или глобального CLI нет.

## Скачать и запустить

На [странице v1.0.0](https://github.com/vvvivaldy/curio-motion/releases/tag/v1.0.0) выбирайте именно `curio-motion-1.0.0-macos.zip`, его SHA256 и внешний отчёт проверки. Автоматический GitHub Source code ZIP не является тем же поставочным asset.

Версия исходников и этот документ фиксируются **до** загрузки. Фактические публичные tag/commit, серверные digest и проверка скачанного ZIP фиксируются отдельно: `RELEASE_VERIFICATION_RU.md` и `RELEASE_PUBLIC_VERIFICATION.json` на странице выпуска. Публикация не выводится из номера версии, зелёного CI старой беты или принятого фильма.

Официальный end-to-end объём — macOS arm64 с существующим Chrome/WebGL; контрольная среда macOS 26.6.2 и Chrome for Testing 156.0.8078.4. Минимум совместимости Node 22.12.0/npm10.9.0, рекомендуемая контрольная версия Node 26.13.0 LTS/npm11.20.0. Windows/Linux browser/export и другие архитектуры не объявлены проверенными; фактический CI types/tests/build фиксируется отдельно от поддержки рендера.

До собственных правок сверьте внешний SHA и выполните:

```sh
node scripts/verify-package.mjs
npm ci
npm run check
npm run dev
```

Откройте напечатанный Vite адрес и `/player.html?example=morning-delivery`, `raccoon-courier` или `delivery-infographic`. Для звука нажмите play. [Установка и диагностика](DEVELOPMENT.md) · [Работа с агентами](USAGE_RU.md) · [Миграция с 0.2](COMPATIBILITY_RU.md).

```sh
export CHROME_PATH="/path/to/installed/chrome"
COMPOSITION_ID=MorningDelivery RENDER_AUDIO_CODEC=aac npm run render
```

## Состав и совместимость

20 названных stable API имён, восемь stable команд, включённые персонажные примеры/стили, recorded SFX, учебная инфографика, blank scaffold, инструкции пользователю/автору/критику и воспроизводимая поставка. [Контракты](API_STABILITY.md) и [реестр](API_STABILITY.json) отделяют stable от experimental/internal. Готовые примеры не обещают автоматическую анатомию и качество для любого референса или пропорций.

[Принятый RC baseline](RELEASE_1_0_0_BASELINE.json) связывает 1.0 с конкретным1.0.0-rc.1, техническими gates и владельческой приёмкой. Продвижение меняет root version и документы, сохраняет реальные source/scripts/dependency graph/media. Source fingerprint меняется по определению; старые квитанции остаются историческими. Перенос browser/API/resource/авторской пробы допускается только по полному version-aware binding; повторно выполненные команды проверки фиксируются отдельно.

Отдельная продакшен-команда агентов не требуется для запуска. Для небольшой сцены достаточно автора и владельца; сложные взаимодействия выигрывают от независимого критика, конкретная геометрическая проблема может потребовать математика. [Короткий вход агента](../AGENT_START_HERE_RU.md) работает без истории чата.

## Права и ресурсы

Оригинальный код MIT; Remotion, artwork и записанные эффекты имеют отдельные условия. Сохранены [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md), [ASSETS](../ASSETS.md) и material credits. Новых dependencies/media при продвижении принятого RC не добавляется. Whole `local-only` входы исключаются из Git/build/package независимо от ignore.

Память/скорость зависят от сцены и браузера. В ограниченных замерах быстрые reopen вкладок Chrome давали временный пик с последующим освобождением renderer-процессов и полным закрытием после выхода. Это не универсальная leak-free или GPU-memory гарантия. Численные проверки и наличие AAC не заменяют художественную/слуховую приёмку; новый MorningDelivery совпадает с принятым фильмом только если это подтверждено полными байтами.

## Что подтверждает внешний отчёт

1. Принятие конкретного RC и разрешение владельца выпустить стабильную1.0.
2. Новые version/manifest/source identity и чистая проверка точного stable ZIP.
3. Независимые source/history/CRC/checksum/provenance/known-pattern gates.
4. Различие испытанного branch commit и merge commit: если OID меняется, сравниваются деревья, а финальный ZIP пересобирается с правильным receipt.source.commit.
5. Реальные remote main/tag/release/asset IDs и результаты CI.
6. Скачанный именно release asset, его SHA и серверный digest, совпадающие с замороженным финальным ZIP; auto source archives не подменяют эту проверку.
