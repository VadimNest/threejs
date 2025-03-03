<script setup lang="ts">
import type { IThreeContext } from '~/types/three';
import { BufferGeometry, ShaderMaterial, LineSegments, BufferAttribute, AdditiveBlending, Color, Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const threeContainerRef = ref();

const rayVertexShader = `
uniform float uTime;
attribute float atrSpeed;
attribute float atrLength;
attribute vec3 atrColor;

varying vec3 vColor;
varying float vZPosition;

void main() {
  vec3 transformed = position;

  transformed.z += uTime * atrSpeed;

  float zRange = 50.0;
  transformed.z = mod(transformed.z + zRange, zRange * 2.0) - zRange;

  if (position.z < 0.0) {
    transformed.z -= atrLength * 10.0;
  }

  vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
  vec4 projectionPosition = projectionMatrix * viewMatrix * modelPosition;

  gl_Position = projectionPosition;

  vColor = atrColor;
  vZPosition = transformed.z;
}
`;

const rayFragmentShader = `
varying vec3 vColor;
varying float vZPosition;

void main() {
  float alpha = 1.0 - abs(vZPosition) / 50.0;

  if (alpha < 0.1) discard;

  gl_FragColor = vec4(vColor, alpha);
}
`;

const handleSceneReady = (context: IThreeContext) => {
  const { scene, camera, renderer } = context;
  scene.background = new Color('#000000');

  const rayCount = 500;
  const rayGeometry = new BufferGeometry();

  const vertices = new Float32Array(rayCount * 2 * 3);
  const speeds = new Float32Array(rayCount * 2);
  const lengths = new Float32Array(rayCount * 2);
  const colors = new Float32Array(rayCount * 2 * 3);

  for (let i = 0; i < rayCount; i++) {
    const x = (Math.random() - 0.5) * 20.0;
    const y = (Math.random() - 0.5) * 20.0;
    const z = Math.random() * 100.0 - 50.0;

    const vertexOffset = i * 2 * 3;
    vertices[vertexOffset + 0] = x;
    vertices[vertexOffset + 1] = y;
    vertices[vertexOffset + 2] = z;
    vertices[vertexOffset + 3] = x;
    vertices[vertexOffset + 4] = y;
    vertices[vertexOffset + 5] = z - 1.0;

    const speed = 5.0 + Math.random() * 10.0;
    const length = 1.0 + Math.random() * 2.0;
    const color = new Color();
    if (i % 2 === 0) {
      color.set(0xffffff);
    } else {
      color.set(0x00aaff);
    }

    for (let j = 0; j < 2; j++) {
      const attrOffset = i * 2 + j;
      speeds[attrOffset] = speed;
      lengths[attrOffset] = length;

      const colorOffset = attrOffset * 3;
      colors[colorOffset + 0] = color.r;
      colors[colorOffset + 1] = color.g;
      colors[colorOffset + 2] = color.b;
    }
  }

  rayGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
  rayGeometry.setAttribute('atrSpeed', new BufferAttribute(speeds, 1));
  rayGeometry.setAttribute('atrLength', new BufferAttribute(lengths, 1));
  rayGeometry.setAttribute('atrColor', new BufferAttribute(colors, 3));

  const rayMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: rayVertexShader,
    fragmentShader: rayFragmentShader,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const rays = new LineSegments(rayGeometry, rayMaterial);
  scene.add(rays);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  threeContainerRef.value?.onTick((elapsedTime: number) => {
    rayMaterial.uniforms.uTime.value = elapsedTime;
    composer.render();
  });
};
</script>

<template>
  <nuxt-link class="go-back" to="/">⭠ на главную</nuxt-link>

  <ThreeContainer
    ref="threeContainerRef"
    :camera-position="[0, 0, 5]"
    custom-animation
    @scene-ready="handleSceneReady"
  />
</template>
