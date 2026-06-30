<script setup lang="ts">
import { ref } from 'vue'
import { useImgPreviewStore } from '@/stores/preview'

const props = defineProps<{ body: { content?: string; url?: string } }>()

const imageStore = useImgPreviewStore()
const hasLoadError = ref(false)
const isLoading = ref(true)

// EMOJI 消息的 content 字段存储的是 sticker/emoji 图片 URL
const url = props.body?.content || props.body?.url || ''

const onLoad = () => {
  isLoading.value = false
  hasLoadError.value = false
}

const onError = () => {
  isLoading.value = false
  hasLoadError.value = true
}

const openPreview = () => {
  if (url) imageStore.show(url)
}
</script>

<template>
  <div class="emoji-msg">
    <div v-if="hasLoadError" class="emoji-error">
      <span class="error-icon">🖼️</span>
      <span class="error-text">表情加载失败</span>
    </div>
    <template v-else>
      <div v-if="isLoading" class="emoji-loading" />
      <img
        v-show="!isLoading"
        :src="url"
        class="emoji-img"
        draggable="false"
        :alt="'sticker'"
        @load="onLoad"
        @error="onError"
        @click="openPreview"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.emoji-msg {
  display: inline-block;
  margin: 2px 0;
}

.emoji-img {
  display: block;
  max-width: 128px;
  max-height: 128px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.08);
  }
}

.emoji-loading {
  width: 48px;
  height: 48px;
  background: var(--bg-hover, rgba(255, 255, 255, 5%));
  border-radius: 4px;
  animation: emoji-pulse 1.2s ease-in-out infinite;
}

@keyframes emoji-pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.emoji-error {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--font-secondary);
  background: var(--bg-hover, rgba(255, 255, 255, 3%));
  border-radius: 6px;
}

.error-icon {
  font-size: 18px;
}

.error-text {
  opacity: 0.7;
}
</style>
