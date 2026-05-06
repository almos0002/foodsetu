import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLOR = {
  sphere: '#1b2330',
  sphereLand: '#2a3645',
  grid: '#3a4757',
  donor: '#ff8a3c',
  donorGlow: '#ffb676',
  receiver: '#3ddb88',
  receiverGlow: '#9af2c0',
  arc: '#cfd6e0',
  atmosphere: '#7fb8ff',
  rim: '#ffd9a8',
}

const RADIUS = 1.55

function llToVec3(lat: number, lng: number, r = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

type Role = 'donor' | 'receiver'
const CITIES: Array<{ name: string; lat: number; lng: number; role: Role }> = [
  { name: 'Kathmandu',  lat: 27.7172, lng: 85.3240, role: 'donor' },
  { name: 'Pokhara',    lat: 28.2096, lng: 83.9856, role: 'receiver' },
  { name: 'Lalitpur',   lat: 27.6588, lng: 85.3247, role: 'receiver' },
  { name: 'Biratnagar', lat: 26.4525, lng: 87.2718, role: 'donor' },
  { name: 'Bharatpur',  lat: 27.6766, lng: 84.4385, role: 'donor' },
  { name: 'Birgunj',    lat: 27.0067, lng: 84.8672, role: 'receiver' },
  { name: 'Janakpur',   lat: 26.7288, lng: 85.9266, role: 'receiver' },
  { name: 'Nepalgunj',  lat: 28.0500, lng: 81.6167, role: 'donor' },
  { name: 'Butwal',     lat: 27.7000, lng: 83.4486, role: 'receiver' },
  { name: 'Dharan',     lat: 26.8147, lng: 87.2769, role: 'donor' },
  { name: 'Delhi',      lat: 28.6139, lng: 77.2090, role: 'donor' },
  { name: 'Patna',      lat: 25.5941, lng: 85.1376, role: 'receiver' },
  { name: 'Lhasa',      lat: 29.6500, lng: 91.1000, role: 'receiver' },
  { name: 'Dhaka',      lat: 23.8103, lng: 90.4125, role: 'receiver' },
]

// donor index → receiver index, with a phase offset (0..1) so pulses stagger
const ROUTES: Array<[number, number, number]> = [
  [0, 1, 0.00],
  [4, 2, 0.14],
  [3, 6, 0.28],
  [7, 8, 0.42],
  [9, 5, 0.56],
  [10, 11, 0.70],
  [0, 12, 0.84],
  [3, 13, 0.20],
  [10, 0, 0.62],
]

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

/* ─────────────────────────  Globe core  ───────────────────────── */

function Globe() {
  return (
    <group>
      {/* Solid base sphere */}
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial
          color={COLOR.sphere}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Lat/long wire grid — premium, very subtle */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.001, 36, 18]} />
        <meshBasicMaterial
          color={COLOR.grid}
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* Inner equatorial accent ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADIUS * 1.004, RADIUS * 1.012, 96]} />
        <meshBasicMaterial
          color={COLOR.grid}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Atmosphere halo — additive backside */}
      <mesh scale={1.13}>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <meshBasicMaterial
          color={COLOR.atmosphere}
          side={THREE.BackSide}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <meshBasicMaterial
          color={COLOR.atmosphere}
          side={THREE.BackSide}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ─────────────────────────  City dots  ───────────────────────── */

function CityDot({
  position,
  role,
  pulsePhase,
}: {
  position: THREE.Vector3
  role: Role
  pulsePhase: number
}) {
  const ringRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const color = role === 'donor' ? COLOR.donor : COLOR.receiver
  const glow = role === 'donor' ? COLOR.donorGlow : COLOR.receiverGlow

  // Orient ring tangent to the sphere surface
  const quat = useMemo(() => {
    const up = new THREE.Vector3(0, 0, 1)
    const normal = position.clone().normalize()
    return new THREE.Quaternion().setFromUnitVectors(up, normal)
  }, [position])

  useFrame((state) => {
    const t = (state.clock.elapsedTime + pulsePhase) % 2.4
    const k = t / 2.4
    if (ringRef.current) {
      const s = 1 + k * 4
      ringRef.current.scale.set(s, s, 1)
    }
    if (matRef.current) {
      matRef.current.opacity = (1 - k) * 0.55
    }
  })

  return (
    <group position={position} quaternion={quat}>
      {/* Outward stem */}
      <mesh position={[0, 0, 0.04]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={glow}
          emissiveIntensity={1.4}
          roughness={0.3}
        />
      </mesh>
      {/* Halo dot */}
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.05, 24]} />
        <meshBasicMaterial color={glow} transparent opacity={0.35} />
      </mesh>
      {/* Expanding ping ring */}
      <mesh ref={ringRef} position={[0, 0, 0.045]}>
        <ringGeometry args={[0.05, 0.058, 32]} />
        <meshBasicMaterial
          ref={matRef}
          color={glow}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ─────────────────────────  Arc + pulse  ───────────────────────── */

function makeArcCurve(a: THREE.Vector3, b: THREE.Vector3) {
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const dist = a.distanceTo(b)
  // Lift control point along the midpoint normal — taller for longer arcs
  const lift = THREE.MathUtils.clamp(dist * 0.55, 0.15, 0.9)
  mid.normalize().multiplyScalar(RADIUS + lift)
  return new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone())
}

