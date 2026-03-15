import { readFileSync, writeFileSync } from 'fs';

const PATTERNS = [
    {
        regex: /catch\s*\([^)]+\)\s*\{\s*\}/g,
        replacement: 'catch (err) { console.error("libzim error:", err); }'
    },
    {
        regex: /if\s*\(\s*(!?ptr|ABORT|handled|FS\.ErrnoError|calledRun)\s*\)\s*return\s*;?/g,
        replacement: (match, condition) => `if (${condition}) { console.warn('libzim: early return (${condition})'); return; }`
    }
];

export default function fixEmptyCatch() {
    return {
        name: 'fix-empty-catch',
        
        async generateBundle(options, bundle) {
            console.log('Applying catch block fixes...');
            
            for (const fileName in bundle) {
                const chunk = bundle[fileName];
                
                if (fileName.endsWith('.js') && chunk.code && 
                    (fileName.includes('libzim') || chunk.code.includes('libzim'))) {
                    
                    let fixedCode = chunk.code;
                    let fixesCount = 0;
                    
                    PATTERNS.forEach((pattern, idx) => {
                        const matches = fixedCode.match(pattern.regex);
                        if (matches) {
                            console.log(`  Pattern ${idx + 1}: ${matches.length} in ${fileName}`);
                            fixedCode = typeof pattern.replacement === 'function' 
                                ? fixedCode.replace(pattern.regex, pattern.replacement)
                                : fixedCode.replace(pattern.regex, pattern.replacement);
                            fixesCount += matches.length;
                        }
                    });
                    
                    if (fixesCount > 0) {
                        console.log(`  Fixed ${fixesCount} issues in ${fileName}`);
                        chunk.code = fixedCode;
                    }
                }
            }
            
            console.log('Catch block fixes complete\n');
        }
    };
}
