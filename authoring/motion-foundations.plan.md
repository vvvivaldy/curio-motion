# Motion foundations — текущий статус

Подлинный математический черновик восстановлен и подключён к существующим viewer, Player и официальному Remotion export. Это один9-секундный пример,1280×720/24fps/216кадров. Исходные ACTION и wholeSVG не менялись.

- Рабочие критерии, допущения и41контрольный кадр: [authoring plan](motion-foundations.json).
- Цельный вход и происхождение: [inputs](motion-foundations.inputs.json); неизменённый [ACTION](motion-foundations.action.txt).
- Сцена: [scene.ts](../src/examples/motion-foundations/scene.ts); короткие контракты трёх модулей — [API](../docs/API.md#trajectories-damping-and-explicit-contacts).
- Официальный фильм: [motion-foundations.mp4](../docs/assets/motion-foundations.mp4), source dcd1a1f4915060a53d90cb9a98b7e55a6e85422f8df5975f68b7df2640f4ccb5.
- Проверки: [checks](../qa/math-demo-integration-2026-10-29/checks.json), [viewer/encoded](../qa/math-demo-integration-2026-10-29/viewer-and-encoded-check.json), [старый baseline](../qa/math-demo-integration-2026-10-29/accepted-baseline-regression.json). Общие тесты/сборка и927nativePixi/Playerсравнений PASS; старые2160поз и9принятыхфильмов сохранены.
- BEFORE/AFTER и точно просмотренные decodedкадры: [author inspection](../qa/math-demo-integration-2026-10-29/author-inspection.json). В исходном draft подтверждено пересечение предплечья и купола; оно исправлено геометрией300/260 с прежними контактом и суставными пределами. Regression прежнего случая и точного spring endpoint включены в проверки.

Это authored/integrated статус, не прежний scaffold placeholder. Автор лично просмотрел9decodedконтролей; полный визуальный playback1×/0.5× не наблюдался. MODEL/FINAL reviews остаются pending по непросмотренному requiredcoverage и полному фильму; человеческой приёмки новой математической сцены пока нет. Прежняя владельческая приёмка коробки9331 этим не изменяется.

Исторический planning note сохранён в [planning-note-before.md](../qa/math-demo-integration-2026-10-29/planning-note-before.md), SHA2bbec8404dd9d35218da23c41b1362ccffb82fda9ba3c611d3ae78a7152479d8; подлинный recovered архив также неизменён. Этот статусный markdown не входит в image-source snapshot, QA-policy hash или loadPlan identity (там используются JSON/input/ACTION), поэтому его обновление не требует нового фильма.
