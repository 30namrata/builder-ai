import { useState } from "react";
import LoginLeft from "../components/LoginLeft";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useContextValue } from "../context/AppContext";

function AuthPage({ mode }) {
    const { login, register } = useContextValue();
    const isLogin = mode === "login";
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (mode === "login") {
                await login({ email, password })

            } else {
                await register({ name, email, password })

            }
            navigate('/')


        } catch (error) {
            console.log("error", error)
            const err = error.response?.data?.error || "Login is not valid"
            setError(err);

        } finally {
            setLoading(false)
        }



    }

    return (
        <div className="min-h-screen bg-white flex text-zinc-950">
            {/* left panel branding */}
            <LoginLeft />

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    <div className="mb-10">
                        <h1 className="text-3xl font-medium tracking-tight text-zinc-950 font-sans">
                            {isLogin ? "Sign in" : "Create an account"}
                        </h1>
                        <p className="text-sm text-zinc-400">
                            {isLogin
                                ? "Enter your credentials to access your account."
                                : "Get started by entering your registration details."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="First and last name"
                                    className="w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:border-zinc-950 text-sm text-zinc-900 bg-transparent placeholder-zinc-300 transition-colors"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:border-zinc-950 text-sm text-zinc-900 bg-transparent placeholder-zinc-300 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:border-zinc-950 text-sm text-zinc-900 bg-transparent placeholder-zinc-300 transition-colors"
                                />
                                <button type='button' onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-2 text-gray-300 hover:text-zinc-950 cursor-pointer transition-colors"
                                >{showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={14} />}</button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-2.5 bg-linear-to-br from-red-600 to-amber-600 text-white font-semibold hover:scale-102 disabled:opacity-40 flex items-center justify-center cursor-pointer mt-2 rounded-lg transition-all">
                            {loading && <Loader2Icon className="animate-spin h-3.5 w-3.5 mr-2" />}
                            {isLogin ? "Sign In" : "SignUp"}
                        </button>

                    </form>
                    <p className="text-sm text-zinc-400 mt-8 pt-6 border-t border-zinc-100 font-sans">
                        {isLogin ?
                            <>
                                New to BUilder Ai{" "}
                                <Link
                                    to="/register"
                                    className="text-blue-600 font-medium hover:text-blue-500"
                                >
                                    Create New Account
                                </Link>
                            </>
                            : <>
                                Already have an account{" "}
                                <Link
                                    to="/login"
                                    className="text-blue-600 font-medium hover:text-blue-500"
                                >
                                    Sign In
                                </Link>

                            </>}
                    </p>

                </div>
            </div>
        </div>
    );
}

export default AuthPage;