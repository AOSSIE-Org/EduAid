import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function Avatar({ isSpeaking, animationName = 'Idle', ...props }) {
  const group = useRef()
  const { scene, animations } = useGLTF('/models/human.glb')
  const { actions } = useAnimations(animations, group)

  const headMesh = useRef(null)
  const morphIndexRef = useRef({})
  const timeRef = useRef(0)
  const visemeTimer = useRef(0)
  const currentIntensity = useRef(0)
  const blinkTimer = useRef(Math.random() * 4 + 2)

  // Detect head mesh and morph targets
  useEffect(() => {
    scene.traverse(child => {
      if (child.isMesh && child.name.toLowerCase().includes('head')) {
        if (child.morphTargetDictionary && child.morphTargetInfluences) {
          headMesh.current = child
          const dict = child.morphTargetDictionary
          console.log('✅ Head Mesh Found:', child.name)
          console.log('🧠 Morph Targets:', dict)

          morphIndexRef.current = {
            mouthOpen: dict.mouthOpen ?? dict.jawOpen ?? null,
            blinkL: dict.eyeBlinkLeft ?? null,
            blinkR: dict.eyeBlinkRight ?? null,
          }
        }
      }
    })
  }, [scene])

  // Frame loop for animation
  useFrame((_, delta) => {
    const head = headMesh.current
    const morphs = morphIndexRef.current
    if (!head || morphs.mouthOpen == null) return

    // Lip-sync
    if (isSpeaking) {
      timeRef.current += delta
      visemeTimer.current -= delta
      if (visemeTimer.current <= 0) {
        currentIntensity.current = Math.random() * 0.7 + 0.3
        visemeTimer.current = Math.random() * 0.1 + 0.08
      }
      const prev = head.morphTargetInfluences[morphs.mouthOpen] || 0
      head.morphTargetInfluences[morphs.mouthOpen] = THREE.MathUtils.lerp(prev, currentIntensity.current, 0.3)
    } else {
      head.morphTargetInfluences[morphs.mouthOpen] = 0
    }

    // Blinking
    blinkTimer.current -= delta
    if (blinkTimer.current <= 0 && morphs.blinkL != null && morphs.blinkR != null) {
      head.morphTargetInfluences[morphs.blinkL] = 1
      head.morphTargetInfluences[morphs.blinkR] = 1
      setTimeout(() => {
        if (head.morphTargetInfluences) {
          head.morphTargetInfluences[morphs.blinkL] = 0
          head.morphTargetInfluences[morphs.blinkR] = 0
        }
      }, 120)
      blinkTimer.current = Math.random() * 4 + 2
    }

    // Gentle head sway
    group.current.rotation.y = Math.sin(Date.now() * 0.0015) * 0.04
    group.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.02
  })

  // Reset morph when speaking stops
  useEffect(() => {
    if (!isSpeaking && headMesh.current && morphIndexRef.current.mouthOpen !== null) {
      headMesh.current.morphTargetInfluences[morphIndexRef.current.mouthOpen] = 0
    }
  }, [isSpeaking])

  // Play idle animation
  useEffect(() => {
    if (actions && actions[animationName]) {
      Object.values(actions).forEach((a) => a.stop())
      actions[animationName].play()
    }
  }, [animationName, actions])

  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
    </group>
  )
}