import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface RetroGridSceneProps {
    analyser: AnalyserNode | null;
}

export const RetroGridScene: React.FC<RetroGridSceneProps> = ({ analyser }) => {
    const gridRef = useRef<THREE.GridHelper>(null);
    const sunRef = useRef<THREE.Mesh>(null);
    const terrainRef = useRef<THREE.Mesh>(null);

    // Audio data buffer
    const dataArray = useMemo(() => new Uint8Array(128), []);

    useFrame((state, delta) => {
        if (gridRef.current) {
            // Move grid towards camera
            gridRef.current.position.z += delta * 10;
            if (gridRef.current.position.z > 10) {
                gridRef.current.position.z = 0;
            }
        }

        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const boost = average / 255;

            if (sunRef.current) {
                // Pulse sun
                const scale = 5 + boost * 2;
                sunRef.current.scale.set(scale, scale, scale);
                // Sun color shift
                (sunRef.current.material as THREE.MeshBasicMaterial).color.setHSL(0.8 + boost * 0.2, 1, 0.5);
            }
        }
    });

    return (
        <>
            <color attach="background" args={['#100020']} />
            <fog attach="fog" args={['#100020', 5, 60]} />

            {/* Moving Grid */}
            <gridHelper
                ref={gridRef}
                args={[100, 50, 0xff00ff, 0x00ffff]}
                position={[0, -2, 0]}
            />
            {/* Second grid for seamless loop illusion if needed, but resetting Z works for simple grid */}

            {/* Sun */}
            <mesh ref={sunRef} position={[0, 10, -40]}>
                <circleGeometry args={[1, 32]} />
                <meshBasicMaterial color="#ff00ff" />
            </mesh>

            {/* Stars */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Ambient Light */}
            <ambientLight intensity={0.5} />
        </>
    );
};
