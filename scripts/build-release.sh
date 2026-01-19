#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$ROOT_DIR/packages/cli"
WEBAPP_DIR="$ROOT_DIR/packages/webapp"

echo "Building Trekker release..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf "$CLI_DIR/dist"
rm -rf "$CLI_DIR/webapp-dist"
rm -rf "$WEBAPP_DIR/.next"

# Build webapp
echo "Building webapp..."
cd "$WEBAPP_DIR"
bun run build

# Build CLI
echo "Building CLI..."
cd "$CLI_DIR"
bun run build

# Copy webapp standalone to CLI
echo "Bundling webapp into CLI..."
mkdir -p "$CLI_DIR/webapp-dist"

# Copy standalone server files
cp -r "$WEBAPP_DIR/.next/standalone/"* "$CLI_DIR/webapp-dist/"

# Copy static assets
mkdir -p "$CLI_DIR/webapp-dist/.next/static"
cp -r "$WEBAPP_DIR/.next/static/"* "$CLI_DIR/webapp-dist/.next/static/"

# Copy public folder if exists
if [ -d "$WEBAPP_DIR/public" ]; then
  cp -r "$WEBAPP_DIR/public" "$CLI_DIR/webapp-dist/"
fi

echo "Release build complete!"
echo ""
echo "Output:"
echo "  CLI:    $CLI_DIR/dist/"
echo "  Webapp: $CLI_DIR/webapp-dist/"
echo ""
echo "To publish: cd packages/cli && npm publish"
