import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioDataProcessor } from '@/utils/AudioDataProcessor';

interface SphereSceneProps {
    analyser: AnalyserNode | null;
}

export const SphereScene: React.FC<SphereSceneProps> = ({ analyser }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const processor = useMemo(() => {
        return analyser ? new AudioDataProcessor(analyser) : null;
    }, [analyser]);

    const geometry = useMemo(() => new THREE.SphereGeometry(2, 64, 64), []);

    useFrame((state) => {
        if (!meshRef.current || !processor) return;

        const time = state.clock.getElapsedTime();
        const bass = processor.getBassEnergy();
        const mid = processor.getMidEnergy();

        const scale = 1 + (bass / 255) * 0.5;
        meshRef.current.scale.set(scale, scale, scale);

        meshRef.current.rotation.x = time * 0.2;
        meshRef.current.rotation.y = time * 0.3;

        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = (mid / 255) * 2;
    });

    return (
        <>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ff0000" />
            <pointLight position={[-10, -10, 10]} intensity={1} color="#0000ff" />

            <mesh ref={meshRef} geometry={geometry}>
                <meshStandardMaterial
                    wireframe
                    color="#ffffff"
                    emissive="#ff00ff"
                    emissiveIntensity={0.5}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>
        </>
    );
};
