import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  bundle: true,
  sourcemap: true,
  minify: false,
  format: "cjs",
  target: ["es2020"],
  platform: "neutral",
});
