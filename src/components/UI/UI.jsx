import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "../../hooks/useGameState";
import { isHost, myPlayer, RPC } from "playroomkit";

export const UI = () => {
    const { stage, host, startGame, players } = useGameState();
    const me = myPlayer();
    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const isChatHandlerRegistered = useRef(false);
    const chatEndRef = useRef(null);

    const handleChatMessage = useCallback((message) => {
        setChatMessages((prev) => [...prev, message]);
    }, []);

    useEffect(() => {
        if (!isChatHandlerRegistered.current) {
            RPC.register("chat", handleChatMessage);
            isChatHandlerRegistered.current = true;
        }
    }, [handleChatMessage]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    return (
        <main
            className={`fixed z-10 inset-0 pointer-events-none grid place-content-center
            ${
                stage === "lobby"
                    ? "bg-gradient-to-b from-gray-500 to-gray-700/30 backdrop-blur-sm"
                    : "bg-transparent"
            }
            transition-colors duration-1000
            `}
        >
            <h1 className="text-sm lg:text-2xl text-white font-black absolute top-4 left-4 w-28">
                Jagres
                <span className="text-red-500">.io</span>
            </h1>
            {stage === "lobby" && (
                <>
                    {host ? (
                        <button
                            className="pointer-events-auto bg-white text-black text-xl px-4 py-2 rounded-lg"
                            onClick={startGame}
                        >
                            Mulai Game
                        </button>
                    ) : (
                        <h2 className="text-5xl text-white font-black">
                            Tunggu host untuk memulai game
                        </h2>
                    )}
                </>
            )}
            <button
                className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-auto text-white"
                onClick={() => {
                    // toggle fullscreen
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        document.documentElement.requestFullscreen();
                    }
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                </svg>
            </button>
            
            <div
                className="absolute bottom-5 left-1/2 
                transform -translate-x-1/2 pointer-events-auto
            w-[26rem] px-2 py-1 flex flex-col gap-4 "
            >
                {/* <div className="flex pointer-events-auto flex-col gap-2 bg-gray-200/80 p-2 rounded-md max-h-[10rem] overflow-y-auto overflow_type">
                    {chatMessages.map((chatMessage, index) => (
                        <div
                            key={index}
                            className={`bg-white p-2 rounded-lg ${
                                chatMessage.playerId === me.id
                                    ? "self-end"
                                    : "self-start"
                            }`}
                        >
                            <span
                                className={`font-bold text-xs text-[${
                                    players.find(
                                        (player) =>
                                            player.state.id ===
                                            chatMessage.playerId
                                    ).state.state.profile.color
                                }]`}
                            >
                                {
                                    players.find(
                                        (player) =>
                                            player.state.id ===
                                            chatMessage.playerId
                                    ).state.state.profile.name
                                }
                                :
                            </span>{" "}
                            {chatMessage.message}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div> */}
                <form
                    className="flex flex-row gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (
                            isHost &&
                            me.id ===
                                players.find(
                                    (player) => player.state.id === me.id
                                ).state.id
                        ) {
                            const playerId = players.find(
                                (player) => player.state.id === me.id
                            ).state.id;
                            const chatMessage = {
                                message,
                                playerId,
                            };
                            RPC.call("chat", chatMessage, RPC.Mode.ALL);
                            setMessage(""); // Clear the input field after sending
                        }
                    }}
                >
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-white rounded-lg pointer-events-auto px-2 w-full"
                    />
                    <button
                        className="text-xs p-2 text-extrabold bg-white text-black rounded-lg pointer-events-auto"
                        type="submit"
                    >
                        Kirim
                    </button>
                </form>
            </div>
        </main>
    );
};
