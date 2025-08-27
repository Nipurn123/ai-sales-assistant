'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitingIconProps {
  position: [number, number, number];
  name: string;
  color: string;
  speed: number;
  radius: number;
  offset: number;
  logo: string;
  bgColor: string;
}

function OrbitingIcon({ position, name, color, speed, radius, offset, logo, bgColor }: OrbitingIconProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * speed + offset;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 2;
      meshRef.current.rotation.x = clock.elapsedTime * 1.5;
    }
  });

  // Create rounded cube geometry for a more modern look
  const roundedCube = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.computeBoundingBox();
    return geometry;
  }, []);

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[radius, 0, 0]} geometry={roundedCube}>
        <meshStandardMaterial 
          color={bgColor} 
          emissive={bgColor} 
          emissiveIntensity={0.1}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Company Logo Text */}
      <Text
        position={[radius, 0, 0.6]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {logo}
      </Text>
      
      {/* Company Name */}
      <Text
        position={[radius, -1.2, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {name}
      </Text>
    </group>
  );
}

function CenterHub() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial 
        color="#ff6600" 
        emissive="#ff3300" 
        emissiveIntensity={0.3}
      />
      <Text
        position={[0, 0, 1.3]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        AI Agent
      </Text>
    </mesh>
  );
}

function OrbitRings() {
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = clock.elapsedTime * 0.3;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -clock.elapsedTime * 0.2;
    }
  });

  return (
    <>
      <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.3} />
      </mesh>
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.2} />
      </mesh>
    </>
  );
}

function Scene() {
  const integrations = useMemo(() => [
    { name: 'Salesforce', color: '#0176D3', speed: 0.5, radius: 4, offset: 0, logo: 'SF', bgColor: '#0176D3' },
    { name: 'HubSpot', color: '#FF7A59', speed: 0.4, radius: 4, offset: Math.PI / 3, logo: 'HS', bgColor: '#FF7A59' },
    { name: 'Slack', color: '#4A154B', speed: 0.6, radius: 4, offset: Math.PI * 2 / 3, logo: '#', bgColor: '#4A154B' },
    { name: 'WhatsApp', color: '#25D366', speed: 0.3, radius: 6, offset: 0, logo: 'W', bgColor: '#25D366' },
    { name: 'Shopify', color: '#96BF48', speed: 0.4, radius: 6, offset: Math.PI / 2, logo: 'S', bgColor: '#96BF48' },
    { name: 'Zendesk', color: '#03363D', speed: 0.5, radius: 6, offset: Math.PI, logo: 'Z', bgColor: '#03363D' },
  ], []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <CenterHub />
      <OrbitRings />
      
      {integrations.map((integration, index) => (
        <OrbitingIcon
          key={integration.name}
          position={[0, 0, 0]}
          name={integration.name}
          color={integration.color}
          speed={integration.speed}
          radius={integration.radius}
          offset={integration.offset}
          logo={integration.logo}
          bgColor={integration.bgColor}
        />
      ))}
      
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export default function OrbitalIntegration() {
  return (
    <div className="w-full h-96">
      <Canvas camera={{ position: [0, 5, 12], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
}