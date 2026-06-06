# Hello World Pointiv Extension

TypeScript/WASM template for Pointiv. Greets by name, keeps a run counter, and includes small demos for HTTP, Calendar, and Gmail.

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
