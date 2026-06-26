<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useImgPreviewStore, useVideoPreviewStore } from '@/stores/preview'
import ServerList from './components/ServerList.vue'
import LoginBox from '@/components/LoginBox/index.vue'

const imageStore = useImgPreviewStore()
const videoStore = useVideoPreviewStore()

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') videoStore.close()
}

watch(
  () => videoStore.isPlaying,
  (newValue) => {
    if (newValue) window.addEventListener('keydown', handleKeyDown)
    else window.removeEventListener('keydown', handleKeyDown)
  },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <main class="home">
    <div class="wrapper">
      <ServerList />
      <div class="content-area">
        <RouterView />
      </div>
    </div>
    <footer class="footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">闽ICP备2023004110号</a>
    </footer>
    <el-image-viewer
      v-if="imageStore.isShowing"
      :z-index="5000"
      :initial-index="0"
      :zoom-rate="1.1"
      :hide-on-click-modal="true"
      :url-list="[imageStore.previewUrl]"
      @close="imageStore.close()"
    />
    <LoginBox />
  </main>
</template>

<style lang="scss" src="./styles.scss" scoped />