function Arc({
  from,
  to,
  phaseOffset,
  cycle,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  phaseOffset: number
  cycle: number
}) {
  const curve = useMemo(() => makeArcCurve(from, to), [from, to])

  // Static line geometry
  const lineGeom = useMemo(() => {
    const pts = curve.getPoints(64)
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    return g
  }, [curve])

  // Animated trail geometry (recomputed each frame from a sliding window of curve points)
  const trailGeom = useMemo(() => {
    const positions = new Float32Array(24 * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  const head = useRef<THREE.Mesh>(null)
  const headMat = useRef<THREE.MeshBasicMaterial>(null)
  const trailMat = useRef<THREE.LineBasicMaterial>(null)

  useFrame((state) => {
    const t = ((state.clock.elapsedTime / cycle + phaseOffset) % 1)
    // Use a smooth window — pulse fades in, races, fades out
    const visible = t < 0.78
    const local = THREE.MathUtils.clamp(t / 0.78, 0, 1)

    if (head.current && headMat.current) {
      const p = curve.getPoint(local)
      head.current.position.copy(p)
      const fade =
        local < 0.08
          ? local / 0.08
          : local > 0.92
            ? (1 - local) / 0.08
            : 1
      headMat.current.opacity = visible ? fade : 0
      const s = visible ? 1 : 0
      head.current.scale.setScalar(s)
    }

    // Trail: 24 points behind the head along the curve
    if (trailMat.current) {
      const positions = trailGeom.attributes.position.array as Float32Array
      const trailLen = 0.16
      for (let i = 0; i < 24; i++) {
        const u = local - (i / 23) * trailLen
        const uc = THREE.MathUtils.clamp(u, 0, 1)
        const p = curve.getPoint(uc)
        positions[i * 3] = p.x
        positions[i * 3 + 1] = p.y
        positions[i * 3 + 2] = p.z
      }
      trailGeom.attributes.position.needsUpdate = true
      trailMat.current.opacity = visible ? 0.85 : 0
    }
  })

  return (
    <group>
      {/* Faint base arc */}
      <line>
        <primitive object={lineGeom} attach="geometry" />
        <lineBasicMaterial
          color={COLOR.arc}
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </line>
      {/* Bright leading trail */}
      <line>
        <primitive object={trailGeom} attach="geometry" />
        <lineBasicMaterial
          ref={trailMat}
          color={COLOR.donorGlow}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>
      {/* Head pulse */}
      <mesh ref={head}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial
          ref={headMat}
          color={COLOR.donorGlow}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ─────────────────────────  Scene  ───────────────────────── */

function Scene({ animated }: { animated: boolean }) {
  const root = useRef<THREE.Group>(null)

  // Pre-compute world positions of every city (sit them very slightly above surface)
  const cityPositions = useMemo(
    () => CITIES.map((c) => llToVec3(c.lat, c.lng, RADIUS * 1.005)),
    [],
  )

  // Initial rotation so Nepal sits center-frame, with a small downward latitude tilt
  const initialRot = useMemo(() => {
    // Map Kathmandu (lng 85.32, lat 27.7) to face +z (camera)
    const targetLng = 85.32
    const yRot = -((targetLng + 180) * Math.PI) / 180 + Math.PI / 2
    const xRot = (27 * Math.PI) / 180
    return { x: xRot, y: yRot }
  }, [])

  useEffect(() => {
    if (root.current) {
      root.current.rotation.set(initialRot.x, initialRot.y, 0)
    }
  }, [initialRot])

  useFrame((state, dt) => {
    if (!root.current) return
    if (animated) {
      root.current.rotation.y += dt * 0.045
    }
    const t = state.clock.elapsedTime
    // Gentle camera bob for life
    state.camera.position.y = Math.sin(t * 0.35) * 0.06
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} color="#a9c2db" />
      <directionalLight
        position={[3, 2.4, 3]}
        intensity={1.1}
        color={COLOR.rim}
      />
      <directionalLight position={[-4, -1, -2]} intensity={0.25} color="#5b8fbe" />
      <pointLight position={[0, 0, 3]} intensity={0.4} color="#ffe9c8" />

      <group ref={root}>
        <Globe />

        {CITIES.map((c, i) => (
          <CityDot
            key={c.name}
            position={cityPositions[i]}
            role={c.role}
            pulsePhase={i * 0.37}
          />
        ))}

        {ROUTES.map(([a, b, phase], i) => (
          <Arc
            key={`${a}-${b}-${i}`}
            from={cityPositions[a]}
            to={cityPositions[b]}
            phaseOffset={phase}
            cycle={4.5}
          />
        ))}
      </group>
    </>
  )
}

/* ─────────────────────────  Wrapper  ───────────────────────── */

function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background:
          'radial-gradient(ellipse at 60% 45%, rgba(255, 217, 168, 0.18) 0%, rgba(127, 184, 255, 0.08) 35%, transparent 70%)',
      }}
    />
  )
}

export function IsometricHandoff() {
  const [mounted, setMounted] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => setMounted(true), [])
  const dpr = useMemo<[number, number]>(() => [1, 2], [])

  if (!mounted) {
    return <div className="aspect-square w-full" aria-hidden="true" />
  }

  return (
    <div
      className="relative aspect-square w-full"
      role="img"
      aria-label="Animated globe of Nepal showing surplus food being routed from donor cities to receiver NGOs along glowing arcs."
    >
      <Backdrop />
      <Suspense fallback={null}>
        <Canvas
          dpr={dpr}
          camera={{ position: [0, 0, 4.4], fov: 38 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Scene animated={!reduced} />
        </Canvas>
      </Suspense>
    </div>
  )
}

export const ConnectionGlobe = IsometricHandoff
