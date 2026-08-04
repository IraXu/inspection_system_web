<script setup lang="ts">
import GlobalAnnouncement from '@/components/GlobalAnnouncement.vue'
import GlobalFloatingButtons from '@/components/GlobalFloatingButtons.vue'
</script>

<template>
  <router-view />
  <GlobalAnnouncement />
  <GlobalFloatingButtons />
</template>
