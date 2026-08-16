import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { useContextValue } from "../context/AppContext";
import BuilderHeader from "../components/BuilderHeader";


const BuilderPage = () => {
    debugger
    const { id } = useParams();
    const navigate = useNavigate();
    const [publishing, setPublishing] = useState(false);
    const [leftTab, setLeftTab] = useState(false);
    const [publishUrl, setPublishUrl] = useState(null);
    const { activeProjects, loadingActiveProjects, activeFile, showCode, setActiveFile, setShowCode, loadProject, logout } = useContextValue();

    useEffect(() => {
        if (!id) return;

        loadProject({ id });
    }, [id]);

    useEffect(() => {
        if (!id || !activeProjects) return;
        if (activeProjects.status === "pending" || activeProjects.status === "genrating") {
            const interval = setInterval(() => {
                loadProject({ id, silent: true });
            }, 1500);
            return () => clearInterval(interval);
        }

    }, [id, loadProject, activeProjects]);
    const handleOpenPreview = () => {
        if (!id) return;
        window.open(setPublishUrl(`/preview/${id}`));

    }
    const onPublish = () => {

    }
    const handleDownload = () => {

    }

    if (loadingActiveProjects || !activeProjects) {
        return <Loading />
    }
    console.log("name", activeProjects)

    return (
        <>
            <div className=" h-screen  flex flex-col overflow-hidden bg-white text-zinc-900 relative">
                <BuilderHeader
                    projectName={activeProjects.name}
                    version={activeProjects.version}
                    showCode={showCode}
                    publishing={publishing}
                    onToggleShowCode={() => setShowCode(!showCode)}
                    onOpenPreview={handleOpenPreview}
                    onPublish={onPublish}
                    onDownload={handleDownload}
                    onBack={() => { navigate("/") }}
                    onLogout={logout}
                />

            </div></>
    );
}
export default BuilderPage;