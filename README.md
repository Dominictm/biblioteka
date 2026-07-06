# biblioteka — компендиумы WoD VtM для Foundry VTT

Foundry-модуль с русскоязычными компендиумами для **Vampire: the Masquerade (V20)**,
система [worldofdarkness](https://github.com/JohanFalt/Foundry_WoD20).

Исходники (JSON, скрейпинг) живут в отдельном репозитории — `biblioteka-master`.
Этот репозиторий — только собранный модуль: манифест `module.json` и скомпилированные
LevelDB-паки в `packs/`.

## Установка в Foundry

Setup → Add-on Modules → Install Module → указать manifest URL:

```
https://raw.githubusercontent.com/Dominictm/biblioteka/master/module.json
```

Обновления модуль получает штатно, через "Update" в списке модулей — обновление
системы `worldofdarkness` модуль не затрагивает.

## Сборка из исходников

Требуется соседняя папка `../biblioteka-master` с исходными JSON.

```bash
npm install
npm run build    # собирает все паки в packs/
npm run verify   # сверяет число записей в паках с числом исходных JSON
```

## Релиз новой версии

Автоматически: `scripts/release.bat` (или `scripts/release.ps1`) — спросит
версию релиза, сам прогонит `build`+`verify`, обновит `version`/`download` в
`module.json`, закоммитит, поставит тег `vX.Y.Z` и запушит в `origin`.

Вручную, те же шаги:

1. Обновить исходники в `biblioteka-master` (при необходимости — пересобрать `_source`).
2. `npm run build && npm run verify`.
3. В `module.json` поднять `version` и обновить `download` на тот же тег (`vX.Y.Z`).
4. Закоммитить, затем:

```bash
git tag vX.Y.Z
git push --tags
```

GitHub Actions (`.github/workflows/release.yml`) соберёт паки, проверит их и создаст
GitHub Release с приложенным `biblioteka.zip`.

При добавлении/удалении пака список компендиумов нужно синхронизировать сразу
в четырёх местах: `module.json` (`packs[]`), `scripts/build.js`
(`LIBRARIES`/`COMPILERS`), `scripts/verify.js` (`CHECKS`/`PREFIX`) и
CI-проверку в `.github/workflows/release.yml` (список паков в `for p in ...`).
