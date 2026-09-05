import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Loading from "../components/Loading";
import { AlertCircleIcon } from "lucide-react";
import FullPagePreview from "../components/FullPagePreview";

function PublishPage() {
    const { id } = useParams();
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("")
    useEffect(() => {
        const fetchProjectUrl = async () => {
            if (!id) return;
            try {
                debugger
                const { data } = await api.get(`/api/projects/public/${id}`);
                setProject(data)
            } catch (error) {
                console.log("Publish error", error);
                setError("Failed to load published project");
            } finally {
                setLoading(false)
            }
        }
        fetchProjectUrl();

    }, [id]);
    console.log("files", project)
    if (loading) {
        return <div>
            <Loading />
        </div>
    }
    if (error || !project) {
        return (
            <div className="flex  flex-col items-center justify-center bg-zinc-50 px-4 text-center overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircleIcon size={24} className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 ">Website Unavailable</h1>
                <p className="text-sm mt-2 text-zinc-500">{error}</p>
                <div className="text-[100px] mt-2 font-semibold tracking-widest uppercase text-zinc-900">
                    Builder AI
                </div>
            </div>
        )
    }
    return (
        <FullPagePreview files={project?.files} />
    );
}
export default PublishPage;