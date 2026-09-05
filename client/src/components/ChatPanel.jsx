import { useEffect, useRef } from "react";
import { BotMessageSquare, UserIcon } from "lucide-react";
import PromptInput from "./PromptInput";

function ChatPanel({ message, onsend, loading }) {

    const buttonref = useRef(null);

    useEffect(() => {
        buttonref.current?.scrollIntoView({ behaviour: "auto" });

    }, [message, loading])

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Message list */}
            <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar px-3">
                {message.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-zinc-400 text-sm text-center">
                            Ask AI to modify your website
                        </div>
                    </div>
                )}
                {message.map((msg, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                        <div className="shrink-0 w-6 h-6 rounded-sm flex items-center justify-center mt-0.5 bg-zinc-50">
                            {msg.role === "user" ?
                                <UserIcon size={14} className="text-zinc-400" /> :
                                <BotMessageSquare size={14} className="text-zinc-700" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            < p className=" text-sm font-medium text-zinc-500 uppercase tracking-wider">
                                {msg.role === "user" ? "You" : "AI"}
                            </p>
                            <p className="text-[13px] text-zinc-700 leading-7 whitespace-pre-wrap break-words">
                                {msg.content.split("- ").map((text, i) => (
                                    <span key={i} className="block mt-3 ">
                                        <span className={i === 0 ? "hidden" : ""}>
                                        </span>
                                        {text}
                                    </span>
                                ))}
                            </p>
                        </div>

                    </div>

                ))}
                {loading && (
                    <div className="flex gap-2.5 items-start">
                        <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 bg-zinc-900/5">
                            <BotMessageSquare size={13} className="text-zinc-900" />
                        </div>

                        <div className="flex-1">
                            <p className="text-[11px] font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                                AI
                            </p>

                            <div className="dot-loader">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={buttonref} />

            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-zinc-200">
                <PromptInput onSubmit={onsend} loading={loading} placeholder="Ask AI to modify..." />

            </div>

        </div >
    );
}

export default ChatPanel;