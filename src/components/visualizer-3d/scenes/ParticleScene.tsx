import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioDataProcessor } from '@/utils/AudioDataProcessor';

interface ParticleSceneProps {
    analyser: AnalyserNode | null;
}

export const ParticleScene: React.FC<ParticleSceneProps> = ({ analyser }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const processor = useMemo(() => {
        return analyser ? new AudioDataProcessor(analyser) : null;
    }, [analyser]);

    const particleCount = 2000;

    const { positions, originalPositions, colors } = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;

            const color = new THREE.Color();
            color.setHSL(Math.random(), 1.0, 0.5);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        return { positions, originalPositions, colors };
    }, []);

    useFrame((state) => {
        if (!pointsRef.current || !processor) return;

        const time = state.clock.getElapsedTime();
        const bass = processor.getBassEnergy();
        const mid = processor.getMidEnergy();
        const high = processor.getHighEnergy();

        const positionsAttribute = pointsRef.current.geometry.attributes.position;

        // Rotate the entire cloud
        pointsRef.current.rotation.y = time * 0.1;
        pointsRef.current.rotation.z = time * 0.05;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = originalPositions[i3];
            const y = originalPositions[i3 + 1];
            const z = originalPositions[i3 + 2];

            // Pulse effect based on bass
            const pulse = 1 + (bass / 255) * 0.5;

            // Movement based on frequency bands
            const movement = Math.sin(time + x) * (mid / 255) * 0.5;

            positionsAttribute.setXYZ(
                i,
                x * pulse + movement,
                y * pulse + movement,
                z * pulse + movement
            );
        }

        positionsAttribute.needsUpdate = true;
    });

    return (
        <>
            <color attach="background" args={['#000000']} />
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particleCount}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={particleCount}
                        array={colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.15}
                    vertexColors
                    transparent
                    opacity={0.8}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    );
};
