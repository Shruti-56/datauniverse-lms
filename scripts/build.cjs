#!/usr/bin/env node
/**
 * Full deployment build - runs from project root with correct path resolution.
 * Ensures backend deps are installed before Prisma generate.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const prismaPath = path.join(backendDir, 'node_modules/prisma/build/index.js');

// Ensure index.html exists for Vite (deploy ZIP excludes it - we use template)
const indexHtml = path.join(rootDir, 'index.html');
const indexTemplate = path.join(rootDir, 'index.template.html');
if (!fs.existsSync(indexHtml) && fs.existsSync(indexTemplate)) {
  fs.copyFileSync(indexTemplate, indexHtml);
  console.log('Created index.html from index.template.html (deploy mode)');
}

function run(cmd, cwd = rootDir) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Install backend deps if prisma missing
if (!fs.existsSync(prismaPath)) {
  console.log('Installing backend dependencies...');
  run('npm install', backendDir);
}

// 2. Prisma generate (MUST run before backend build - generates @prisma/client)
run('node node_modules/prisma/build/index.js generate', backendDir);

// 3. Vite build (frontend)
run('npx vite build');

// 4. Copy dist to backend/public (Node serves from here in production)
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(backendDir, 'public');
if (fs.existsSync(distDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.cpSync(distDir, publicDir, { recursive: true });
  console.log('Copied dist to backend/public');
  // Do NOT overwrite root index.html - keep dev entry (/src/main.tsx) for npm run dev
}

// 5. Backend TypeScript build
run('npm run build', backendDir);

console.log('Build complete.');
