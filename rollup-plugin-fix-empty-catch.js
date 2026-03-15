/**
 * rollup-plugin-fix-empty-catch.js
 * 
 * Custom Rollup plugin to fix empty catch blocks in libzim files
 * during the build process
 */

import { readFileSync, writeFileSync } from 'fs';

// Patterns to fix
const CATCH_BLOCK_PATTERNS = [
    // Pattern 1: Empty catch blocks
    {
        regex: /catch\s*\([^)]+\)\s*\{\s*\}/g,
        replacement: 'catch (err) { console.error("libzim: silent error caught:", err); }'
    },
    
    // Pattern 2: Silent early returns  
    {
        regex: /if\s*\(\s*(!?ptr|ABORT|handled|FS\.ErrnoError|calledRun)\s*\)\s*return\s*;?/g,
        replacement: (match, condition) => {
            return `if (${condition}) { console.warn('libzim: early return (${condition})'); return; }`;
        }
    }
];

export default function fixEmptyCatch() {
    return {
        name: 'fix-empty-catch',
        
        // Run after bundle is generated
        async generateBundle(options, bundle) {
            console.log('\n🔧 Applying empty catch block fixes...');
            
            // Process each file in the bundle
            for (const fileName in bundle) {
                const chunk = bundle[fileName];
                
                // Only process JS files that contain libzim code
                if (fileName.endsWith('.js') && chunk.code && 
                    (fileName.includes('libzim') || chunk.code.includes('libzim'))) {
                    
                    let fixedCode = chunk.code;
                    let fixesCount = 0;
                    
                    // Apply each pattern
                    CATCH_BLOCK_PATTERNS.forEach((pattern, idx) => {
                        const matches = fixedCode.match(pattern.regex);
                        if (matches) {
                            console.log(`   - Fixing ${matches.length} instance(s) of pattern #${idx + 1} in ${fileName}`);
                            
                            if (typeof pattern.replacement === 'function') {
                                fixedCode = fixedCode.replace(pattern.regex, pattern.replacement);
                            } else {
                                fixedCode = fixedCode.replace(pattern.regex, pattern.replacement);
                            }
                            
                            fixesCount += matches.length;
                        }
                    });
                    
                    if (fixesCount > 0) {
                        console.log(`   ✅ Applied ${fixesCount} fix(es) to ${fileName}`);
                        chunk.code = fixedCode;
                    }
                }
            }
            
            console.log('✨ Empty catch block fixes complete!\n');
        }
    };
}
