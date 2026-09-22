import { Billboard, Html, Line } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

type Point = [number, number, number]

const nodes: { label: string; position: Point; kind: 'source' | 'core' | 'signal' }[] = [
  { label: 'EMAIL', position: [-3.7, 1.5, -0.1], kind: 'source' },
  { label: 'URL', position: [-3.5, -1.25, 0.25], kind: 'source' },
  { label: 'LANGUAGE', position: [-1.2, 2.35, -0.6], kind: 'signal' },
  { label: 'DOMAIN', position: [-0.8, -2.1, -0.5], kind: 'signal' },
  { label: 'AUTH', position: [1.2, 2.0, -0.35], kind: 'signal' },
  { label: 'REDIRECT', position: [1.45, -1.9, -0.2], kind: 'signal' },
  { label: 'RISK ENGINE', position: [0, 0, 0.45], kind: 'core' },
  { label: 'PROFILE', position: [3.15, 0.15, 0], kind: 'source' },
]

const edges: [number, number][] = [[0, 2], [0, 6], [1, 3], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 7]]

function Node({ label, position, kind, index, reduced }: (typeof nodes)[number] & { index: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const shape = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }, delta) => {
    if (!group.current || !shape.current) return
    shape.current.rotation.z = reduced ? 0 : clock.elapsedTime * (kind === 'core' ? 0.18 : 0.06) + index
    const targetScale = hovered && !reduced ? 1.28 : 1
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(1, delta * 9))
    group.current.position.y = position[1] + (reduced ? 0 : Math.sin(clock.elapsedTime * 0.42 + index * 0.9) * 0.055)
    if (halo.current) {
      halo.current.opacity = hovered ? 0.7 : 0.18 + Math.sin(clock.elapsedTime * 1.25 + index) * 0.06
    }
  })

  const color = kind === 'core' ? '#7cf7d4' : kind === 'source' ? '#d8fff4' : '#617d75'
  return (
    <group ref={group} position={position}>
      <mesh
        ref={shape}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[kind === 'core' ? 0.38 : 0.18, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.6 : kind === 'core' ? 1.35 : 0.32} roughness={0.35} />
      </mesh>
      {kind !== 'signal' && (
        <mesh>
          <ringGeometry args={kind === 'core' ? [0.52, 0.535, 64] : [0.27, 0.278, 48]} />
          <meshBasicMaterial ref={halo} color="#7cf7d4" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <Billboard>
        <Html center position={[0, kind === 'core' ? -0.72 : -0.42, 0]} style={{ pointerEvents: 'none' }}>
          <span className={`three-label three-label-${kind}${hovered ? ' is-active' : ''}`}><i />{label}</span>
        </Html>
      </Billboard>
    </group>
  )
}

function Packet({ from, to, offset, hot = false }: { from: Point; to: Point; offset: number; hot?: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const start = useMemo(() => new THREE.Vector3(...from), [from])
  const end = useMemo(() => new THREE.Vector3(...to), [to])
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime * (hot ? 0.14 : 0.18) + offset) % 1
    ref.current.position.lerpVectors(start, end, t)
    ref.current.position.z += Math.sin(t * Math.PI) * 0.16
    const pulse = 0.8 + Math.sin(t * Math.PI) * 0.6
    ref.current.scale.setScalar(pulse)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[hot ? 0.052 : 0.04, 10, 10]} />
      <meshBasicMaterial color={hot ? '#ff9b7e' : '#b9ffe9'} transparent opacity={0.9} />
    </mesh>
  )
}

function Scene({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const { pointer } = useThree()
  useFrame(() => {
    if (!group.current || reduced) return
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.12, 0.035)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.075, 0.035)
  })

  return (
    <group ref={group}>
      {edges.map(([start, end], index) => (
        <group key={`${start}-${end}`}>
          <Line points={[nodes[start].position, nodes[end].position]} color={end === 7 ? '#ff9b7e' : '#345d53'} lineWidth={0.75} transparent opacity={0.7} />
          {!reduced && <Packet from={nodes[start].position} to={nodes[end].position} offset={index / edges.length} hot={end === 7} />}
        </group>
      ))}
      {nodes.map((node, index) => <Node key={node.label} {...node} index={index} reduced={reduced} />)}
    </group>
  )
}

export function ThreatNetwork() {
  const reduced = useReducedMotionPreference()
  return (
    <div className="threat-canvas" role="img" aria-label="Email and URL signals flowing into a central risk engine">
      <Canvas dpr={[1, 1.45]} camera={{ position: [0, 0, 8], fov: 46 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={0.65} />
        <pointLight position={[0, 0, 4]} color="#a6ffdf" intensity={18} />
        <Scene reduced={reduced} />
      </Canvas>
    </div>
  )
}
