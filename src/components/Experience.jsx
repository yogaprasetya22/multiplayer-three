import { extend } from "@react-three/fiber";
import { Environment, Loader, Sky } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { myPlayer } from "playroomkit";
import { Suspense, useEffect } from "react";
import { useGameState } from "../hooks/useGameState";
import { CharacterController } from "./CharacterController";
import EnvTwo from "./EnvTwo";
import DynamicPlatforms from "./example/DynamicPlatforms";
import Env from "./Env";
extend({ Environment, EnvTwo, Sky });

export const Experience = () => {
    const { players, stage } = useGameState();
    if (!players || !stage) return;
    const me = myPlayer();
    const camera = useThree((state) => state.camera);
    const firstNonDeadPlayer = players.find((p) => !p.state.getState("dead"));

    useEffect(() => {
        if (stage === "countdown") {
            camera.position.set(0, 50, -50);
        }
    }, [stage]);

    return (
        <Suspense fallback={null}>
            <Loader />
            {/* <OrbitControls /> */}
            <Environment files={"hdrs/medieval_cafe_1k.hdr"} preset="sunset" />
            <Sky />
            <pointLight position={[10, 10, 10]} />
            <>
                {stage !== "lobby" && <EnvTwo />}
                {players.map(({ state, controls }) => (
                    <CharacterController
                        key={state.id}
                        state={state}
                        controls={controls}
                        player={me?.id === state?.id}
                        firstNonDeadPlayer={
                            firstNonDeadPlayer?.state?.id === state?.id
                        }
                        position-y={1}
                    />
                ))}
            </>
            <DynamicPlatforms />
        </Suspense>
    );
};
