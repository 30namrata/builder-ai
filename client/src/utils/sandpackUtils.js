// Scans source files to detect npm dependencies from import statements
export function detectDependencies(files) {
    const deps = {};
    if (!files) return deps;

    const allCode = Object.values(files).join("\n");
    const filePaths = Object.keys(files);

    const isLocalFileOrFolder = (pkgName) => {
        const name = pkgName.startsWith("@/") ? pkgName.substring(2) : pkgName;
        return (
            pkgName.startsWith("@/") ||
            pkgName === "@" ||
            filePaths.some(p =>
                p === `/${name}` ||
                p.startsWith(`/${name}/`) ||
                p.replace(/\.[^/.]+$/, "") === `/${name}`
            )
        );
    };

    const importRegex = /from\s+['"]([^./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(allCode)) !== null) {
        const rawImport = match[1];

        // Scoped packages like @scope/package, normal packages like package
        const pkg = rawImport.startsWith("@") && !rawImport.startsWith("@/")
            ? rawImport.split("/").slice(0, 2).join("/")
            : rawImport.split("/")[0];

        // Skip react (included in template), react-dom, and local modules
        if (pkg !== "react" && pkg !== "react-dom" && !isLocalFileOrFolder(pkg)) {
            deps[pkg] = "latest";
        }
    }
    return deps;
}

// Prepares and sanitizes Sandpack files, creating fallbacks for any missing relative imports
export function prepareSandpackFiles(liveFiles) {
    if (!liveFiles || typeof liveFiles !== "object") return undefined;

    const spFiles = {};

    // 1. Format all file paths with leading '/' and extract code strings
    for (const [path, content] of Object.entries(liveFiles)) {
        const fileCode = typeof content === "string" ? content : content?.content || content?.code || "";
        const formattedPath = path.startsWith("/") ? path : `/${path}`;
        spFiles[formattedPath] = fileCode;
    }

    if (Object.keys(spFiles).length === 0) return undefined;

    const getDir = (p) => {
        const parts = p.split("/").filter(Boolean);
        parts.pop();
        return "/" + parts.join("/");
    };

    const resolveRelPath = (baseDir, rel) => {
        const baseParts = baseDir.split("/").filter(Boolean);
        const relParts = rel.split("/").filter(Boolean);
        for (const part of relParts) {
            if (part === ".") continue;
            if (part === "..") baseParts.pop();
            else baseParts.push(part);
        }
        return "/" + baseParts.join("/");
    };

    // 2. Scan all JS/JSX files for relative imports and ensure targets exist
    const relativeImportRegex = /(?:from\s+['"]|import\s+['"])([^'"]+)(['"])/g;

    for (const [filePath, code] of Object.entries({ ...spFiles })) {
        if (filePath.endsWith(".css")) continue;

        const dir = getDir(filePath);
        let updatedCode = code;
        let match;
        relativeImportRegex.lastIndex = 0;

        while ((match = relativeImportRegex.exec(code)) !== null) {
            const rawRelImport = match[1];
            if (!rawRelImport.startsWith(".")) continue;

            // Fix sub-component ./styles.css -> ../styles.css if styles.css is at root
            if (rawRelImport === "./styles.css" && dir !== "/") {
                if (spFiles["/styles.css"] !== undefined) {
                    updatedCode = updatedCode.replace(/import\s+['"]\.\/styles\.css['"];?/g, "import '../styles.css';");
                    continue;
                }
            }

            const resolvedTarget = resolveRelPath(dir, rawRelImport);

            // Check possible file paths that match this import
            const possiblePaths = [
                resolvedTarget,
                resolvedTarget + ".js",
                resolvedTarget + ".jsx",
                resolvedTarget + ".ts",
                resolvedTarget + ".tsx",
                resolvedTarget + "/index.js",
                resolvedTarget + "/index.jsx",
            ];

            const exists = possiblePaths.some((p) => spFiles[p] !== undefined);

            if (!exists) {
                const targetFilename = resolvedTarget.split("/").pop();
                if (!targetFilename) continue;

                // Check fuzzy match (e.g. if resolvedTarget is /components/Skills, check if /components/SkillsSection.js exists)
                const targetClean = targetFilename.replace(/\.[^/.]+$/, "").toLowerCase();
                const fuzzyMatch = Object.keys(spFiles).find((p) => {
                    const fname = p.split("/").pop().replace(/\.[^/.]+$/, "").toLowerCase();
                    return fname === targetClean;
                });

                if (fuzzyMatch) {
                    continue;
                }

                // Target does not exist at all! Create a safe stub file to prevent Sandpack crash
                const isCss = rawRelImport.endsWith(".css");
                const stubPath = isCss
                    ? resolvedTarget
                    : (resolvedTarget.endsWith(".js") || resolvedTarget.endsWith(".jsx") ? resolvedTarget : resolvedTarget + ".js");

                if (isCss) {
                    spFiles[stubPath] = "/* Placeholder CSS */";
                } else {
                    const rawName = targetClean.replace(/[^a-zA-Z0-9]/g, "");
                    const compName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "Component";
                    spFiles[stubPath] = `import React from 'react';\n\nexport default function ${compName}() {\n  return (\n    <div className="p-4 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg my-2">\n      <p className="text-xs font-medium">${compName}</p>\n    </div>\n  );\n}\n`;
                }
            }
        }

        spFiles[filePath] = updatedCode;
    }

    return spFiles;
}
