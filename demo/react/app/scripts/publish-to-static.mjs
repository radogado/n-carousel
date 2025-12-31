import fs from 'node:fs';
import path from 'node:path';

const appDir = path.resolve(process.cwd());
const distDir = path.join(appDir, 'dist');
const staticDir = path.resolve(appDir, '..'); // demo/react

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Copy dist/index.html → demo/react/index.html
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(staticDir, 'index.html'));

// Copy dist/assets/* → demo/react/assets/*
copyDir(path.join(distDir, 'assets'), path.join(staticDir, 'assets'));

console.log('Published React demo to demo/react/index.html');


