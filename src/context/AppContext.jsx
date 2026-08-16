import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
    //auth states
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const navigate = useNavigate()
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

    return (
        <AppContext.Provider value={{ user, loadingUser, login, register }}>
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