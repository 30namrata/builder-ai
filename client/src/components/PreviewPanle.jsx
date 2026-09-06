import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { detectDependencies, prepareSandpackFiles } from "../utils/sandpackUtils";
import { useContextValue } from "../context/AppContext";
import SandPackErrorMonitor from "./SandpackErrorMonitor";
import { useSandpack, SandpackCodeEditor, SandpackLayout, SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

function SandFileWatcher({ onLiveFilesChange }) {
    const { sandpack } = useSandpack();
    const { files, activeFile: sandpackActiveFile } = sandpack;
    const { activeProjects, updateProjectFiles, activeFile, setActiveFile } = useContextValue();
    const activeProjectRef = useRef(activeProjects);
    const activeFileRef = useRef(activeFile);
    const prevFilesRef = useRef(null);

    useEffect(() => {
        activeFileRef.current = activeFile;
    }, [activeFile]);

    useEffect(() => {
        if (sandpackActiveFile && sandpackActiveFile !== activeFileRef.current) {
            setActiveFile(sandpackActiveFile);
        }
    }, [sandpackActiveFile, setActiveFile]);

    useEffect(() => {
        activeProjectRef.current = activeProjects;
    }, [activeProjects]);


    useEffect(() => {
        if (!files) return;
        const updatedFiles = {};
        for (const [path, fileObj] of Object.entries(files)) {
            updatedFiles[path] = fileObj?.code || "";
        }

        if (prevFilesRef.current === null) {
            prevFilesRef.current = updatedFiles;
            return;
        }

        let hasChange = false;
        const prev = prevFilesRef.current;
        const currKeys = Object.keys(updatedFiles);
        const prevKeys = Object.keys(prev);

        if (currKeys.length !== prevKeys.length) {
            hasChange = true;
        } else {
            for (const path of currKeys) {
                if (prev[path] !== updatedFiles[path]) {
                    hasChange = true;
                    break;
                }
            }
        }

        if (hasChange) {
            prevFilesRef.current = updatedFiles;
            onLiveFilesChange(updatedFiles);

            const projects = activeProjectRef.current;
            if (projects?.files) {
                let backendHasChange = false;
                for (const [path, fileCode] of Object.entries(updatedFiles)) {
                    const originalContent = typeof projects.files[path] === "string"
                        ? projects.files[path]
                        : projects.files[path]?.content || "";
                    if (originalContent !== fileCode) {
                        backendHasChange = true;
                        break;
                    }
                }
                if (backendHasChange) {
                    updateProjectFiles(updatedFiles);
                }
            }
        }
    }, [files, updateProjectFiles, onLiveFilesChange]);

    return null;
}

const PreviewPanel = ({ projects, activeFile, showCode }) => {
    const [showerrorOverlay, setErrorOverlay] = useState(false);
    const [liveFiles, setLiveFiles] = useState(() => projects?.files || {});

    // Sync liveFiles when project changes
    useEffect(() => {
        if (projects?.files) {
            setLiveFiles(projects.files);
        }
    }, [projects?._id, projects?.version]);

    const onLiveFilesChanges = useCallback((newFiles) => {
        setLiveFiles(newFiles);
    }, []);

    // Convert liveFiles into sandpack files format with automatic import resolving and fallbacks
    const sandPackFiles = useMemo(() => {
        return prepareSandpackFiles(liveFiles);
    }, [liveFiles]);

    // Detect dependencies
    const dependencies = useMemo(() => {
        return detectDependencies(liveFiles || {});
    }, [liveFiles]);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <SandpackProvider
                key={projects?._id || "default"}
                files={sandPackFiles}
                customSetup={dependencies ? { dependencies } : undefined}
                template="react"
                options={{
                    activeFile: activeFile,
                    externalResources: [
                        "https://cdn.tailwindcss.com",
                        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    ],
                    classes: {
                        "sp-wrapper": "sp-wrapper",
                        "sp-layout": "sp-layout",
                        "sp-preview": "sp-preview"
                    }
                }}
                theme={{
                    colors: {
                        surface1: "#ffffff",
                        surface2: "#f4f4f5",
                        surface3: "#e4e4e7",
                        clickable: "#71717a",
                        base: "#09090b",
                        disabled: "#a1a1aa",
                        hover: "#18181b",
                        accent: "#18181b",
                        error: "#ef4444",
                        errorSurface: "#fef2f2",
                    },
                    font: {
                        body: '"Urbanist", system-ui, -apple-system, sans-serif',
                        mono: '"Geist Mono", ui-monospace, monospace',
                        size: "13px",
                        lineHeight: "1.6",
                    },
                }}
            >
                <SandFileWatcher onLiveFilesChange={onLiveFilesChanges} />
                <SandPackErrorMonitor onErrorcChange={setErrorOverlay} />
                <SandpackLayout style={{
                    height: "100%",
                    border: "none",
                    borderRadius: "0",
                    backgroundColor: "transparent"
                }}>
                    {showCode && (
                        <SandpackCodeEditor showTabs showInlineErrors showLineNumbers wrapContent style={{ height: "100%", minWidth: "0", flex: 1 }} />
                    )}
                    <SandpackPreview showNavigator={false} showRefreshButton showOpenInCodeSandbox={false} showSandpackErrorOverlay={showerrorOverlay} style={{ flex: showCode ? 1 : 2, height: "100%", minWidth: "0" }} />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
};

export default PreviewPanel;