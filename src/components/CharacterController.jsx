import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, quat, vec3 } from "@react-three/rapier";
import { setState, isHost } from "playroomkit";
import { useRef, useState, useEffect, useMemo } from "react";
import { Frustum, Matrix4, Vector3, Quaternion, Euler } from "three";
import { Controls } from "../App";
import { useAudioManager } from "../hooks/useAudioManager";
import { useGameState } from "../hooks/useGameState";
import { Character } from "./Character";
import { FLOORS, FLOOR_HEIGHT } from "./GameArena";

export const CharacterController = ({
    player = false,
    firstNonDeadPlayer = false,
    controls,
    state,
    ...props
}) => {
    const MOVEMENT_SPEED = 2.2;
    const JUMP_FORCE = 8;
    const ROTATION_SPEED = 2.5;
    const ROTATION_SPEED_JOYSTICK = 1.8;
    const SPRINT_MULTIPLIER = 1.5;
    const vel = useMemo(() => new Vector3(), []);

    const { playAudio } = useAudioManager();
    const isDead = state.getState("dead");
    const [animation, setAnimation] = useState("idle");
    const { stage } = useGameState();
    const [, get] = useKeyboardControls();
    const rb = useRef();
    const inTheAir = useRef(true);
    const landed = useRef(false);
    const cameraPosition = useRef();
    const cameraLookAt = useRef();

    const frustum = new Frustum();
    const cameraViewProjectionMatrix = new Matrix4();

    useFrame(({ camera }, delta) => {
        if (!rb.current) {
            return;
        }

        if (stage === "lobby") {
            return;
        }

        if ((player && !isDead) || firstNonDeadPlayer) {
            if (player) {
                const rbPosition = vec3(rb.current.translation());
                if (!cameraLookAt.current) {
                    cameraLookAt.current = rbPosition;
                }
                cameraLookAt.current.lerp(rbPosition, 0.05);
                camera.lookAt(cameraLookAt.current);
                const worldPos = rbPosition;
                cameraPosition.current.getWorldPosition(worldPos);
                camera.position.lerp(worldPos, 0.05);
            }
        }

        if (stage !== "game") {
            return;
        }

        const rotVel = {
            x: 0,
            y: 0,
            z: 0,
        };

        const curVel = rb.current.linvel();
        vel.set(0, 0, 0);

        const angle = controls.angle();
        const joystickX = Math.sin(angle);
        const joystickY = Math.cos(angle);

        if (get()[Controls.hide] && player) {
            controls?.destroy();
        }

        if (
            get()[Controls.forward] ||
            (controls.isJoystickPressed() && joystickY < -0.1)
        ) {
            vel.z += MOVEMENT_SPEED;
        }
        if (
            (get()[Controls.forward] && get()[Controls.sprint]) ||
            (controls.isJoystickPressed() &&
                joystickY < -0.1 &&
                controls.isPressed("Sprint"))
        ) {
            vel.z += MOVEMENT_SPEED * SPRINT_MULTIPLIER;
        }
        if (
            get()[Controls.back] ||
            (controls.isJoystickPressed() && joystickY > 0.1)
        ) {
            vel.z -= MOVEMENT_SPEED;
        }
        if (get()[Controls.left]) {
            rotVel.y += ROTATION_SPEED;
        }
        if (controls.isJoystickPressed() && joystickX < -0.1) {
            rotVel.y += ROTATION_SPEED_JOYSTICK;
        }
        if (get()[Controls.right]) {
            rotVel.y -= ROTATION_SPEED;
        }
        if (controls.isJoystickPressed() && joystickX > 0.1) {
            rotVel.y -= ROTATION_SPEED_JOYSTICK;
        }

        // Apply rotation to rb without changing the lockRotations setting
        const currentRotation = new Quaternion().copy(rb.current.rotation());
        const deltaRotation = new Quaternion().setFromAxisAngle(
            new Vector3(0, 1, 0),
            rotVel.y * delta
        );
        currentRotation.multiplyQuaternions(deltaRotation, currentRotation);
        rb.current.setRotation(currentRotation);

        // Apply velocity with the current rotation
        const eulerRot = new Euler().setFromQuaternion(currentRotation);
        vel.applyEuler(eulerRot);

        if (
            (get()[Controls.jump] || controls.isPressed("Jump")) &&
            !inTheAir.current &&
            landed.current
        ) {
            vel.y += JUMP_FORCE;
            inTheAir.current = true;
            landed.current = false;
        } else {
            vel.y = curVel.y;
        }
        if (Math.abs(vel.y) > 1) {
            inTheAir.current = true;
            landed.current = false;
        } else {
            inTheAir.current = false;
        }
        rb.current.setLinvel(vel);

        if (player) {
            state.setState("pos", rb.current.translation());
            state.setState("rot", rb.current.rotation());
        } else {
            const pos = state.getState("pos");
            const rot = state.getState("rot");
            const anim = state.getState("animation");
            setAnimation(anim);
            if (pos || rot) {
                rb.current.setTranslation(pos);
                rb.current.setRotation(rot);
            }
        }

        // ANIMATION
        const movement = Math.abs(vel.x) + Math.abs(vel.z);
        if (player) {
            if (inTheAir.current && vel.y > 2) {
                setAnimation("jump_up");
                state.setState("animation", "jump_up");
            } else if (inTheAir.current && vel.y < -5) {
                setAnimation("fall");
                state.setState("animation", "fall");
            } else if (movement > 4 || inTheAir.current) {
                setAnimation("run");
                state.setState("animation", "run");
            } else if (movement > 1 || inTheAir.current) {
                setAnimation("walk");
                state.setState("animation", "walk");
            } else if (get()[Controls.dive] || controls.isPressed("Dive")) {
                setAnimation("dive");
                state.setState("animation", "dive");
            } else {
                setAnimation("idle");
                state.setState("animation", "idle");
            }
        }

        if (
            rb.current.translation().y < -FLOOR_HEIGHT * FLOORS.length &&
            !state.getState("dead")
        ) {
            state.setState("dead", true);
            setState("lastDead", state.state.profile, true);
            playAudio("Dead", true);
        }
    });

    const startingPos = state.getState("startingPos");
    if (isDead || !startingPos) {
        return null;
    }

    return (
        <RigidBody
            {...props}
            position-x={startingPos.x}
            position-z={startingPos.z}
            friction={0.5}
            colliders={false}
            canSleep={false}
            linearDamping={-1}
            lockRotations
            type={player ? "dynamic" : "kinematicPosition"}
            ref={rb}
            onCollisionEnter={(e) => {
                if (
                    e.other.rigidBodyObject.name === "hexagon" ||
                    e.other.rigidBodyObject.name === "sideMovePlatform" ||
                    e.other.rigidBodyObject.name === "verticalMovePlatform" ||
                    e.other.rigidBodyObject.name === "rotatePlatform" ||
                    e.other.rigidBodyObject.name === "rotationDrum"
                ) {
                    inTheAir.current = false;
                    landed.current = true;
                    const curVel = rb.current.linvel();
                    curVel.y = 0;
                    rb.current.setLinvel(curVel);
                }
            }}
            gravityScale={stage === "game" ? 2.5 : 0}
            name={player ? "player" : "other"}
        >
            <group ref={cameraPosition} position={[0, 8, -16]}></group>
            <Character
                scale={0.42}
                color={state?.state?.profile?.color ?? "#ff0000"}
                name={state?.state?.profile?.name ?? "Player"}
                position-y={0.2}
                animation={animation}
            />
            <CapsuleCollider args={[0.1, 0.38]} position={[0, 0.68, 0]} />
        </RigidBody>
    );
};
