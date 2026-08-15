import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

export const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
    //auth states
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const checkSession = async function () {
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

    return (
        <AppContext.Provider value={{ user, loadingUser }}>
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