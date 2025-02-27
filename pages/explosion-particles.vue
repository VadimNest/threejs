<script setup lang="ts">
import {
  BufferGeometry,
  BufferAttribute,
  Points,
  ShaderMaterial,
  DirectionalLight,
  AmbientLight,
  Vector3,
  Color,
  type BufferGeometry as BufferGeometryType,
  type Material,
} from 'three';
import type { IThreeContext } from '~/types/three';
import GUI from 'lil-gui';

const resources = {
  geometries: new Set<BufferGeometryType>(),
  materials: new Set<Material>(),
  gui: null as GUI | null,
};

const particleState = reactive({
  attractionStrength: 0.5,
  returnSpeed: 0.02,
  particleSize: 0.03,
  particleCount: 5000,
  noiseStrength: 0.1,
  useYellowOrange: false,
});

const currentBaseColor = ref(new Color(0x0a0a1a));

const threeContainer = ref();
const targets: Vector3[] = [];
let targetPoint = new Vector3(0, 0, 0);
let isAttracting = false;
let attractionStartTime = 0;

const computeWhiteNoise = (): Vector3 => {
  const x = (Math.random() - 0.5) * 2;
  const y = (Math.random() - 0.5) * 2;
  const z = (Math.random() - 0.5) * 2;
  return new Vector3(x, y, z).multiplyScalar(particleState.noiseStrength);
};

const vertexShader = `
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    gl_PointSize = ${particleState.particleSize.toFixed(2)} * 100.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

const createParticleSystem = () => {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(particleState.particleCount * 3);
  const velocities = new Float32Array(particleState.particleCount * 3);
  const colors = new Float32Array(particleState.particleCount * 3);

  const baseColor = new Color(0x0a0a1a);

  for (let i = 0; i < particleState.particleCount; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities[i * 3] = 0;
    velocities[i * 3 + 1] = 0;
    velocities[i * 3 + 2] = 0;

    colors[i * 3] = baseColor.r;
    colors[i * 3 + 1] = baseColor.g;
    colors[i * 3 + 2] = baseColor.b;

    targets.push(new Vector3(x, y, z));
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new BufferAttribute(velocities, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  resources.geometries.add(geometry);

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
  });
  resources.materials.add(material);

  return new Points(geometry, material);
};

const setupGUI = (particles: Points) => {
  const gui = new GUI();
  resources.gui = gui;

  gui.add(particleState, 'attractionStrength', 0.05, 1, 0.1).name('Сила притяжения');
  gui.add(particleState, 'returnSpeed', 0.01, 0.1, 0.01).name('Скорость возврата');
  gui.add(particleState, 'noiseStrength', 0, 0.5, 0.01).name('Сила шума');
  gui.add(particleState, 'useYellowOrange').name('Отобразить частицы');
};

const handleSceneReady = ({ scene, renderer, camera }: IThreeContext) => {
  scene.background = new Color('#0a0a1a');

  const particles = createParticleSystem();
  scene.add(particles);

  setupGUI(particles);

  window.addEventListener('click', (event) => {
    const guiElement = resources.gui?.domElement;
    if (guiElement && (event.target === guiElement || guiElement.contains(event.target as Node))) {
      return;
    }

    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    const vector = new Vector3(mouseX, mouseY, 0.5).unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    targetPoint = camera.position.clone().add(dir.multiplyScalar(distance));

    isAttracting = true;
    attractionStartTime = performance.now();
    setTimeout(() => (isAttracting = false), 1000);
  });

  if (threeContainer.value) {
    threeContainer.value.onTick(() => {
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const velocities = particles.geometry.attributes.velocity.array as Float32Array;
      const colors = particles.geometry.attributes.color.array as Float32Array;

      const darkBlue = new Color(0x0a0a1a);
      const yellowOrange = new Color(0xffc107);
      const attractColor = new Color(0xe0ffff);

      const targetBaseColor = particleState.useYellowOrange ? yellowOrange : darkBlue;
      currentBaseColor.value.lerp(targetBaseColor, 0.05);

      for (let i = 0; i < particleState.particleCount; i++) {
        const i3 = i * 3;

        const pos = new Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        const vel = new Vector3(velocities[i3], velocities[i3 + 1], velocities[i3 + 2]);
        const target = targets[i];

        const whiteNoise = computeWhiteNoise();
        vel.add(whiteNoise);

        if (isAttracting) {
          const direction = targetPoint.clone().sub(pos).normalize();
          vel.add(direction.multiplyScalar(particleState.attractionStrength));

          const distance = pos.distanceTo(targetPoint);
          const maxDistance = 20;
          const t = Math.min(1, 1 - distance / maxDistance);

          const timeSinceStart = (performance.now() - attractionStartTime) / 1000;
          const fade = Math.min(1, timeSinceStart * 2);
          const color = currentBaseColor.value.clone().lerp(attractColor, fade * t);

          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;
        } else {
          const direction = target.clone().sub(pos).normalize();
          vel.add(direction.multiplyScalar(particleState.returnSpeed));

          const currentColor = new Color(colors[i3], colors[i3 + 1], colors[i3 + 2]);
          const newColor = currentColor.lerp(currentBaseColor.value, 0.05);

          colors[i3] = newColor.r;
          colors[i3 + 1] = newColor.g;
          colors[i3 + 2] = newColor.b;
        }

        vel.clampLength(0, 0.5);

        pos.add(vel);
        positions[i3] = pos.x;
        positions[i3 + 1] = pos.y;
        positions[i3 + 2] = pos.z;

        velocities[i3] = vel.x;
        velocities[i3 + 1] = vel.y;
        velocities[i3 + 2] = vel.z;
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.velocity.needsUpdate = true;
      particles.geometry.attributes.color.needsUpdate = true;
    });
  }

  onUnmounted(() => {
    resources.geometries.forEach((geometry) => geometry.dispose());
    resources.materials.forEach((material) => material.dispose());
    resources.gui?.destroy();
  });
};
</script>

<template>
  <nuxt-link class="go-back" to="/">⭠ на главную</nuxt-link>
  <p class="helper">нажми в любую область</p>

  <ThreeContainer
    class="explosion-particles"
    ref="threeContainer"
    :camera-position="[0, 0, 30]"
    custom-animation
    @scene-ready="handleSceneReady"
  />
</template>

<style lang="less" scoped>
.explosion-particles {
  cursor: pointer;
}
</style>
