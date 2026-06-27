"use client"

import React, {
  Suspense,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Html, OrbitControls, Plane, Sphere } from "@react-three/drei"
import { Download, Heart, X } from "lucide-react"
import photo1 from "../../assets/photos/img-portfolio/photo-1.webp?url"
import photo2 from "../../assets/photos/img-portfolio/photo-2.webp?url"
import photo3 from "../../assets/photos/img-portfolio/photo-3.webp?url"
import photo4 from "../../assets/photos/img-portfolio/photo-4.webp?url"
import photo5 from "../../assets/photos/img-portfolio/photo-5.webp?url"
import photo6 from "../../assets/photos/img-portfolio/photo-6.webp?url"
import photo7 from "../../assets/photos/img-portfolio/photo-7.webp?url"
import photo8 from "../../assets/photos/img-portfolio/photo-8.webp?url"
import photo9 from "../../assets/photos/img-portfolio/photo-9.webp?url"
import photo10 from "../../assets/photos/img-portfolio/photo-10.webp?url"
import photo11 from "../../assets/photos/img-portfolio/photo-11.webp?url"
import photo12 from "../../assets/photos/img-portfolio/photo-12.webp?url"
import photo13 from "../../assets/photos/img-portfolio/photo-13.webp?url"
import photo14 from "../../assets/photos/img-portfolio/photo-14.webp?url"
import photo15 from "../../assets/photos/img-portfolio/photo-15.webp?url"
import photo16 from "../../assets/photos/img-portfolio/photo-16.webp?url"
import photo17 from "../../assets/photos/img-portfolio/photo-17.webp?url"
import photo18 from "../../assets/photos/img-portfolio/photo-18.webp?url"
import photo19 from "../../assets/photos/img-portfolio/photo-19.webp?url"
import photo20 from "../../assets/photos/img-portfolio/photo-20.webp?url"

type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
}

type CardContextType = {
  selectedCard: Card | null
  setSelectedCard: (card: Card | null) => void
  cards: Card[]
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

function CardProvider({ children }: { children: React.ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const cards: Card[] = [
    { id: "1", imageUrl: photo1, alt: "Portfolio gallery photo 1", title: "Photo 01" },
    { id: "2", imageUrl: photo2, alt: "Portfolio gallery photo 2", title: "Photo 02" },
    { id: "3", imageUrl: photo3, alt: "Portfolio gallery photo 3", title: "Photo 03" },
    { id: "4", imageUrl: photo4, alt: "Portfolio gallery photo 4", title: "Photo 04" },
    { id: "5", imageUrl: photo5, alt: "Portfolio gallery photo 5", title: "Photo 05" },
    { id: "6", imageUrl: photo6, alt: "Portfolio gallery photo 6", title: "Photo 06" },
    { id: "7", imageUrl: photo7, alt: "Portfolio gallery photo 7", title: "Photo 07" },
    { id: "8", imageUrl: photo8, alt: "Portfolio gallery photo 8", title: "Photo 08" },
    { id: "9", imageUrl: photo9, alt: "Portfolio gallery photo 9", title: "Photo 09" },
    { id: "10", imageUrl: photo10, alt: "Portfolio gallery photo 10", title: "Photo 10" },
    { id: "11", imageUrl: photo11, alt: "Portfolio gallery photo 11", title: "Photo 11" },
    { id: "12", imageUrl: photo12, alt: "Portfolio gallery photo 12", title: "Photo 12" },
    { id: "13", imageUrl: photo13, alt: "Portfolio gallery photo 13", title: "Photo 13" },
    { id: "14", imageUrl: photo14, alt: "Portfolio gallery photo 14", title: "Photo 14" },
    { id: "15", imageUrl: photo15, alt: "Portfolio gallery photo 15", title: "Photo 15" },
    { id: "16", imageUrl: photo16, alt: "Portfolio gallery photo 16", title: "Photo 16" },
    { id: "17", imageUrl: photo17, alt: "Portfolio gallery photo 17", title: "Photo 17" },
    { id: "18", imageUrl: photo18, alt: "Portfolio gallery photo 18", title: "Photo 18" },
    { id: "19", imageUrl: photo19, alt: "Portfolio gallery photo 19", title: "Photo 19" },
    { id: "20", imageUrl: photo20, alt: "Portfolio gallery photo 20", title: "Photo 20" },
  ]

  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards }}>
      {children}
    </CardContext.Provider>
  )
}

function StarfieldBackground() {
  const starsRef = useRef<THREE.Points>(null)
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const starsCount = 6000
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 420
      positions[i * 3 + 1] = (Math.random() - 0.5) * 240
      positions[i * 3 + 2] = (Math.random() - 0.5) * 420
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  useFrame(() => {
    if (!starsRef.current) return
    starsRef.current.rotation.y += 0.0001
    starsRef.current.rotation.x += 0.00005
  })

  return (
    <points ref={starsRef} geometry={starsGeometry} frustumCulled={false}>
      <pointsMaterial color="#9ca3af" size={0.16} sizeAttenuation transparent opacity={0.72} />
    </points>
  )
}

