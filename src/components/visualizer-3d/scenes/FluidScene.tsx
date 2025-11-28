import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface FluidSceneProps {
    analyser: AnalyserNode | null;
}

export const FluidScene: React.FC<FluidSceneProps> = ({ analyser }) => {
    const materialRef = useRef<any>(null);
    const dataArray = useMemo(() => new Uint8Array(128), []);

    useFrame((state) => {
        if (analyser && materialRef.current) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const boost = average / 255;

            // Distort based on audio
            materialRef.current.distort = 0.3 + boost * 0.5;
            materialRef.current.speed = 1 + boost * 2;

            // Color shift
            materialRef.current.color.setHSL(state.clock.elapsedTime * 0.1 % 1, 0.8, 0.5);
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Sphere args={[1, 128, 128]} scale={2}>
                <MeshDistortMaterial
                    ref={materialRef}
                    color="#00aaff"
                    attach="material"
                    distort={0.3}
                    speed={1.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>
        </>
    );
};
