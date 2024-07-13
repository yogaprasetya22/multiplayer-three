import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Experience } from "./components/Experience";

import { Detailed, KeyboardControls, Loader } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import { UI } from "./components/UI";
import { AudioManagerProvider } from "./hooks/useAudioManager";
import { GameStateProvider } from "./hooks/useGameState";

export const Controls = {
    forward: "forward",
    back: "back",
    left: "left",
    right: "right",
    jump: "jump",
    sprint: "sprint",
    dive: "dive",
    hide: "hide",
    message: "message",
};

function App() {
    const map = useMemo(
        () => [
            { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
            { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
            { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
            { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
            { name: Controls.jump, keys: ["Space"] },
            { name: Controls.sprint, keys: ["ShiftLeft"] },
            { name: Controls.dive, keys: ["KeyE"] },
            { name: Controls.hide, keys: ["KeyH"] },
            { name: Controls.message, keys: ["KeyM"] },
        ],
        []
    );
    return (
        <KeyboardControls map={map}>
            <AudioManagerProvider>
                <GameStateProvider>
                    <Loader />
                    <UI />
                    <Canvas
                        shadows
                        camera={{ position: [0, 16, 50], fov: 70 }}
                        // onPointerDown={(e) => {
                        //     if (e.pointerType === "mouse") {
                        //         e.target.requestPointerLock();
                        //     }
                        // }}
                    >
                        <Detailed distances={[0, 50, 100]} blur={0.5}>
                            <color attach="background" args={["#041c0b"]} />
                            <Suspense fallback={null}>
                                <Physics>
                                    <Experience />
                                </Physics>
                            </Suspense>
                        </Detailed>
                    </Canvas>
                </GameStateProvider>
            </AudioManagerProvider>
        </KeyboardControls>
    );
}

export default App;
