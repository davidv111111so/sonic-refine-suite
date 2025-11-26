import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioDataProcessor } from '@/utils/AudioDataProcessor';

interface TunnelSceneProps {
    analyser: AnalyserNode | null;
}

export const TunnelScene: React.FC<TunnelSceneProps> = ({ analyser }) => {
    const groupRef = useRef<THREE.Group>(null);
    const processor = useMemo(() => {
        return analyser ? new AudioDataProcessor(analyser) : null;
    }, [analyser]);

    const ringCount = 20;
    const rings = useMemo(() => {
        return Array.from({ length: ringCount }).map((_, i) => ({
            z: -i * 2,
            scale: 1,
            color: new THREE.Color().setHSL(i / ringCount, 1, 0.5)
        }));
    }, []);

    useFrame((state) => {
        if (!groupRef.current || !processor) return;

        const time = state.clock.getElapsedTime();
        const bass = processor.getBassEnergy();
        const mid = processor.getMidEnergy();

        // Move rings towards camera
        groupRef.current.children.forEach((child, i) => {
            const mesh = child as THREE.Mesh;

            // Move forward
            mesh.position.z += 0.1 + (bass / 255) * 0.2;

            // Reset position when too close
            if (mesh.position.z > 5) {
                mesh.position.z = -((ringCount - 1) * 2) + 5;
            }

            // Pulse scale
            const scale = 1 + (mid / 255) * 0.5;
            mesh.scale.set(scale, scale, 1);

            // Rotate
            mesh.rotation.z = time * 0.5 + i * 0.1;
        });
    });

    return (
        <>
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#000000', 5, 30]} />

            <group ref={groupRef}>
                {rings.map((ring, i) => (
                    <mesh key={i} position={[0, 0, ring.z]}>
                        <torusGeometry args={[3, 0.05, 16, 100]} />
                        <meshBasicMaterial color={ring.color} wireframe />
                    </mesh>
                ))}
            </group>
        </>
    );
};
