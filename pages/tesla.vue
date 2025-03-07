<script setup lang="ts">
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DirectionalLight, AmbientLight, Clock, MeshStandardMaterial, Color } from 'three';
import type { IThreeContext } from '~/types/three';

const threeContainerRef = ref();
let wheels: any[] = [];
const clock = new Clock();

const handleSceneReady = (context: IThreeContext) => {
  const { scene } = context;
  const loader = new GLTFLoader();

  const ambientLight = new AmbientLight(0xffffff, 10);
  scene.add(ambientLight);

  const light1 = new DirectionalLight(0xffffff, 20);
  light1.position.set(5, 5, 5);
  scene.add(light1);

  const light2 = new DirectionalLight(0xffffff, 20);
  light2.position.set(-5, 5, -5);
  scene.add(light2);

  const light3 = new DirectionalLight(0xffffff, 20);
  light3.position.set(0, 5, -5);
  scene.add(light3);

  loader.load('models/tesla/tesla.glb', (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.includes('Sidewall') || child.name.includes('Thread')) {
          if (!child.material) child.material = new MeshStandardMaterial();
          child.material.color = new Color(0x444444);
        }

        if (child.name.includes('interior') || child.name.includes('seats')) {
          if (!child.material) child.material = new MeshStandardMaterial();
          child.material.color = new Color(0x111111);
        }
      }

      if (child.name.includes('Wheel') && !child.name.includes('Brake')) {
        wheels.push(child);
      }
    });

    const animate = () => {
      const delta = clock.getDelta();
      wheels.forEach((wheel) => {
        wheel.rotation.x += delta * 4;
      });
      requestAnimationFrame(animate);
    };
    animate();
  });
};
</script>

<template>
  <nuxt-link class="go-back" to="/">⭠ на главную</nuxt-link>

  <ThreeContainer
    class="tesla"
    ref="threeContainerRef"
    :camera-position="[-4, 3, 6]"
    custom-animation
    @scene-ready="handleSceneReady"
  />
</template>

<style lang="less">
.tesla {
  cursor: grab;
}
</style>
