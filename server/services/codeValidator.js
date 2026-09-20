// Post-generation code validator and auto-fixer
// Repairs common AI code generation errors before saving to DB using regex checks

// Void HTML elements that must be self-closed in JSX
const VOID_ELEMENTS = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];

// Validate and auto-fix common AI-generated code issues
export function validateAndFixCode(code, filePath, context) {
    const warnings = [];
    const isCSS = filePath.endsWith(".css");
    const isJS = filePath.endsWith(".js") || filePath.endsWith(".jsx");

    // 1. Strip markdown code fences that some models wrap around code
    const fencePattern = /^```(?:jsx?|javascript|css|html|tsx?|react)?\s*\n([\s\S]*?)\n```\s*$/;
    const fenceMatch = code.match(fencePattern);
    if (fenceMatch) {
        code = fenceMatch[1];
        warnings.push(`${filePath}: Stripped markdown code fences`);
    }

    // Also handle cases where fences appear at the very start/end with other content
    code = code.replace(/^```(?:jsx?|javascript|css|html|tsx?|react)?\s*\n/, "");
    code = code.replace(/\n```\s*$/, "");

    if (isCSS) {
        // CSS-specific fixes — minimal, just trim and return
        return { code: code.trim() + "\n", warnings };
    }

    if (!isJS) {
        return { code, warnings };
    }

    // --- JS/JSX-specific fixes ---

    // 2. Fix `class=` → `className=` in JSX (but not inside strings or comments)
    // Match class= that appears inside JSX tags (after < and before >)
    const classFixRegex = /(<[a-zA-Z][^>]*?)\bclass=/g;
    if (classFixRegex.test(code)) {
        code = code.replace(/(<[a-zA-Z][^>]*?)\bclass=/g, "$1className=");
        warnings.push(`${filePath}: Fixed 'class=' → 'className='`);
    }

    // 3. Fix `for=` → `htmlFor=` in JSX labels
    const forFixRegex = /(<label[^>]*?)\bfor=/gi;
    if (forFixRegex.test(code)) {
        code = code.replace(/(<label[^>]*?)\bfor=/gi, "$1htmlFor=");
        warnings.push(`${filePath}: Fixed 'for=' → 'htmlFor='`);
    }

    // 3b. Fix single-quoted JSX attributes containing escaped apostrophes (e.g. placeholder='Hello, I\'d...') -> placeholder="Hello, I'd..."
    const jsxEscapedQuoteRegex = /([a-zA-Z0-9_-]+)=['"]([^'"]*?\\'[^'"]*?)['"]/g;
    if (jsxEscapedQuoteRegex.test(code)) {
        code = code.replace(/([a-zA-Z0-9_-]+)=['"]([^'"]*?\\'[^'"]*?)['"]/g, (match, attr, val) => {
            const cleanVal = val.replace(/\\'/g, "'").replace(/''/g, "'");
            warnings.push(`${filePath}: Fixed single-quoted JSX attribute '${attr}' containing apostrophe`);
            return `${attr}="${cleanVal}"`;
        });
    }

    // 4. Self-close void elements safely without corrupting JSX expressions/arrow functions
    code = selfCloseVoidTags(code, warnings, filePath);

    // 5. Ensure exactly one default export exists
    const defaultExportCount = (code.match(/export\s+default\s+/g) || []).length;
    if (defaultExportCount === 0 && !filePath.endsWith(".css")) {
        // Try to find the main function/component and add default export
        const funcMatch = code.match(/^function\s+([A-Z]\w*)\s*\(/m);
        const constMatch = code.match(/^const\s+([A-Z]\w*)\s*=\s*(?:\(|function)/m);
        const componentName = funcMatch?.[1] || constMatch?.[1];

        if (componentName) {
            // Check if there's already a named export
            const namedExportRegex = new RegExp(`export\\s+(function|const)\\s+${componentName}`);
            if (namedExportRegex.test(code)) {
                // Convert `export function X` → `export default function X`
                code = code.replace(new RegExp(`export\\s+(function|const)\\s+${componentName}`), `export default $1 ${componentName}`);
            } else {
                // Add default export at the end
                code = code.trimEnd() + `\n\nexport default ${componentName};\n`;
            }
            warnings.push(`${filePath}: Added missing default export for '${componentName}'`);
        }
    }

    // 6. Remove stray HTML comments inside JSX return blocks
    // Pattern: <!-- comment --> which is invalid in JSX
    const htmlCommentRegex = /<!--[\s\S]*?-->/g;
    if (htmlCommentRegex.test(code)) {
        code = code.replace(htmlCommentRegex, "");
        warnings.push(`${filePath}: Removed HTML comments (invalid in JSX)`);
    }

    // 7. Fix common TypeScript syntax that slips in
    // Remove `: React.FC` or `: FC` type annotations from function declarations
    code = code.replace(/:\s*React\.FC(?:<[^>]*>)?\s*=/g, (match) => {
        warnings.push(`${filePath}: Removed TypeScript React.FC annotation`);
        return " =";
    });

    // Remove simple type annotations from function parameters like (props: any)
    // But be careful not to break destructured defaults like { name = 'default' }
    code = code.replace(/(\([^)]*?)\s*:\s*(?:string|number|boolean|any|object|void)\s*([,)])/g, (match, before, after) => {
        warnings.push(`${filePath}: Removed TypeScript type annotation`);
        return `${before}${after}`;
    });

    // 8. Ensure React import exists if JSX is used
    const hasJSX = /<[A-Za-z]/.test(code);
    const hasReactImport = /import\s+React/.test(code);
    if (hasJSX && !hasReactImport) {
        code = `import React from 'react';\n${code}`;
        warnings.push(`${filePath}: Added missing React import`);
    }

    // 9. Fix import paths that point to incorrect folders/paths compared to what was planned
    if (context?.allPlannedFiles) {
        const fixResult = fixImportPaths(code, filePath, context.allPlannedFiles);
        code = fixResult.code;
        warnings.push(...fixResult.warnings);
    }

    return { code: code.trim() + "\n", warnings };
}

// Validate and fix code specifically for revision operations
export function validateRevisionContent(content, filePath, op) {
    if (op === "delete") return { content, warnings: [] };

    if (op === "create") {
        const result = validateAndFixCode(content, filePath);
        return { content: result.code, warnings: result.warnings };
    }

    // For update ops (search/replace content), only apply safe fixes
    // that won't break the partial context
    const warnings = [];

    // Fix class → className
    const classFixRegex = /(<[a-zA-Z][^>]*?)\bclass=/g;
    if (classFixRegex.test(content)) {
        content = content.replace(/(<[a-zA-Z][^>]*?)\bclass=/g, "$1className=");
        warnings.push(`${filePath}: Fixed 'class=' → 'className=' in replacement`);
    }

    // Fix for → htmlFor
    const forFixRegex = /(<label[^>]*?)\bfor=/gi;
    if (forFixRegex.test(content)) {
        content = content.replace(/(<label[^>]*?)\bfor=/gi, "$1htmlFor=");
        warnings.push(`${filePath}: Fixed 'for=' → 'htmlFor=' in replacement`);
    }

    // Self-close void elements safely
    content = selfCloseVoidTags(content, warnings, filePath);

    return { content, warnings };
}

// Safely self-close void HTML tags without corrupting JSX expressions (like arrow functions =>)
function selfCloseVoidTags(code, warnings, filePath) {
    if (!code) return code;
    let modified = false;
    for (const tag of VOID_ELEMENTS) {
        const startRegex = new RegExp(`<${tag}\\b`, "gi");
        let match;
        let result = "";
        let lastIndex = 0;

        while ((match = startRegex.exec(code)) !== null) {
            const tagStart = match.index;
            result += code.slice(lastIndex, tagStart);

            let i = tagStart + match[0].length;
            let inSingleQuote = false;
            let inDoubleQuote = false;
            let inTemplate = false;
            let braceDepth = 0;
            let closed = false;
            let isSelfClosed = false;

            while (i < code.length) {
                const char = code[i];
                const prevChar = i > 0 ? code[i - 1] : "";

                if (inSingleQuote) {
                    if (char === "'" && prevChar !== "\\") inSingleQuote = false;
                } else if (inDoubleQuote) {
                    if (char === '"' && prevChar !== "\\") inDoubleQuote = false;
                } else if (inTemplate) {
                    if (char === "`" && prevChar !== "\\") inTemplate = false;
                } else if (char === "{") {
                    braceDepth++;
                } else if (char === "}") {
                    if (braceDepth > 0) braceDepth--;
                } else if (braceDepth === 0) {
                    if (char === "'") inSingleQuote = true;
                    else if (char === '"') inDoubleQuote = true;
                    else if (char === "`") inTemplate = true;
                    else if (char === ">") {
                        if (prevChar === "/") {
                            isSelfClosed = true;
                        }
                        closed = true;
                        i++;
                        break;
                    }
                }
                i++;
            }

            if (closed) {
                const tagContent = code.slice(tagStart, i);
                if (isSelfClosed) {
                    result += tagContent;
                } else {
                    result += tagContent.slice(0, -1).trimEnd() + " />";
                    modified = true;
                }
                lastIndex = i;
                startRegex.lastIndex = i;
            } else {
                result += code.slice(tagStart, i);
                lastIndex = i;
            }
        }
        result += code.slice(lastIndex);
        code = result;
    }

    if (modified && warnings && filePath) {
        warnings.push(`${filePath}: Self-closed void elements`);
    }
    return code;
}

// --- Import Path Resolution Helpers ---

function getDir(p) {
    const parts = p.split("/");
    parts.pop();
    return parts.join("/") || "/";
}

function resolvePath(baseDir, relativePath) {
    const baseParts = baseDir.split("/").filter(Boolean);
    const relParts = relativePath.split("/").filter(Boolean);

    for (const part of relParts) {
        if (part === ".") {
            continue;
        } else if (part === "..") {
            baseParts.pop();
        } else {
            baseParts.push(part);
        }
    }
    return "/" + baseParts.join("/");
}

function getRelativePath(fromDir, toPath) {
    const fromParts = fromDir.split("/").filter(Boolean);
    const toParts = toPath.split("/").filter(Boolean);

    let commonLength = 0;
    while (commonLength < fromParts.length && commonLength < toParts.length && fromParts[commonLength] === toParts[commonLength]) {
        commonLength++;
    }

    const upCount = fromParts.length - commonLength;
    const remainingTo = toParts.slice(commonLength);

    const relParts = [];
    for (let i = 0; i < upCount; i++) {
        relParts.push("..");
    }
    if (relParts.length === 0) {
        relParts.push(".");
    }
    relParts.push(...remainingTo);
    return relParts.join("/");
}

function cleanExtension(p) {
    return p.replace(/\.(js|jsx|css|ts|tsx)$/, "");
}

function fixImportPaths(code, filePath, allPlannedFiles) {
    const warnings = [];
    if (!allPlannedFiles || allPlannedFiles.length === 0) {
        return { code, warnings };
    }

    const currentDir = getDir(filePath);
    const plannedPaths = allPlannedFiles.map((f) => (f.path.startsWith("/") ? f.path : "/" + f.path));

    // Matches lines like: import Header from './components/Header';
    // or import '../styles.css'; or require('./components/Header')
    const importRegex = /(from\s+['"]|import\s+['"])([^'"]+)(['"])/g;

    const newCode = code.replace(importRegex, (match, prefix, importTarget, suffix) => {
        // Skip absolute imports (non-relative packages like 'react')
        if (!importTarget.startsWith(".")) {
            return match;
        }

        // 1. Resolve relative import target path
        const resolvedTarget = resolvePath(currentDir, importTarget);
        const resolvedClean = cleanExtension(resolvedTarget);

        // Check if it already matches a planned file path exactly (with or without extension)
        const exactExists = plannedPaths.some((p) => cleanExtension(p) === resolvedClean);
        if (exactExists) {
            return match;
        }

        // 2. Mismatch! Try to find a planned file with the same filename
        const importFilename = resolvedClean.split("/").pop();
        if (!importFilename) {
            return match;
        }

        const foundPlannedPath = plannedPaths.find((p) => {
            const plannedClean = cleanExtension(p);
            const plannedFilename = plannedClean.split("/").pop();
            return plannedFilename === importFilename;
        });

        if (foundPlannedPath) {
            // Calculate relative path from current directory to actual planned file path
            const newRelative = getRelativePath(currentDir, foundPlannedPath);
            // Prefix relative prefix if missing
            const finalRelative = newRelative.startsWith(".") ? newRelative : "./" + newRelative;

            // Retain file extension if the original import target had it
            const hasExt = /\.(js|jsx|css|ts|tsx)$/.test(importTarget);
            const ext = hasExt ? "." + importTarget.split(".").pop() : "";

            const rewrittenTarget = cleanExtension(finalRelative) + ext;
            if (rewrittenTarget !== importTarget) {
                warnings.push(
                    `${filePath}: Corrected import '${importTarget}' to '${rewrittenTarget}' (file planned at '${foundPlannedPath}')`,
                );
                return `${prefix}${rewrittenTarget}${suffix}`;
            }
        }

        return match;
    });

    return { code: newCode, warnings };
}
