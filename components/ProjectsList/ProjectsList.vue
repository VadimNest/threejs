<script setup lang="ts">
const projects = [
  {
    name: '01 - Геометрические фигуры, дверь',
    component: 'figures',
  },
  {
    name: '02 - Галактика',
    component: 'galaxy',
  },
  {
    name: '03 - Океан',
    component: 'ocean',
  },
  {
    name: '04 - Остров',
    component: 'island',
  },
  {
    name: '05 - Взрыв частиц',
    component: 'explosion-particles',
  },
];
</script>

<template>
  <div class="projects">
    <div class="projects__container">
      <h2 class="projects__title">Projects:</h2>
      <ul>
        <li v-for="project in projects" :key="project.name" class="projects__link">
          <NuxtLink :to="project.component">{{ project.name }}</NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style src="./ProjectsList.less" lang="less" />
