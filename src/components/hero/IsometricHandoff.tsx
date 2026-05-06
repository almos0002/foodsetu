import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const COLOR = {
  ground: '#f4f1ea',
  road: '#d8d4ca',
  donor: '#e08a3c',
  donorRoof: '#b9601f',
  ngo: '#1e8a55',
  ngoRoof: '#0a5c36',
  bike: '#1f1f1f',
  cargo: '#ff8c2b',
  cargoGlow: '#ffb068',
  ink: '#0a0a0a',
}

const DONOR_POS = new THREE.Vector3(-2.6, 0, 0)
const NGO_POS = new THREE.Vector3(2.6, 0, 0)
const CYCLE = 9

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

function Building({
  position,
  bodyColor,
  roofColor,
  accent,
}: {
  position: THREE.Vector3
  bodyColor: string
  roofColor: string
  accent: 'donor' | 'ngo'
}) {
  return (
    <group position={position}>
      <RoundedBox args={[1.6, 1.4, 1.4]} radius={0.08} smoothness={4} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[1.25, 0.55, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.45, 0.71]}>
        <planeGeometry args={[0.42, 0.7]} />
        <meshStandardMaterial color={COLOR.ink} roughness={0.9} />
      </mesh>
      <mesh position={[-0.45, 0.95, 0.71]}>
        <planeGeometry args={[0.32, 0.32]} />
        <meshStandardMaterial color="#fff6dd" emissive="#ffd98a" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.45, 0.95, 0.71]}>
        <planeGeometry args={[0.32, 0.32]} />
        <meshStandardMaterial color="#fff6dd" emissive="#ffd98a" emissiveIntensity={0.6} />
      </mesh>
      {accent === 'donor' ? (
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.18, 0.4, 0.18]} />
          <meshStandardMaterial color={roofColor} />
        </mesh>
      ) : (
        <group position={[0, 1.95, 0.71]}>
          <mesh>
            <boxGeometry args={[0.08, 0.32, 0.04]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.24, 0.08, 0.04]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Bike({ phase }: { phase: number }) {
  const group = useRef<THREE.Group>(null)
  const cargo = useRef<THREE.Group>(null)
  const wheels = useRef<THREE.Mesh[]>([])
  const setWheel = (i: number) => (m: THREE.Mesh | null) => {
    if (m) wheels.current[i] = m
  }

  useFrame((_, dt) => {
    if (!group.current) return
    let x = 0
    let facing: 1 | -1 = 1
    let cargoVisible = 0
    let cargoY = 0

    if (phase < 0.12) {
      x = DONOR_POS.x + 0.8
      facing = 1
      cargoVisible = THREE.MathUtils.smoothstep(phase, 0.04, 0.12)
      cargoY = THREE.MathUtils.lerp(1.2, 0.45, cargoVisible)
    } else if (phase < 0.5) {
      const t = (phase - 0.12) / 0.38
      x = THREE.MathUtils.lerp(DONOR_POS.x + 0.8, NGO_POS.x - 0.8, t)
      facing = 1
      cargoVisible = 1
    } else if (phase < 0.62) {
      x = NGO_POS.x - 0.8
      facing = 1
      cargoVisible = 1 - THREE.MathUtils.smoothstep(phase, 0.5, 0.62)
      cargoY = THREE.MathUtils.lerp(0.45, 1.2, 1 - cargoVisible)
    } else if (phase < 0.95) {
      const t = (phase - 0.62) / 0.33
      x = THREE.MathUtils.lerp(NGO_POS.x - 0.8, DONOR_POS.x + 0.8, t)
      facing = -1
      cargoVisible = 0
    } else {
      x = DONOR_POS.x + 0.8
      facing = 1
      cargoVisible = 0
    }

    const moving =
      (phase >= 0.12 && phase < 0.5) || (phase >= 0.62 && phase < 0.95)
    const bob = moving ? Math.sin(phase * Math.PI * 2 * 8) * 0.025 : 0
    group.current.position.set(x, 0.18 + bob, 0)
    group.current.rotation.y = facing > 0 ? 0 : Math.PI

    if (cargo.current) {
      cargo.current.scale.setScalar(cargoVisible)
      cargo.current.position.y = cargoY > 0 ? cargoY : 0.45
      cargo.current.rotation.y += dt * 1.4
    }
    if (moving) {
      const spin = dt * 12 * facing
      for (const w of wheels.current) w.rotation.z -= spin
    }
  })

  return (
    <group ref={group}>
      <RoundedBox args={[0.7, 0.18, 0.32]} radius={0.06} position={[0, 0.05, 0]} castShadow>
        <meshStandardMaterial color={COLOR.bike} roughness={0.5} metalness={0.3} />
      </RoundedBox>
      {[
        [-0.28, -0.05, 0.16],
        [0.28, -0.05, 0.16],
        [-0.28, -0.05, -0.16],
        [0.28, -0.05, -0.16],
      ].map(([x, y, z], i) => (
        <mesh
          key={i}
          ref={setWheel(i)}
          position={[x, y, z]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.12, 0.04, 8, 16]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0.18, 0.32, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.28, 4, 8]} />
        <meshStandardMaterial color="#3b3b3b" />
      </mesh>
      <mesh position={[0.18, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#f0c89a" />
      </mesh>
      <RoundedBox args={[0.34, 0.34, 0.34]} radius={0.05} position={[-0.22, 0.32, 0]} castShadow>
        <meshStandardMaterial color={COLOR.donorRoof} roughness={0.6} />
      </RoundedBox>
      <group ref={cargo} position={[-0.22, 0.45, 0]}>
        <RoundedBox args={[0.22, 0.22, 0.22]} radius={0.04}>
          <meshStandardMaterial
            color={COLOR.cargo}
            emissive={COLOR.cargoGlow}
            emissiveIntensity={0.7}
            roughness={0.4}
          />
        </RoundedBox>
        <pointLight color={COLOR.cargoGlow} intensity={0.8} distance={1.6} />
      </group>
    </group>
  )
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[7, 48]} />
        <meshStandardMaterial color={COLOR.ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[5.2, 0.55]} />
        <meshStandardMaterial color={COLOR.road} roughness={1} />
      </mesh>
      {[-1.6, -0.6, 0.4, 1.4].map((x) => (
        <mesh
          key={x}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.32, 0.05]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      ))}
      {[
        [-3.5, 0, 1.6],
        [3.4, 0, -1.7],
        [-3.0, 0, -1.9],
        [3.1, 0, 1.5],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.36, 6]} />
            <meshStandardMaterial color="#7a5a3b" />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <icosahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color={COLOR.ngo} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Scene({ animated }: { animated: boolean }) {
  const camera = useRef<THREE.PerspectiveCamera>(null)
  const phaseRef = useRef(animated ? 0 : 0.3)

  useFrame((state, dt) => {
    if (animated) {
      phaseRef.current = (phaseRef.current + dt / CYCLE) % 1
    }
    const t = state.clock.elapsedTime
    const cam = state.camera
    const angle = Math.sin(t * 0.18) * 0.06
    const radius = 8.2
    cam.position.x = Math.sin(angle) * radius + Math.cos(angle) * 0.2
    cam.position.z = Math.cos(angle) * radius
    cam.position.y = 6 + Math.sin(t * 0.4) * 0.08
    cam.lookAt(0, 0.6, 0)
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.4}
        color="#fff1d6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#cfe6d6" />
      <Building
        position={DONOR_POS}
        bodyColor={COLOR.donor}
        roofColor={COLOR.donorRoof}
        accent="donor"
      />
      <Building
        position={NGO_POS}
        bodyColor={COLOR.ngo}
        roofColor={COLOR.ngoRoof}
        accent="ngo"
      />
      <Ground />
      <BikeTicker phaseRef={phaseRef} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={12}
        blur={2.4}
        far={4}
      />
    </>
  )
}

function BikeTicker({ phaseRef }: { phaseRef: React.MutableRefObject<number> }) {
  const [, setTick] = useState(0)
  useFrame(() => setTick((n) => (n + 1) % 1_000_000))
  return <Bike phase={phaseRef.current} />
}

function Fallback() {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-2xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-canvas-2)] to-[var(--color-canvas-3)]"
      aria-hidden="true"
    >
      <div className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
        Loading scene…
      </div>
    </div>
  )
}

export function IsometricHandoff() {
  const [mounted, setMounted] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => setMounted(true), [])

  const dpr = useMemo<[number, number]>(() => [1, 2], [])

  if (!mounted) {
    return <div className="aspect-[5/6] w-full" aria-hidden="true" />
  }

  return (
    <div
      className="aspect-[5/6] w-full"
      role="img"
      aria-label="Animated scene: a courier picks up surplus food from a restaurant and delivers it to an NGO shelter."
    >
      <Suspense fallback={null}>
        <Canvas
          shadows
          dpr={dpr}
          camera={{ position: [6, 6, 6], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene animated={!reduced} />
        </Canvas>
      </Suspense>
    </div>
  )
}
