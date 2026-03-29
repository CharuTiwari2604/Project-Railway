import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Train } from '../../Train_model';
import { Html } from '@react-three/drei';

const OverTake =({ isOvertaking, isStionFull, trainName }) => {
    const vipTrainRef = useRef();
    useFrame((state, delta) => {
        if (isOvertaking && vipTrainRef.current) {
            vipTrainRef.current.position.z += 15 * delta;      //delta= same speed on fast and slow pcs
            if (vipTrainRef.current.position.z > 50) {
                vipTrainRef.current.position.z = -50;
            }
        }
    })

    return (
        <group>
            <group position={[-3.5, 0, 0]}>
                <Train color='#3b82f6' /> 
                <Html position={[0, 3, 0]} center>
                    <div className="bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-lg border border-blue-400 shadow-xl">
                        <p className="text-[10px] font-black text-white whitespace-nowrap uppercase">
                            {trainName || "YOUR TRAIN"}
                        </p>
                    </div>
                </Html>
            </group>

            {isOvertaking && (
                <group ref={vipTrainRef} position={[3.5, 0, -60]} >
                    <Train color="#ef4444" scale={[1.1, 1.1, 1.1]} />
                    <Html position={[0, 3, 0]} center>
                        <div className="bg-red-600/90 px-3 py-1 rounded-lg shadow-2xl animate-bounce">
                            <p className="text-[10px] font-black text-white">HIGH PRIORITY</p>

                        </div>
                    </Html>
                </group>
            )}

            {isStionFull && (
                <mesh position={[0, 0.1, 15]}>
                    <boxGeometry args={[10, 0.2, 2]} />
                    <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
                </mesh>
            )}
        </group>
    )
}

export default OverTake;