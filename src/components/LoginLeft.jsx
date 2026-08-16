function LoginLeft() {
    return (
        <div className="hidden lg:flex lg:w-2/5 bg-[url('/bg-img.png')] bg-no-repeat bg-cover bg-center flex-col justify-between p-12 shrink-0 select-none">
            <div>
                <img src="/logo.svg" alt="logo" className="size-9.5 mb-6" />
                <span className="text-4xl font-medium text-white">Builder AI</span>
            </div>
            <div>
                <h2 className="text-5xl text-white font-medium">
                    Build your presence on the web
                </h2>
                <p className="text-white/70">
                    Describe what you need, preview instantly, customize your site in real-time with clean JSX, verified layouts and instant code expert.

                </p>
                <p className="text-zinc-300 text-sm mt-12">  Copyright {new Date().getFullYear()}-BuilderAI. All rights reserved</p>
            </div>
        </div>
    )
}
export default LoginLeft;
