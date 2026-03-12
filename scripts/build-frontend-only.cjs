#!/usr/bin/env node
/**
 * Frontend-only build - for creating deploy ZIP when full build fails (e.g. no local DB).
 * Runs Vite and copies to backend/public + root. No Prisma or backend compile.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

const indexHtml = path.join(rootDir, 'index.html');
const indexTemplate = path.join(rootDir, 'index.template.html');
if (!fs.existsSync(indexHtml) && fs.existsSync(indexTemplate)) {
  fs.copyFileSync(indexTemplate, indexHtml);
  console.log('Created index.html from index.template.html');
}

function run(cmd, cwd = rootDir) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

run('npx vite build');

const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(backendDir, 'public');
if (fs.existsSync(distDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.cpSync(distDir, publicDir, { recursive: true });
  // Do NOT overwrite root index.html - it must stay as dev entry (/src/main.tsx)
  // Only backend/public gets the built index.html for production serve
  const assetsSrc = path.join(distDir, 'assets');
  const assetsRoot = path.join(rootDir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.rmSync(assetsRoot, { recursive: true, force: true });
    fs.cpSync(assetsSrc, assetsRoot, { recursive: true });
  }
  console.log('Frontend build complete. Copied to backend/public (root index.html unchanged for dev).');
}
