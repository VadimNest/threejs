<script setup lang="ts">
import type { IThreeContext } from '~/types/three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Color, BufferGeometry, ShaderMaterial, Points, BufferAttribute, AdditiveBlending } from 'three';

const threeContainerRef = ref();

const firefliesVertexShader = `
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;
attribute float atrScale;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.y += sin(uTime + modelPosition.x * 100.0) * atrScale * 0.2;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;

  gl_Position = projectionPosition;

  gl_PointSize = uSize * atrScale * uPixelRatio;
  gl_PointSize *= (1.0 / -viewPosition.z);
}
`;

const firefliesFragmentShader = `
void main() {
  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  float strength = 0.05 / distanceToCenter - 0.1;

  gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
}
`;

const handleSceneReady = (context: IThreeContext) => {
  const { scene } = context;
  scene.background = new Color('#000000');
  let blackHole: Group;
  let fireflies: Points;
  let firefliesMaterial: ShaderMaterial;

  const loader = new GLTFLoader();

  loader.load(
    '/models/index/5.glb',
    (gltf) => {
      blackHole = gltf.scene;
      scene.add(blackHole);

      blackHole.position.set(-20, -10, -5);

      blackHole.traverse((child) => {
        if (child instanceof Mesh) {
          const oldMaterial = child.material;

          if (child.name === 'Sphere010') {
            const newMaterial = new MeshPhysicalMaterial({
              color: 0x000000,
              metalness: 0,
              roughness: 0,
            });

            child.material = newMaterial;
            oldMaterial.dispose();
          } else if (child.name.toLowerCase().includes('bezcircle010')) {
            const diskMaterial = new MeshStandardMaterial({
              color: 0x800080,
              emissive: 0x800080,
              emissiveIntensity: 50,
              metalness: 0,
              roughness: 1,
            });

            child.material = diskMaterial;
            oldMaterial.dispose();
          }
        }
      });

      const firefliesCount = 5000;
      const firefliesGeometry = new BufferGeometry();
      const positionArray = new Float32Array(firefliesCount * 3);
      const scaleArray = new Float32Array(firefliesCount);

      for (let i = 0; i < firefliesCount; i++) {
        positionArray[i * 3 + 0] = (Math.random() - 0.5) * 100;
        positionArray[i * 3 + 1] = (Math.random() - 0.5) * 50;
        positionArray[i * 3 + 2] = (Math.random() - 0.5) * 100;
        scaleArray[i] = Math.random();
      }

      firefliesGeometry.setAttribute('position', new BufferAttribute(positionArray, 3));
      firefliesGeometry.setAttribute('atrScale', new BufferAttribute(scaleArray, 1));

      firefliesMaterial = new ShaderMaterial({
        uniforms: {
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uSize: { value: 300 },
          uTime: { value: 0 },
        },
        vertexShader: firefliesVertexShader,
        fragmentShader: firefliesFragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      });

      fireflies = new Points(firefliesGeometry, firefliesMaterial);
      scene.add(fireflies);

      threeContainerRef.value?.onTick((elapsedTime: number) => {
        const radius = 0.5;
        const speed = 0.5;
        blackHole.position.x = -20 + radius * Math.cos(elapsedTime * speed);
        blackHole.position.z = -5 + radius * Math.sin(elapsedTime * speed);

        firefliesMaterial.uniforms.uTime.value = elapsedTime;
      });
    },
    undefined,
    (error) => {
      console.error('Error loading black hole model:', error);
    },
  );
};
</script>

<template>
  <ProjectsList class="index__list" />

  <ThreeContainer
    class="index__scene"
    ref="threeContainerRef"
    :camera-position="[2, 0.8, 0]"
    custom-animation
    @scene-ready="handleSceneReady"
  />
</template>

<style lang="less">
.index {
  &__list {
    position: relative;
    z-index: 1;
  }

  &__scene {
    position: absolute;
    inset: 0;
  }
}
</style>
