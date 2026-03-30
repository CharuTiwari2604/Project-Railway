import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Train } from '../../Train_model';
import { Html } from '@react-three/drei';

const OverTake = ({ isOvertaking, isStationFull, trainName, data, isRush }) => {
    const vipTrainRef = useRef();
    const myTrainRef = useRef();
    const aheadTrainRef = useRef();

    useFrame((state, delta) => {
        if (!myTrainRef.current) return;
        const speed = data?.currentSpeed || 0;
        if (speed > 0 && !isOvertaking && !isRush) {
            myTrainRef.current.position.z += (speed * 0.05) * delta;
        }

        if (isOvertaking && vipTrainRef.current) {
            vipTrainRef.current.position.z += 15 * delta;      //vip train speed
            myTrainRef.current.position.z += (speed * 0.05) * delta; //move slowly

            if (vipTrainRef.current.position.z > 60) {
                vipTrainRef.current.position.z = -80;
            }
        }

        if (isRush && aheadTrainRef.current) {
            myTrainRef.current.position.z += 2 * delta;
            aheadTrainRef.current.position.z = myTrainRef.current.position.z + 15;
        }
        if (myTrainRef.current.position.z > 50) {
            myTrainRef.current.position.z = -50;
        }
    })

    return (
        <group>
            <group ref={myTrainRef} position={[-3.5, 0, 2]} rotation={[0, Math.PI, 0]}>
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
                <group ref={vipTrainRef} position={[4, 0, -60]} rotation={[0, Math.PI, 0]}  >
                    <Train color="#ef4444" />
                    <Html position={[0, 3, 0]} center>
                        <div className="bg-red-600/90 px-3 py-1 rounded-lg shadow-2xl animate-bounce">
                            <p className="text-[10px] font-black text-white">HIGH PRIORITY</p>
                        </div>
                    </Html>
                </group>
            )}

            {isRush && (
                <group ref={aheadTrainRef} position={[-3.5, 0, 30]} rotation={[0, Math.PI, 0]}>
                    <Train color="#555555" /> {/* Grey to show it's a 'Ghost' or 'Another' train */}
                    <Html position={[0, 3, 0]} center>
                        <div className="bg-gray-800/80 px-2 py-1 rounded border border-gray-500">
                            <p className="text-[8px] font-bold text-white uppercase whitespace-nowrap">
                                TRAIN AHEAD
                            </p>
                        </div>
                    </Html>
                </group>
            )}

            {isStationFull && (
                <group position={[-5, 0, 20]}>
                    <mesh position={[0, 2, 0]}>
                        <boxGeometry args={[0.1, 4, 0.1]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <mesh position={[0, 3.8, 0.2]}>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={10} />
                    </mesh><Html position={[0, 5, 0]} center>
                        <div className="bg-red-600/90 text-[8px] font-bold p-1 rounded animate-pulse text-white">
                            PLATFORM OCCUPIED - WAITING AT OUTER
                        </div>
                    </Html>
                </group>
            )}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} />
            </mesh>
            <gridHelper args={[200, 100, "#1a1a1a", "#050505"]} position={[0, -1.19, 0]} />
        </group>


    )
}

export default OverTake;