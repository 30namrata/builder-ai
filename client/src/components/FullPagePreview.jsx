import { useMemo, useState } from "react";
import { useContextValue } from "../context/AppContext";
import { detectDependencies, prepareSandpackFiles } from "../utils/sandpackUtils";
import SandPackErrorMonitor from "./SandpackErrorMonitor";
import { SandpackLayout, SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

function FullPagePreview({ files }) {
    const [showerrorOverlay, setErrorOverlay] = useState(false);

    const { projects, activeFile, updateProjectFiles } = useContextValue();
    const sandPackFiles = useMemo(() => {
        return prepareSandpackFiles(files);
    }, [files]);

    // Detect dependencies
    const dependencies = useMemo(() => {
        if (!files) return;
        return detectDependencies(files || {});
    }, [files]);
    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-white">
            <SandpackProvider
                key={projects?._id || "default"}
                files={sandPackFiles}
                customSetup={dependencies ? { dependencies } : undefined}
                template="react"
                options={{
                    externalResources: [
                        "https://cdn.tailwindcss.com",
                        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    ],
                    logLevel: 0,
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <SandPackErrorMonitor onErrorcChange={setErrorOverlay} />
                <SandpackLayout
                    style={{
                        height: "100%",
                        border: "none",
                        borderRadius: "0",
                        backgroundColor: "transparent"
                    }}
                >
                    <SandpackPreview
                        showNavigator={false}
                        showRefreshButton={false}
                        showOpenInCodeSandbox={false}
                        showSandpackErrorOverlay={showerrorOverlay}
                        style={{ flex: 1, height: "100%", minWidth: "0" }}
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
export default FullPagePreview;