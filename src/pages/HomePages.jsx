import PromptInput from "../components/PromptInput";
import { useContextValue } from "../context/AppContext";

function HomePages() {
    const { user } = useContextValue();
    return (
        <div className="h-screen overflow-y-scroll text-white font-sans bg-[url('/bg-img.png')] bg-cover bg-center bg-no-repeat">
            <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4">
                <div>
                    <img src="/logo.svg" alt="logo" className="size-6" />
                    <span className="text-xl font-semibold tracking-tight">
                        BuilderAI
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-zinc-300">
                    <span>{user?.name}</span>
                    <button
                        className="py-1.5 px-3 border border-white/20 rounded-md text-xs text-white bg-transparent hover:bg-white/10 cursor-pointer">
                        Sign out
                    </button>
                </div>
            </nav>
            {/* Heor section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-2 mt-8 xl:mt-28">
                <div>
                    <div className="w-full max-w-2xl flex flex-col items-center">
                        <div className="flex items-center gap-2 p-1.5 pr-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[13px] text-white/90">
                            <span className="px-3 py-1 text-[11px] bg-red-700 rounded-full font-medium tracking-wider">
                                PROMO
                            </span>
                            <span>Create your first project for free.</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* title */}
            <h1 className="text-center text-4xl md:text-6xl font-medium mt-6 text-white">
                Let's build your app together
            </h1>
            {/* Description */}
            <p className="text-center text-sm md:text-base mt-4 text-white/65 leading-relaxed ">
                Describe your idea and watch AI design, structure and launch your
                website instantly. No coding required.
            </p>
            {/* Prmopt input with glassmorphic */}
            <div className="w-full mt-6 flex justify-center">
                <PromptInput
                    onSubmit={() => { }}
                    loading={false}
                    variant="glass"
                    placeholder="Create your portfolio website..."
                    autoFocus
                />
            </div>


        </div>
    );
}
export default HomePages;