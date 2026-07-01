<script setup lang="ts">
import { computed, ref } from 'vue'
import { useImgPreviewStore } from '@/stores/preview'
import { formatImage } from '@/utils'

interface FileAttachment {
  downloadUrl?: string
  width?: number
  height?: number
}

const props = defineProps<{
  body: {
    content?: string
    attachments?: FileAttachment[]
    url?: string
    width?: number
    height?: number
  }
}>()

const imageStore = useImgPreviewStore()
const hasLoadError = ref(false)
const isLoading = ref(true)

// 优先从 attachments[0] 读取，兼容旧版顶层 url 属性
const firstAtt = computed(() => props.body.attachments?.[0])
const imageUrl = computed(() => firstAtt.value?.downloadUrl || props.body.content || props.body.url || '')
const imageWidth = computed(() => firstAtt.value?.width || props.body.width || 0)
const imageHeight = computed(() => firstAtt.value?.height || props.body.height || 0)

/**
 * 核心就是得到高度，产生明确占位防止图片加载时页面抖动
 */
const getImageHeight = computed(() => {
  return formatImage(imageWidth.value, imageHeight.value)
})

// 没有图片的情况下计算出按比例的宽度
const getWidthStyle = () => {
  if (imageHeight.value === 0) return ''
  return `width: ${(getImageHeight.value / imageHeight.value) * imageWidth.value}px`
}

const handleError = () => {
  isLoading.value = false
  hasLoadError.value = true
}
</script>

<template>
  <div
    class="image"
    :style="{ height: getImageHeight + 'px' }"
    @click="imageStore.show(imageUrl)"
  >
    <div v-if="hasLoadError" class="image-slot" :style="getWidthStyle()">
      <Icon icon="dazed" :size="36" colorful />
      加载失败
    </div>
    <template v-else>
      <img
        v-if="imageUrl"
        :src="imageUrl"
        draggable="false"
        @click="imageStore.show(imageUrl)"
        @error="handleError"
        @load="isLoading = false"
        :alt="imageUrl"
      />
    </template>
  </div>
</template>
