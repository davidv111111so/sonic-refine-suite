import React, { useRef, Suspense } from 'react';
import { Mesh } from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { VisualizerErrorBoundary } from './VisualizerErrorBoundary';
import { TerrainScene } from './scenes/TerrainScene';
import { ParticleScene } from './scenes/ParticleScene';
import { TunnelScene } from './scenes/TunnelScene';
import { SphereScene } from './scenes/SphereScene';
import { RetroGridScene } from './scenes/RetroGridScene';
import { FluidScene } from './scenes/FluidScene';
import { NebulaScene } from './scenes/NebulaScene';

export type Visualizer3DMode = 'cube' | 'terrain' | 'particles' | 'tunnel' | 'sphere' | 'retro-grid' | 'fluid' | 'nebula';

interface Visualizer3DProps {
    mode?: Visualizer3DMode;
    analyser?: AnalyserNode | null;
}

const RotatingCube = () => {
    const meshRef = useRef<Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.5;
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" />
        </mesh>
    );
};

const Loader = () => (
    <Html center>
        <div className="text-white text-sm font-mono">Loading 3D Scene...</div>
    </Html>
);

export const Visualizer3D: React.FC<Visualizer3DProps> = ({ mode = 'cube', analyser = null }) => {
    return (
        <VisualizerErrorBoundary>
            <div className="w-full h-full min-h-[300px] bg-black rounded-lg overflow-hidden">
                <Canvas camera={{ position: [0, 0, 5] }} key={mode}>
                    <Suspense fallback={<Loader />}>
                        {mode === 'cube' && (
                            <>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} />
                                <RotatingCube />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'terrain' && (
                            <>
                                <TerrainScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'particles' && (
                            <>
                                <ParticleScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'tunnel' && (
                            <>
                                <TunnelScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'sphere' && (
                            <>
                                <SphereScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'retro-grid' && (
                            <>
                                <RetroGridScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'fluid' && (
                            <>
                                <FluidScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                        {mode === 'nebula' && (
                            <>
                                <NebulaScene analyser={analyser} />
                                <OrbitControls />
                            </>
                        )}
                    </Suspense>
                    {/* Post-processing disabled due to compatibility issues with R3F v8
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
          </EffectComposer> 
          */}
                </Canvas>
            </div>
        </VisualizerErrorBoundary>
    );
};

export default Visualizer3D;
