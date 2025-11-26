import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioDataProcessor } from '@/utils/AudioDataProcessor';

interface TerrainSceneProps {
    analyser: AnalyserNode | null;
}

export const TerrainScene: React.FC<TerrainSceneProps> = ({ analyser }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const processor = useMemo(() => {
        return analyser ? new AudioDataProcessor(analyser) : null;
    }, [analyser]);

    const geometry = useMemo(() => new THREE.PlaneGeometry(20, 20, 64, 64), []);
    const { positions, originalPositions } = useMemo(() => {
        const pos = geometry.attributes.position.array as Float32Array;
        const original = new Float32Array(pos);
        return { positions: pos, originalPositions: original };
    }, [geometry]);

    useFrame((state) => {
        if (!meshRef.current || !processor) return;

        const time = state.clock.getElapsedTime();
        const bass = processor.getBassEnergy();
        const mid = processor.getMidEnergy();

        for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];

            const wave1 = Math.sin(x * 0.5 + time) * Math.cos(y * 0.5 + time) * 2;
            const wave2 = Math.sin(x * 1.5 + time * 2) * Math.cos(y * 1.5 + time * 2) * 0.5;

            const audioFactor = (bass / 255) * 3 + (mid / 255);
            const z = (wave1 + wave2) * audioFactor;

            positions[i + 2] = z;
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true;
        meshRef.current.rotation.z += 0.001;
    });

    return (
        <>
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#000000', 5, 30]} />

            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
            <pointLight position={[-10, -10, 10]} intensity={1} color="#b000ff" />

            <mesh
                ref={meshRef}
                geometry={geometry}
                rotation={[-Math.PI / 2.5, 0, 0]}
                position={[0, -2, 0]}
            >
                <meshStandardMaterial
                    wireframe
                    color="#00e5ff"
                    emissive="#b000ff"
                    emissiveIntensity={0.5}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>
        </>
    );
};
