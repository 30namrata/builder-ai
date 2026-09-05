import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Loading from "../components/Loading";
import FullPagePreview from "../components/FullPagePreview";

function PreviewPage() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;
            try {
                const { data } = await api.get(`/api/projects/${id}`);
                setProject(data.project || data);
            } catch (err) {
                console.log("Preview fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading || !project) {
        return (
            <div>
                <Loading />
            </div>
        );
    }

    return (
        <FullPagePreview files={project?.files} />
    );
}
export default PreviewPage;