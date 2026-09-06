import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { useContextValue } from "../context/AppContext";
import BuilderHeader from "../components/BuilderHeader";
import { FolderTreeIcon, MessageSquareIcon } from "lucide-react";
import ChatPanel from "../components/ChatPanel";
import FileExplorer from "../components/Fileexplorer";
import PreviewPanel from "../components/PreviewPanle";
import AgentProgressDashboard from "../components/AgentProgressDashboard";
import api from "../api/api";
import toast from "react-hot-toast";
import { exportProjectZip } from "../utils/exportProject";
import PublishModal from "../components/PublishModal";


const BuilderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [publishing, setPublishing] = useState(false);
    const [leftTab, setLeftTab] = useState('chat');
    const [publishUrl, setPublishUrl] = useState(null);
    const { activeProjects, loadingActiveProjects, activeFile, showCode, setActiveFile, setShowCode, loadProject, logout, chatLoading, handleChat } = useContextValue();

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
        window.open(`/preview/${id}`, '_blank');


    }
    const onPublish = async () => {
        if (!id) return;
        setPublishing(true)
        try {
            let res = await api.post(`/api/projects/${id}/publish`);
            const url = `${window.location.origin}/publish/${id}`;
            setPublishUrl(url);

        } catch (error) {
            console.log("Publish error", error);
            toast.error("Failed to publish");

        } finally {
            setPublishing(false)

        }


    }
    const handleDownload = () => {
        if (!id) return;
        exportProjectZip(activeProjects);

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


                <div className="flex-1 flex  overflow-hidden">
                    {/* left sidebar */}
                    <div className="w-[320px] shrink-0 flex flex-col border-r border-zinc-200 bg-white">
                        {/* sidebar tab */}
                        <div className="flex border-b border-zinc-200">
                            <button
                                onClick={() => setLeftTab('chat')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-6  text-xs font-medium cursor-pointer ${leftTab === "chat" ? "text-zinc-900 border-zinc-900 border-b-2" : "hover:text-zinc-400 hover:border-zinc-400"}`}
                            >
                                <MessageSquareIcon size={14} /> Chat
                            </button>


                            <button
                                onClick={() => setLeftTab('file')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-6 text-xs font-medium cursor-pointer ${leftTab === "file" ? "text-zinc-900 border-zinc-900 border-b-2" : "hover:text-zinc-400 hover:border-zinc-400"}`}
                            >
                                <FolderTreeIcon size={13} /> Files
                            </button>

                        </div>


                        {/* sidebar content */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {leftTab === 'chat' ?
                                <ChatPanel message={activeProjects?.message} onsend={handleChat} loading={chatLoading} />
                                :
                                <FileExplorer file={activeProjects.files} activeFile={activeFile} onFileSelect={(path) => {
                                    setActiveFile(path);
                                    setShowCode(true);
                                }} />
                            }
                        </div>
                    </div>

                    {/* rightTab */}
                    {/* Preview Code */}
                    <div className="flex-1 flex overflow-hidden">
                        {activeProjects.status === "pending" || activeProjects.status === "genrating" ? (
                            <AgentProgressDashboard project={activeProjects} />
                        ) :
                            <PreviewPanel showCode={showCode} activeFile={activeFile} projects={activeProjects} />
                        }

                    </div>


                </div>
                {publishUrl && <PublishModal publishUrl={publishUrl} onClose={() => setPublishUrl(null)} />}
            </div>
        </>
    );
}
export default BuilderPage;