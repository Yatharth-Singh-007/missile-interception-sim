import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from './store/useSimStore';

const SCALE = 0.001; // 1 unit = 1000m
const MISSILE_SCALE = 3.0; // Exaggerate scale for visibility (approx 500m-1000m visual)

function Trail({ positions, color }) {
    if (positions.length < 2) return null;
    return <Line points={positions} color={color} lineWidth={2} transparent opacity={0.6} />;
}

function MissileModel({ position, velocity, color }) {
    const groupRef = useRef();

    // Dynamically update rotation to align with velocity vector
    React.useEffect(() => {
        if (groupRef.current && velocity) {
            const v = new THREE.Vector3(velocity[0], velocity[1], velocity[2]);
            if (v.lengthSq() > 0.1) {
                v.normalize();
                // Cylinder default points up (Y axis). We rotate it to point along velocity.
                const up = new THREE.Vector3(0, 1, 0);
                const quaternion = new THREE.Quaternion().setFromUnitVectors(up, v);
                groupRef.current.quaternion.copy(quaternion);
            }
        }
    }, [velocity]);

    return (
        <group ref={groupRef} position={position} scale={[MISSILE_SCALE, MISSILE_SCALE, MISSILE_SCALE]}>
            {/* Body */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 2, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 1.25, 0]}>
                <coneGeometry args={[0.2, 0.5, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.9} />
            </mesh>
            {/* Engine Glow */}
            <mesh position={[0, -1.1, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color="#FFF" />
            </mesh>
        </group>
    );
}

function SwarmEntityPair({ target, interceptor }) {
    const tPos = [target.pos[0] * SCALE, target.pos[1] * SCALE, target.pos[2] * SCALE];
    const iPos = [interceptor.pos[0] * SCALE, interceptor.pos[1] * SCALE, interceptor.pos[2] * SCALE];
    
    const tTrailRef = useRef([]);
    const iTrailRef = useRef([]);
    
    React.useEffect(() => {
        if (target.status === 'ACTIVE' || target.status === 'INTERCEPTED' || target.status === 'IMPACT') {
             const lastT = tTrailRef.current[tTrailRef.current.length - 1];
             if (!lastT || new THREE.Vector3(...lastT).distanceTo(new THREE.Vector3(...tPos)) > 0.5) {
                 tTrailRef.current.push(tPos);
             }
             const lastI = iTrailRef.current[iTrailRef.current.length - 1];
             if (!lastI || new THREE.Vector3(...lastI).distanceTo(new THREE.Vector3(...iPos)) > 0.5) {
                 iTrailRef.current.push(iPos);
             }
        }
    }, [tPos, iPos, target.status]);

    // Check if simulation just reset and we need to clear trails
    React.useEffect(() => {
        if (target.time === 0) {
            tTrailRef.current = [];
            iTrailRef.current = [];
        }
    }, [target.time]);

    return (
        <group>
            {(target.status === 'ACTIVE' || target.status === 'INTERCEPTED' || target.status === 'IMPACT') && (
                <>
                    <MissileModel position={tPos} velocity={target.vel} color="#FF0000" />
                    <MissileModel position={iPos} velocity={interceptor.vel} color="#0088FF" />
                    
                    <Trail positions={tTrailRef.current} color="#FF0000" />
                    <Trail positions={iTrailRef.current} color="#0088FF" />
                </>
            )}

            {target.status === 'INTERCEPTED' && (
                 <Sparkles 
                    position={tPos} 
                    count={300} 
                    scale={15} 
                    size={6} 
                    speed={0.5} 
                    color="#0088FF"
                 />
            )}
            
            {target.status === 'IMPACT' && (
                 <Sparkles 
                    position={tPos} 
                    count={400} 
                    scale={20} 
                    size={8} 
                    speed={0.8} 
                    color="#FF0000"
                 />
            )}
        </group>
    );
}

function EngagementScene() {
    const { targets, interceptors, status } = useSimStore();

    return (
        <>
            <OrbitControls makeDefault position={[60, 40, 80]} target={[40, 0, 20]} maxPolarAngle={Math.PI/2 - 0.05} />

            <ambientLight intensity={0.4} />
            <pointLight position={[100, 100, 100]} intensity={1.5} />

            {/* Origin Axes */}
            <axesHelper args={[50]} />

            {/* Futuristic Grid */}
            <Grid
                args={[400, 400]}
                cellSize={5}
                cellThickness={0.5}
                cellColor="rgba(0, 255, 0, 0.2)"
                sectionSize={20}
                sectionThickness={1.5}
                sectionColor="rgba(0, 255, 0, 0.5)"
                fadeDistance={200}
                position={[0, -0.1, 0]}
            />

            {targets.map((tgt, i) => {
                const int = interceptors.find(x => x.id === tgt.id);
                if (!int) return null;
                return <SwarmEntityPair key={tgt.id} target={tgt} interceptor={int} />;
            })}
        </>
    );
}

export default function Scene() {
    return (
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas camera={{ position: [70, 50, 90], fov: 50 }}>
                {/* Deep Navy/Black Void */}
                <color attach="background" args={['#02050A']} />
                <fog attach="fog" args={['#02050A', 50, 250]} />
                <EngagementScene />
            </Canvas>
        </div>
    );
}
