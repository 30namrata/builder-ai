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

    const isLimitError = projects?.status === "failed" || (projects?.error && /limit|rate limit|quota|429|free-models/i.test(projects.error));

    if (isLimitError) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
                <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-zinc-200 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 text-2xl border border-amber-100">
                        ⏳
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">API Daily Limit Exceeded</h2>
                    <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                        You have reached your daily free AI generation quota. You can try generating again tomorrow or add credits to your OpenRouter API key.
                    </p>
                    <div className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 font-mono mb-6 overflow-x-auto text-left">
                        {projects?.error || "Rate limit exceeded: free-models-per-day"}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm cursor-pointer"
                    >
                        Try Again Tomorrow
                    </button>
                </div>
            </div>
        );
    }

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