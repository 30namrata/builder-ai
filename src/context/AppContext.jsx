import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
    //auth states
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const navigate = useNavigate()
    //states
    const [projects, setProjects] = useState(null);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProjects, setActiveProjects] = useState([]);
    const [loadingActiveProjects, setLoadingActiveProjects] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [genratingProjects, setGenratingProjects] = useState(false);
    const [activeFile, setActiveFile] = useState('/App.js');
    const [showCode, setShowCode] = useState(false);


    //actions

    const checkSession = async () => {
        try {
            const { data } = await api.get('/api/auth/me');
            setUser(data.user)
        } catch (error) {
            setUser(null)
        } finally {
            setLoadingUser(false)
        }
    }

    useEffect(() => {
        checkSession()
    }, [checkSession])

    const login = async ({ email, password }) => {
        try {
            const { data } = await api.post('/api/auth/login', { email, password });
            setUser(data.user);
            navigate('/');
            toast.success("login successful")


        } catch (error) {
            console.log("error", error)
            const err = error.response?.data?.error || "Login is not valid"
            throw new Error(err);

        }

    }
    const register = async ({ name, email, password }) => {
        try {
            const { data } = await api.post('/api/auth/register', { name, email, password });
            setUser(data.user);
            navigate('/');
            toast.success("Registration  successful")

        } catch (error) {
            console.log("error", error)
            const err = error.response?.data?.error || "Registration is not valid"
            throw new Error(err);

        }

    }
    //logout
    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
            setUser("")
            setProjects([]);
            setActiveProjects([]);
            toast.success(data.message || "Logged out successfully");
            navigate("/");
        }
        catch (error) {
            console.log("logut error", error)
            const err = error.response?.data?.error || "Logout is not valid"
            throw new Error(err);

        }


    }

    //Projects Action
    const loadProjects = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/api/projects');
            setProjects(data);
            console.log("projects", data.projects, projects)
        }
        catch (err) {
            console.log("Load prject have an errror", err)
            toast.error("Failed to load projects");

        } finally {
            setLoadingProjects(false);
        }
    }

    const loadProject = async ({ id, silent = false }) => {
        if (!user) return;
        if (!silent) return setActiveProjects(true);
        try {
            const { data } = await api.get(`/api/prjects${id}`);
            setActiveFile(data);
            const files = Object.keys(data.files)
            setActiveProjects((prev) => {
                if (files.includes(prev)) return [...prev, files];
                if (files.includes("/App.js")) return "/App.js";
                return files[0];
            })

        } catch (err) {
            console.log("loading project have an error", err)
            if (!silent) {
                toast.error("Failed to load project");
                navigate("/")
            }

        }
        finally {
            if (!silent) setLoadingActiveProjects(false)
        }
    }
    //Automatically poll active policy project if status is pending or genrating
    useEffect(() => {
        if (!activeProjects?._id || !user) return;
        const isOngoing =
            activeProjects?.status === "revising" ||
            activeProjects?.status === "genrating" ||
            activeProjects?.status === "pending";
        if (isOngoing) {
            setChatLoading(true);
            const interval = setInterval(() => {
                loadProject({ id: activeProjects?._id, silent: true })
            }, 2000);
            return () => clearInterval(interval);
        } else {
            setChatLoading(false);
        }

    }, [activeProjects?._id, activeProjects?.status, loadProject, user]);

    const handleGenrate = useCallback(async (prompt) => {
        if (!user) return;
        setGenratingProjects(true);
        try {
            const { data } = await api.post('/api/projects', { prompt })
            toast.success("Ai agent is planning structure of your website...");
            navigate(`/builder/${data._id}`)
        } catch (err) {
            console.log("genrating project have an error", err);
            toast.error(err?.response?.data?.error || "failed to generate")

        } finally {
            setGenratingProjects(false)
        }
    }, [user, navigate])

    const handleDelete = useCallback(async (id) => {
        if (!user) return;
        setGenratingProjects(true);
        try {
            const { data } = await api.delete(`/api/projects/${id}`)
            setProjects((prev) => prev.filter((p) => p._id !== id))
            toast.success(data.message || "Project deleted successfully");
        } catch (err) {
            console.log("genrating project have an error", err);
            toast.error(err?.response?.data?.error || "failed to generate")

        }
    }, [user])






    return (
        <AppContext.Provider value={{
            user,
            loadingUser,
            login,
            register,
            projects,
            loadingProjects,
            activeProjects,
            loadingActiveProjects,
            chatLoading,
            genratingProjects,
            activeFile,
            showCode,
            setActiveFile,
            setShowCode,
            loadProjects,
            loadProject,
            handleGenrate,
            handleDelete,
            logout
        }}>
            {children}

        </AppContext.Provider>
    )
}


export function useContextValue() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("UseApppConetxt must wrapped inside the Appconetxtprovider")
    }
    return context


}