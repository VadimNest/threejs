<script setup lang="ts">
import type { IThreeContext } from '~/types/three';
import * as THREE from 'three';
import * as dat from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const vertexShader = `
  attribute float aScale;
  uniform vec3 uMousePos;
  varying vec3 vPosition;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 direction = modelPosition.xyz - uMousePos;
    float distance = length(direction);
    if (distance < 0.5) {
      modelPosition.xyz += normalize(direction) * (0.5 - distance) * 0.2;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    vPosition = position;
    gl_Position = projectionPosition;
    gl_PointSize = aScale * 50.0 * (1.0 / -viewPosition.z);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    gl_FragColor = vec4(uColor, strength);
  }
`;

let particles: THREE.Points | null = null;
let gui: dat.GUI | null = null;
const debugObject = { color: '#ffffff' };

const initScene = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load('models/island/Fox.gltf', (gltf) => {
    const positions = [];
    let totalVertices = 0;

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const positionAttribute = child.geometry.attributes.position;
        if (positionAttribute) {
          totalVertices += positionAttribute.count;
          for (let i = 0; i < positionAttribute.count; i++) {
            positions.push(
              positionAttribute.getX(i),
              positionAttribute.getY(i),
              positionAttribute.getZ(i)
            );
          }
        }
      }
    });

    const positionArray = new Float32Array(positions);
    const particlesCount = totalVertices;
    const scaleArray = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount; i++) {
      scaleArray[i] = Math.random() * 0.5 + 0.5;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(debugObject.color) },
        uMousePos: { value: new THREE.Vector3() }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    particles.scale.set(0.03, 0.03, 0.03);
    particles.position.set(0, -1, 0);
    particles.rotation.y = -Math.PI / 4;
    scene.add(particles);
  });
};

const threeContainerRef = ref();

const handleSceneReady = ({ scene, renderer, camera, controls }: IThreeContext) => {
  initScene(scene);

  renderer.setClearColor('#000000');

  controls.minDistance = 1;
  controls.maxDistance = 10;

  gui = new dat.GUI({ width: 400 });
  gui.addColor(debugObject, 'color').onChange((value) => {
    if (particles && particles.material instanceof THREE.ShaderMaterial) {
      particles.material.uniforms.uColor.value.set(value);
    }
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const direction = raycaster.ray.direction.clone();
    const origin = camera.position.clone();
    const distance = 5;
    const mousePos = origin.add(direction.multiplyScalar(distance));

    if (particles && particles.material instanceof THREE.ShaderMaterial) {
      particles.material.uniforms.uMousePos.value.copy(mousePos);
    }
  };

  window.addEventListener('mousemove', onMouseMove);

  if (threeContainerRef.value) {
    threeContainerRef.value.onTick(() => {});
  }

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
    if (gui) gui.destroy();
  });
};

onUnmounted(() => {
  if (particles) {
    particles.geometry.dispose();
    if (particles.material instanceof THREE.Material) {
      particles.material.dispose();
    }
  }
});

const scene = ref<THREE.Scene | null>(null);
</script>

<template>
  <nuxt-link class="go-back" to="/">⭠ на главную</nuxt-link>

  <ThreeContainer
    class="particles-model"
    ref="threeContainerRef"
    :camera-position="[0, 2, 5]"
    :fov="45"
    :far="100"
    custom-animation
    @scene-ready="handleSceneReady"
  />
</template>

<style>
.particles-model {
  cursor: pointer;
}
</style>
