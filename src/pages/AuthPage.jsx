import { useContextValue } from "../context/AppContext";
import Loading from "../components/Loading";
import { Navigate, Outlet } from "react-router-dom";

export function AuthPage() {
    const { user, loadingUser } = useContextValue();
    if (loadingUser) return <Loading />
    if (!user) return <Navigate to="/login" replace />
    return <Outlet />
}
export function UserGuestLogin() {
    const { user, loadingUser } = useContextValue();

    if (loadingUser) return <Loading />
    if (user) return <Navigate to="/" replace />
    return <Outlet />
}
