#!/usr/bin/env node

import { readFileSync, writeFileSync, statSync } from 'fs';

const FILES_TO_FIX = [
    'www/js/lib/libzim-wasm.dev.js',
    'www/js/lib/libzim-wasm.js',
    'www/js/lib/libzim-asm.dev.js',
    'www/js/lib/libzim-asm.js'
];

const PATTERNS = [
    {
        pattern: /if\s*\(\s*(ABORT|!ptr|handled|FS\.ErrnoError|calledRun|!info)\s*\)\s*return\s*;?\s*$/gm,
        replacement: (match, condition) => `if (${condition}) { console.warn('libzim: early return (${condition})'); return; }`
    },
    {
        pattern: /catch\s*\([^)]+\)\s*\{\s*\}/g,
        replacement: 'catch (err) { console.error("libzim error:", err); }'
    },
    {
        pattern: /catch\s*\(([^)]+)\)\s*\{\s*\/\/[^\n]*\n\s*\}/g,
        replacement: 'catch ($1) { console.error("libzim error:", $1); }'
    },
    {
        pattern: /try\s*\{([^}]+)\}\s*catch\s*\(([^)]+)\)\s*\{\s*\}/g,
        replacement: 'try {$1} catch ($2) { console.error("libzim error:", $2); throw $2; }'
    }
];

function fileExists(filePath) {
    try {
        return statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    
    if (!fileExists(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return false;
    }
    
    let content;
    try {
        content = readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`Error reading file: ${err.message}`);
        return false;
    }
    
    let fixesApplied = 0;
    
    PATTERNS.forEach((pattern, index) => {
        const matches = content.match(pattern.pattern);
        if (matches && matches.length > 0) {
            console.log(`  Pattern ${index + 1}: ${matches.length} instances`);
            content = typeof pattern.replacement === 'function' 
                ? content.replace(pattern.pattern, pattern.replacement)
                : content.replace(pattern.pattern, pattern.replacement);
            fixesApplied += matches.length;
        }
    });
    
    if (fixesApplied > 0) {
        try {
            writeFileSync(filePath, content, 'utf8');
            console.log(`  Applied ${fixesApplied} fixes\n`);
            return true;
        } catch (err) {
            console.error(`Error writing file: ${err.message}`);
            return false;
        }
    }
    
    console.log(`  No fixes needed\n`);
    return true;
}

function main() {
    console.log('Fixing empty catch blocks in libzim files\n');
    
    let successCount = 0;
    
    FILES_TO_FIX.forEach(filePath => {
        if (processFile(filePath)) successCount++;
    });
    
    console.log(`Complete: ${successCount}/${FILES_TO_FIX.length} files processed`);
}

main();
