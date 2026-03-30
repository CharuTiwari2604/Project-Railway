import React from 'react'
import { useGLTF } from '@react-three/drei'

export function Train(color="white", ...props) {
  const { nodes, materials } = useGLTF('/train_model-transformed.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Object_4.geometry} material={materials.TrainBody} material-color="#d7b530" position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_5.geometry} material={materials.TrainHead} material-color={color} material-roughness={0.5} position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_6.geometry} material={materials.Windows} material-color="#222222" position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_7.geometry} material={materials.TrainRear} material-color={color} position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_8.geometry} material={materials.TrainUnderside} material-color="#242323" position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_9.geometry} material={materials.TrainTopSide} material-color={color} position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_10.geometry} material={materials.TrainVents} material-color="#333333" position={[0, 0.277, 0.639]} scale={[1.325, 1.235, 1.235]} />
      <mesh geometry={nodes.Object_19.geometry} material={materials.tracks} material-color="#1a1a1a" position={[0, -1.237, -7.474]} rotation={[-Math.PI, 0, -Math.PI]} scale={[0.579, 0.877, 0.542]} />
    </group>
  )
}

useGLTF.preload('/train_model-transformed.glb')
