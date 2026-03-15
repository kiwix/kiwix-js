# Empty Catch Block Fix

Automated fix for empty catch blocks in Emscripten-generated WebAssembly files.

## Usage

### Manual Fix
```bash
npm run fix-catch-blocks
```

### Automatic (Build)
The fix runs automatically during production builds:
```bash
npm run build
```

## What It Fixes

- Empty catch blocks → `catch (err) { console.error("libzim error:", err); }`
- Silent early returns → `if (!ptr) { console.warn('libzim: early return (!ptr)'); return; }`

## Files

- `scripts/fix-empty-catch-blocks.js` - Standalone fix script
- `rollup-plugin-fix-empty-catch.js` - Rollup plugin for builds
