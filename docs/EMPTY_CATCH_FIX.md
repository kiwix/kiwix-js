# Empty Catch Block Fix - Documentation

## Overview

This document describes the automated fix for empty catch blocks in Emscripten-generated WebAssembly files (libzim).

## Problem Statement

The libzim WebAssembly files (`libzim-wasm.js`, `libzim-asm.js`) are compiled from C++ source using Emscripten. During compilation, error handling is often stripped or minimized, resulting in:

- Empty catch blocks that silently swallow errors
- Silent early returns without logging
- Impossible-to-debug failures when reading ZIM archives

## Solution

We've implemented a **two-pronged approach**:

### 1. Build-Time Fix (Automatic)

A custom Rollup plugin (`rollup-plugin-fix-empty-catch.js`) that automatically fixes empty catch blocks during production builds.

**When it runs:**
- Only during production builds (`npm run build` or `npm run build-min`)
- Automatically applied, no manual intervention needed

**What it fixes:**
- Empty catch blocks → Adds console.error logging
- Silent early returns → Adds console.warn with context

**Example transformation:**
```javascript
// BEFORE (problematic):
if (!ptr) return;

// AFTER (fixed):
if (!ptr) { console.warn('libzim: early return (!ptr)'); return; }
```

```javascript
// BEFORE (problematic):
try { riskyOperation(); } catch (err) {}

// AFTER (fixed):
try { riskyOperation(); } catch (err) { console.error("libzim: silent error caught:", err); }
```

### 2. Manual Fix Script (On-Demand)

A standalone script (`scripts/fix-empty-catch-blocks.js`) for manual fixing.

**When to use:**
- Testing the fix without a full build
- Fixing files in development environment
- One-off fixes for specific files

**How to run:**
```bash
npm run fix-catch-blocks
```

Or directly:
```bash
node scripts/fix-empty-catch-blocks.js
```

## Files Modified

### Created Files:
1. `scripts/fix-empty-catch-blocks.js` - Standalone fix script
2. `rollup-plugin-fix-empty-catch.js` - Rollup plugin
3. `docs/EMPTY_CATCH_FIX.md` - This documentation

### Modified Files:
1. `rollup.config.js` - Integrated the fix plugin
2. `package.json` - Added `fix-catch-blocks` script

## Patterns Fixed

The fix targets these problematic patterns:

### Pattern 1: Empty Catch Blocks
```javascript
// Bad
catch (err) {}

// Good
catch (err) { console.error("libzim: silent error caught:", err); }
```

### Pattern 2: Silent Null Pointer Checks
```javascript
// Bad
if (!ptr) return;

// Good  
if (!ptr) { console.warn('libzim: early return (!ptr)'); return; }
```

### Pattern 3: Silent Abort Checks
```javascript
// Bad
if (ABORT) return;

// Good
if (ABORT) { console.warn('libzim: early return (ABORT)'); return; }
```

### Pattern 4: Silent Handled Operations
```javascript
// Bad
if (handled) return;

// Good
if (handled) { console.warn('libzim: early return (handled)'); return; }
```

### Pattern 5: Silent Filesystem Errors
```javascript
// Bad
if (FS.ErrnoError) return;

// Good
if (FS.ErrnoError) { console.warn('libzim: early return (FS.ErrnoError)'); return; }
```

## Testing

After applying the fix, test with:

1. **Load a valid ZIM archive**
   ```
   - Open app
   - Select a known-good ZIM file
   - Verify articles load correctly
   - Check browser console for warnings
   ```

2. **Load a corrupted ZIM archive**
   ```
   - Open app
   - Select a corrupted/malformed ZIM
   - Verify error messages appear in console
   - Verify user sees appropriate error UI
   ```

3. **Search functionality**
   ```
   - Perform searches in multiple archives
   - Verify search results appear
   - Check console for any libzim warnings
   ```

## Expected Console Output

After the fix, you should see informative messages like:

```
libzim: early return (!ptr)
libzim: silent error caught: Error: Cluster not found
libzim: early return (ABORT)
```

Instead of complete silence when errors occur.

## Performance Impact

**Minimal to none:**
- Console logging only occurs when errors happen
- No additional overhead for successful operations
- Logging is asynchronous and non-blocking

## Security Considerations

The fix **improves** security by:
- Making malicious ZIM files easier to detect
- Providing audit trail of errors
- Helping identify attack patterns

No sensitive data is logged - only error conditions and internal state flags.

## Limitations

1. **Doesn't fix root cause** - Only adds visibility, doesn't prevent errors
2. **Generated files only** - Doesn't fix the C++ source or Emscripten config
3. **May log frequently** - If errors are common, console may be noisy

## Future Improvements

Potential enhancements:

1. **Fix at source** - Modify Emscripten compilation settings
2. **Better error messages** - Include more context (file name, operation type)
3. **User-facing errors** - Translate technical errors to user-friendly messages
4. **Error reporting** - Optionally send error telemetry
5. **Granular control** - Enable/disable specific pattern fixes

## Troubleshooting

### Issue: Fix script doesn't find any files
**Solution:** Ensure you're running from project root and libzim files exist

### Issue: Build fails after adding plugin
**Solution:** The plugin only runs in production builds - check BUILD env var

### Issue: Too many console warnings
**Solution:** This indicates underlying problems in ZIM loading - investigate root causes

### Issue: Regex patterns don't match
**Solution:** Emscripten output format may change - update patterns as needed

## Related GitHub Issues

- Main issue: [Link to your newly created issue]
- Related: Silent failures in ZIM loading
- Related: Debugging difficulties with WebAssembly

## Contributing

If you find additional patterns that need fixing:

1. Identify the pattern in libzim files
2. Add regex pattern to `CATCH_BLOCK_PATTERNS` array
3. Test thoroughly
4. Submit PR with updated patterns

## License

Same as Kiwix JS project (GPL v3)

---

**Last Updated:** 2026-03-15  
**Author:** Kiwix JS Contributor  
**Version:** 1.0.0
