#!/usr/bin/env node

/**
 * fix-empty-catch-blocks.js
 * 
 * Post-processing script to add error logging to empty catch blocks
 * in Emscripten-generated WebAssembly files (libzim-wasm.js, libzim-asm.js)
 * 
 * This script:
 * 1. Finds empty or minimal catch blocks
 * 2. Adds console.error logging with context
 * 3. Preserves the original behavior while making errors visible
 * 
 * Usage: node scripts/fix-empty-catch-blocks.js
 */

import { readFileSync, writeFileSync, statSync } from 'fs';

// Files to process
const FILES_TO_FIX = [
    'www/js/lib/libzim-wasm.dev.js',
    'www/js/lib/libzim-wasm.js',
    'www/js/lib/libzim-asm.dev.js',
    'www/js/lib/libzim-asm.js'
];

// Patterns that indicate problematic error handling
const PROBLEMATIC_PATTERNS = [
    // Pattern 1: if (condition) return; (silent failure)
    {
        pattern: /if\s*\(\s*(ABORT|!ptr|handled|FS\.ErrnoError|calledRun|!info)\s*\)\s*return\s*;?\s*$/gm,
        replacement: (match, condition) => {
            return `if (${condition}) { console.warn('libzim: early return due to ${condition}'); return; }`;
        }
    },
    
    // Pattern 2: Empty catch blocks
    {
        pattern: /catch\s*\([^)]+\)\s*\{\s*\}/g,
        replacement: 'catch (err) { console.error("libzim: silent error caught:", err); }'
    },
    
    // Pattern 3: Catch blocks with only comments
    {
        pattern: /catch\s*\(([^)]+)\)\s*\{\s*\/\/[^\n]*\n\s*\}/g,
        replacement: 'catch ($1) { console.error("libzim: error caught:", $1); }'
    },
    
    // Pattern 4: try-catch with empty or minimal handling
    {
        pattern: /try\s*\{([^}]+)\}\s*catch\s*\(([^)]+)\)\s*\{\s*\}/g,
        replacement: 'try {$1} catch ($2) { console.error("libzim error:", $2); throw $2; }'
    }
];

/**
 * Check if file exists
 */
function fileExists(filePath) {
    try {
        return statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

/**
 * Process a single file and fix empty catch blocks
 */
function processFile(filePath) {
    console.log(`\n📄 Processing: ${filePath}`);
    
    if (!fileExists(filePath)) {
        console.warn(`⚠️  File not found: ${filePath}`);
        console.warn('   This is expected for .dev files in production builds.');
        return false;
    }
    
    let content;
    try {
        content = readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`❌ Error reading file: ${err.message}`);
        return false;
    }
    
    const originalContent = content;
    let fixesApplied = 0;
    
    // Apply each pattern
    PROBLEMATIC_PATTERNS.forEach((fix, index) => {
        const matches = content.match(fix.pattern);
        if (matches && matches.length > 0) {
            console.log(`   Applying fix #${index + 1}: Found ${matches.length} instance(s)`);
            
            if (typeof fix.replacement === 'function') {
                content = content.replace(fix.pattern, fix.replacement);
            } else {
                content = content.replace(fix.pattern, fix.replacement);
            }
            
            fixesApplied += matches.length;
        }
    });
    
    // Write back if changes were made
    if (fixesApplied > 0) {
        try {
            writeFileSync(filePath, content, 'utf8');
            console.log(`   ✅ Successfully applied ${fixesApplied} fix(es)`);
            return true;
        } catch (err) {
            console.error(`❌ Error writing file: ${err.message}`);
            return false;
        }
    } else {
        console.log(`   ℹ️  No fixes needed (or patterns not found)`);
        return true;
    }
}

/**
 * Main function
 */
function main() {
    console.log('🔧 libzim Empty Catch Block Fixer');
    console.log('=================================\n');
    
    const results = {
        success: 0,
        failed: 0,
        skipped: 0
    };
    
    FILES_TO_FIX.forEach(filePath => {
        const result = processFile(filePath);
        
        if (result === true) {
            results.success++;
        } else if (result === false) {
            results.failed++;
        } else {
            results.skipped++;
        }
    });
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Success: ${results.success}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
    
    if (results.success > 0) {
        console.log('\n✨ Done! Empty catch blocks have been fixed.');
        console.log('   Please test thoroughly before deploying.');
        process.exit(0);
    } else {
        console.log('\n⚠️  No files were fixed.');
        console.log('   This may be normal if processing dev files in a production environment.');
        process.exit(0);
    }
}

// Run the script
main();
