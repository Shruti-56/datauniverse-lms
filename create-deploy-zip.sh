#!/bin/bash
# Create a deployment-ready ZIP file for Hostinger
# PRE-BUILDS frontend and includes built files - ensures correct index.html/assets from first extract

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ZIP_NAME="datauniverse-lms-deploy.zip"
STAGING_DIR=".deploy-staging"

echo "=== DataUniverse - Creating Hostinger Deploy ZIP ==="
echo ""

# Step 1: Build frontend - produces correct index.html + assets (fixes MIME/blank screen)
# Try full build first; if it fails (e.g. no local DB), use frontend-only build
echo "Building frontend (required for correct deploy files)..."
if ! npm run build 2>/dev/null; then
  echo "Full build failed, trying frontend-only build..."
  npm run build:frontend || {
    echo "ERROR: Frontend build failed. Fix build errors before creating deploy ZIP."
    exit 1
  }
fi
echo ""

# Clean up previous run
rm -f "$ZIP_NAME"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

# Copy project - INCLUDE built files (index.html, assets/, backend/public/) - EXCLUDE source index.template
echo "Copying project files (including pre-built frontend)..."
rsync -a \
  --exclude='node_modules/' \
  --exclude='backend/node_modules/' \
  --exclude='.env' \
  --exclude='backend/.env' \
  --exclude='.env.*' \
  --exclude='.git/' \
  --exclude='dist/' \
  --exclude='backend/dist/' \
  --exclude='index.template.html' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='.vscode/' \
  --exclude='.idea/' \
  --exclude='bun.lockb' \
  --exclude='create-deploy-zip.sh' \
  --exclude='datauniverse-lms-deploy.zip' \
  --exclude='.deploy-staging/' \
  --exclude='supabase/' \
  --exclude='.cursor/' \
  --exclude='PRE_DEPLOY_CHECKLIST.md' \
  --exclude='PRODUCTION_FIX.md' \
  --exclude='DEPLOY.md' \
  --exclude='QUICKSTART.md' \
  --exclude='START_APP.md' \
  --exclude='setup.sh' \
  . "$STAGING_DIR/"

# Ensure .htaccess exists (fixes MIME types when Hostinger Apache serves static files)
if [ -f ".htaccess" ]; then
  cp .htaccess "$STAGING_DIR/"
  echo "Included .htaccess (MIME type fix for Hostinger)"
fi

# Fix: Put built index.html + assets at ROOT so Apache (if it serves root) serves correct files
# Hostinger may serve root before Node; root index.html had /src/main.tsx (dev) -> MIME/text/plain error
if [ -f "$STAGING_DIR/backend/public/index.html" ] && [ -d "$STAGING_DIR/backend/public/assets" ]; then
  cp "$STAGING_DIR/backend/public/index.html" "$STAGING_DIR/index.html"
  rm -rf "$STAGING_DIR/assets" 2>/dev/null || true
  cp -r "$STAGING_DIR/backend/public/assets" "$STAGING_DIR/"
  echo "Copied built index.html + assets to root (fixes MIME/blank screen when Apache serves root)"
fi

# Create ZIP
echo "Creating ZIP archive..."
(cd "$STAGING_DIR" && zip -rq "../$ZIP_NAME" . -x "*.DS_Store")

# Cleanup
rm -rf "$STAGING_DIR"

SIZE=$(ls -lh "$ZIP_NAME" | awk '{print $5}')
echo ""
echo "=== Done! ==="
echo "ZIP file: $SCRIPT_DIR/$ZIP_NAME"
echo "Size: $SIZE"
echo ""
echo "Next: Upload to Hostinger → Set build/start commands → Add env vars"
echo "See DEPLOY_ZIP_HOSTINGER.md for full instructions."
