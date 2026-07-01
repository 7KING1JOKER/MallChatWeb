<script setup lang="ts">
import { computed } from 'vue'
import { useVoicePreviewStore } from '@/stores/preview'

interface FileAttachment {
  downloadUrl?: string
}

const props = defineProps<{
  body: {
    content?: string
    attachments?: FileAttachment[]
    url?: string
    second?: number
  }
}>()

const voiceStore = useVoicePreviewStore()

// 优先从 attachments[0] 读取，兼容旧版顶层 url 属性
const firstAtt = computed(() => props.body.attachments?.[0])
const voiceUrl = computed(() => firstAtt.value?.downloadUrl || props.body.content || props.body.url || '')

// 判断当前这个消息组件是否正在播放
const isPlay = computed(() => voiceStore.previewUrl === voiceUrl.value && voiceStore.isPlaying)
</script>

<template>
  <div class="voice" @click="voiceStore.open(voiceUrl)">
    <div class="saying">
      <span :class="['shelter', { play: isPlay }]" />
      <Icon icon="saying" :size="18" />
    </div>
    <span class="num">{{ body?.second }}"</span>
  </div>
</template>
