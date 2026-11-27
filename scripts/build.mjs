// Builds the app bundle in www/ from src/game.html.
// src/game.html is the same file that is published as the browser preview, so it has no <html>/<head>
// of its own and loads its font from Google Fonts. For the app we wrap it in a full page and bundle the
// font locally, so the game works offline.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'fonts'), { recursive: true });

const fonts = [
  ['Chakra Petch', 500, '@fontsource/chakra-petch/files/chakra-petch-latin-500-normal.woff2'],
  ['Chakra Petch', 600, '@fontsource/chakra-petch/files/chakra-petch-latin-600-normal.woff2'],
  ['Chakra Petch', 700, '@fontsource/chakra-petch/files/chakra-petch-latin-700-normal.woff2'],
];
let fontCss = '';
for (const [family, weight, file] of fonts) {
  const name = file.split('/').pop();
  copyFileSync(join(root, 'node_modules', file), join(www, 'fonts', name));
  fontCss += `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:swap;src:url(fonts/${name}) format('woff2');}\n`;
}

let game = readFileSync(join(root, 'src', 'game.html'), 'utf8');
const before = game.length;
game = game
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, '')
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, '');
if (game.includes('fonts.googleapis.com') || game.length === before) throw new Error('Font links not found in src/game.html');

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#0b0f12">
<style>
${fontCss}:root{color-scheme:only dark;}
body{margin:0;font:14px system-ui,sans-serif;}
[hidden]{display:none!important;}
</style>
</head>
<body>
${game}
</body>
</html>
`;
writeFileSync(join(www, 'index.html'), page);
console.log(`Built www/index.html (${(page.length / 1024).toFixed(1)} KB) with ${fonts.length} bundled fonts.`);
