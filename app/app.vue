<script setup lang="ts">
const counter = ref(0) // executes in server and client environments

const handleClick = () => {
  counter.value++ // executes only in a client environment
}
</script>

<template>
  <VApp>
    <NuxtRouteAnnouncer />
    <VMain>
      <NuxtPage />
    </VMain>
  </VApp>
</template>
