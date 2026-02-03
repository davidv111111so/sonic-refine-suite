import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VisualizerProps {
    analyser: any; // Accept Tone.Analyser or native
    active: boolean;
    color?: string;
}

const AudioBars = ({ analyser, active, color = '#06b6d4' }: VisualizerProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 32; // Lower count for stability
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // We'll use a local buffer to avoid reallocations
    const dataArray = useMemo(() => new Float32Array(128), []);

    useFrame(() => {
        if (!meshRef.current || !analyser || !active) return;

        let values: Float32Array;
        try {
            // Tone.Analyser.getValue() returns Float32Array
            values = analyser.getValue ? analyser.getValue() : new Float32Array(0);
        } catch (e) {
            return;
        }

        if (!values || values.length === 0) return;

        for (let i = 0; i < count; i++) {
            const index = Math.floor((i / count) * values.length * 0.5);
            // getValue() for FFT is in dB or 0-1 depending on type. 
            // For Tone.Analyser "fft", it's usually dB (-100 to 0) or normalized.
            const rawValue = values[index];
            // Simple normalization if it's dB-like
            const normalValue = Math.max(0, (rawValue + 100) / 100);

            const x = (i - count / 2) * 0.2;
            const y = normalValue * 3;

            dummy.position.set(x, y / 2 - 1, 0);
            dummy.scale.set(0.15, y + 0.01, 0.1);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null as any, null as any, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </instancedMesh>
    );
};

export const SpectralVisualizer3D = ({ analyser, active, color = '#06b6d4' }: VisualizerProps) => {
    return (
        <div className="w-full h-full bg-black/40 rounded-lg overflow-hidden border border-white/5 relative">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <AudioBars analyser={analyser} active={active} color={color} />
            </Canvas>
            {/* Fallback label if not active */}
            {!active && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest opacity-50">
                        Visualization Offline
                    </span>
                </div>
            )}
        </div>
    );
};
