#!/usr/bin/env bash
set -euo pipefail

OUTPUT="extension.wasm"

if [[ "${1:-}" == "--check" ]]; then
  command -v npm >/dev/null || { echo "npm not found"; exit 1; }
  command -v extism-js >/dev/null || { echo "extism-js not found"; exit 1; }
  command -v wasm-opt >/dev/null || { echo "wasm-opt (binaryen) not found"; exit 1; }
  echo "Toolchain OK"
  exit 0
fi

npm install
npm run build

if [[ ! -f "$OUTPUT" ]]; then
  echo "Expected $OUTPUT after build"
  exit 1
fi

SIZE_KB=$(( $(wc -c < "$OUTPUT") / 1024 ))
SHA=$(shasum -a 256 "$OUTPUT" | awk '{print $1}')

echo ""
echo "Built $OUTPUT (${SIZE_KB} KB)"
echo "SHA-256: $SHA"
echo ""
echo "Next steps:"
echo "  git add $OUTPUT"
echo "  git commit -m 'build: update extension.wasm'"
echo "  git push"
