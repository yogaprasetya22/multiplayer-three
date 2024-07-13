import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { Vector3 } from "three";

const useFollowCam = (characterRef, distance = 10, height = 5, sensitivity = 0.005) => {
    const { camera, gl } = useThree();
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event) => {
            mouse.current = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1,
            };
        };
        gl.domElement.addEventListener("mousemove", handleMouseMove);
        return () => {
            gl.domElement.removeEventListener("mousemove", handleMouseMove);
        };
    }, [gl.domElement]);

    useFrame(() => {
        if (characterRef.current && characterRef.current.position) {
            const characterPosition = characterRef.current.position;
            const offset = new Vector3(
                distance * Math.sin(mouse.current.x * sensitivity),
                height,
                distance * Math.cos(mouse.current.x * sensitivity)
            );
            const cameraPosition = characterPosition.clone().add(offset);
            camera.position.lerp(cameraPosition, 0.1);
            camera.lookAt(characterPosition);
        }
    });

    return camera;
};

export default useFollowCam;
