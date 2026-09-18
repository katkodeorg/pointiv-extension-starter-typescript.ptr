# Hello World Pointiv Extension

TypeScript/WASM template for Pointiv. Greets by name, keeps a run counter, and includes small demos for HTTP, Calendar, and Gmail, plus a todo list rendered as a popup tile.

## Install

Paste your GitHub URL in Pointiv Extensions:

```
https://github.com/<your-username>/<your-repo>
```

## Build

Needs Node.js, [extism-js](https://github.com/extism/js-pdk), and Binaryen (`wasm-opt` on PATH).

```sh
curl -O https://raw.githubusercontent.com/extism/js-pdk/main/install.sh
bash install.sh
brew install binaryen
./build.sh
```

`./build.sh` writes `extension.wasm` to the repo root. Commit that file so Pointiv can load it from GitHub.

## Try the API demos

| Command | Permission | What happens |
|---------|------------|--------------|
| `http` | `network` | GET https://httpbin.org/get |
| `calendar` or `cal` | `google_calendar` | Create a test event |
| `gmail you@example.com` | `google_gmail` | Send mail |

Default: hello + run counter.

## Tiles

This starter renders a "Todos" tile beside the popup command bar. `execute` handles the todo commands and `render_tile` (in `src/index.ts`) turns the stored list into tile JSON.

| Command | What happens |
|---------|--------------|
| `todo add <text>` | Add an item to the list stored under the `todos` storage key |
| `todo done <n>` | Mark item `n` done (1-based, the numbering `todo list` prints) |
| `todo list` | List all items |

The tile shows up to 5 open items, each with a Done button, an open count badge, and a Refresh footer action.

The tile is declared in `pointiv-extension.json`:

```json
"tiles": { "height": 2, "zone": "right", "order": 1 }
```

The host calls `render_tile` when the popup opens and after a tile action runs, with a 3 second budget and storage-only host access. Tile buttons run their command through the normal `execute` function. Iterate with the playground in Pointiv Settings, Tiles: paste tile JSON for instant validation and preview, or live-render this extension's tile after installing it. Full schema, limits, and the component catalog are in TILES.md in the Pointiv repo.

## Fork

1. Edit `pointiv-extension.json` (`name`, `author`, `permissions`)
2. Edit `src/index.ts`
3. `./build.sh`, commit `extension.wasm`, push

SDK: [@katkode/pointiv-extension-sdk](https://www.npmjs.com/package/@katkode/pointiv-extension-sdk)

## Permissions

| Permission | Grants |
|------------|--------|
| `storage` | Key/value store |
| `network` | `http.get`, `http.post` |
| `google_calendar` | `googleCalendar.schedule` |
| `google_gmail` | `googleGmail.send` |