function FloatingCard({
  card,
  position,
}: {
  card: Card
  position: { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedCard } = useCard()

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedCard(card)
  }
  const handleDomClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation()
    setSelectedCard(card)
  }
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
  }
  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = "auto"
  }

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Plane
        ref={meshRef}
        args={[4.5, 6]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.01]}
        style={{
          transition: "all 0.3s ease",
          transform: hovered ? "scale(1.15)" : "scale(1)",
          pointerEvents: "auto",
        }}
      >
        <div
          className="w-40 h-52 cursor-pointer rounded-lg overflow-hidden shadow-2xl bg-white p-3 select-none"
          onClick={handleDomClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            boxShadow: hovered
              ? "0 25px 50px rgba(15, 23, 42, 0.18), 0 0 30px rgba(49, 184, 198, 0.22)"
              : "0 15px 30px rgba(15, 23, 42, 0.14)",
            border: hovered ? "2px solid rgba(49, 184, 198, 0.5)" : "1px solid rgba(15, 23, 42, 0.1)",
          }}
        >
          <img
            src={card.imageUrl || "/placeholder.svg"}
            alt={card.alt}
            className="w-full h-40 object-cover rounded-md"
            loading="lazy"
            draggable={false}
          />
          <div className="mt-1 text-center">
            <p className="text-slate-950 text-xs font-medium truncate">{card.title}</p>
          </div>
        </div>
      </Html>
    </group>
  )
}

function CardModal() {
  const { selectedCard, setSelectedCard } = useCard()
  const [isFavorited, setIsFavorited] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!selectedCard) return null

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 15
    const rotateY = (centerX - x) / 15
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseEnter = () => {}
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out"
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
    }
  }

  const toggleFavorite = () => setIsFavorited((v) => !v)
  const handleClose = () => setSelectedCard(null)
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative max-w-md w-full mx-4">
        <button onClick={handleClose} className="absolute -top-12 right-0 text-slate-950 hover:text-slate-500 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-[16px] bg-white p-4 transition-all duration-500 ease-out w-full"
            style={{
              transformStyle: "preserve-3d",
              boxShadow:
                "rgba(15, 23, 42, 0.04) 0px 120px 90px 0px, rgba(15, 23, 42, 0.12) 0px 40px 70px 0px, rgba(15, 23, 42, 0.18) 0px 14px 35px 0px",
              border: "1px solid rgba(15, 23, 42, 0.1)",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full mb-4" style={{ aspectRatio: "3 / 4" }}>
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-[16px] bg-slate-100 object-cover"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
                style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px", opacity: 1 }}
              />
            </div>

            <h3 className="text-slate-950 text-lg font-semibold mb-4 text-center">{selectedCard.title}</h3>

            <div className="flex gap-2">
              <a
                href={selectedCard.imageUrl}
                download
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg text-base font-medium text-white outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97]"
                style={{ backgroundColor: "#111827" }}
              >
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" strokeWidth={1.8} />
                  <span>Download</span>
                </div>
              </a>
              <button
                type="button"
                onClick={toggleFavorite}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97]"
                style={{ backgroundColor: "#111827" }}
              >
                <Heart className="h-4 w-4" strokeWidth={1.8} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardGalaxy() {
  const { cards } = useCard()

  const cardPositions = useMemo(() => {
    const positions: {
      x: number
      y: number
      z: number
      rotationX: number
      rotationY: number
      rotationZ: number
    }[] = []
    const numCards = cards.length
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    for (let i = 0; i < numCards; i++) {
      const y = 1 - (i / (numCards - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = (2 * Math.PI * i) / goldenRatio
      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY
      const layerRadius = 7.5 + (i % 4) * 1.8

      positions.push({
        x: x * layerRadius,
        y: y * layerRadius * 0.72,
        z: z * layerRadius,
        rotationX: Math.atan2(z, Math.sqrt(x * x + y * y)),
        rotationY: Math.atan2(x, z),
        rotationZ: (Math.random() - 0.5) * 0.2,
      })
    }
    return positions
  }, [cards.length])

  return (
    <>
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#0f172a" transparent opacity={0.08} wireframe />
      </Sphere>
      <Sphere args={[8, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#31b8c6" transparent opacity={0.1} wireframe />
      </Sphere>
      <Sphere args={[11, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#31b8c6" transparent opacity={0.07} wireframe />
      </Sphere>
      <Sphere args={[14, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#31b8c6" transparent opacity={0.05} wireframe />
      </Sphere>

      {cards.map((card, i) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[i]} />
      ))}
    </>
  )
}

export default function StellarCardGallerySingle() {
  return (
    <CardProvider>
      <div className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-white">
        <Canvas
          camera={{ position: [0, 0, 28], fov: 54 }}
          className="absolute inset-0 z-10"
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => {
            gl.domElement.style.pointerEvents = "auto"
          }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={["#ffffff"]} />
            <StarfieldBackground />
            <Environment preset="city" />
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={0.45} />
            <pointLight position={[-10, -10, -10]} intensity={0.25} />
            <CardGalaxy />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={12}
              maxDistance={60}
              autoRotate={false}
              rotateSpeed={0.5}
              zoomSpeed={1.2}
              panSpeed={0.8}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <CardModal />

        <div className="absolute top-4 left-4 z-20 text-slate-950 pointer-events-none">
          <h1 className="text-2xl font-bold mb-2">3D Portfolio Gallery</h1>
          <p className="text-sm opacity-70">Drag to look around - Scroll to zoom - Click cards to view details</p>
        </div>
      </div>
    </CardProvider>
  )
}
