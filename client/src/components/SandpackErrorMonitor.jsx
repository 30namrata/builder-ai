import { useSandpack } from "@codesandbox/sandpack-react"
import { useEffect } from "react"

const SandPackErrorMonitor = ({ onErrorcChange }) => {
    const { sandpack } = useSandpack()
    const { error } = sandpack
    useEffect(() => {
        console.log("sandpack error", error);
        if (error) {
            const msg = error.message || "";
            const isNewtorkerror =
                msg.includes("fetch failed error") ||
                msg.includes("col.csbops,io") ||
                msg.includes("ERROR CONNECTION TIMEOUT ID") ||
                msg.includes("Failed to start server")
            if (isNewtorkerror) {
                if (typeof onErrorcChange === "function") onErrorcChange(false);
                return;
            }
        }
        if (typeof onErrorcChange === "function") onErrorcChange(true);

    }, [error, onErrorcChange]);

    return null

}
export default SandPackErrorMonitor;
