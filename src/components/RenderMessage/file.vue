<script setup lang="ts">
import { computed } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { formatBytes, getFileSuffix } from '@/utils'
import useDownloadQuenuStore from '@/stores/downloadQuenu'

interface FileAttachment {
  downloadUrl?: string
  fileName?: string
  fileSize?: number
}

const props = defineProps<{
  body: {
    content?: string
    attachments?: FileAttachment[]
    url?: string
    fileName?: string
    size?: number
  }
}>()

const { downloadObjMap, download, quenu, cancelDownload } = useDownloadQuenuStore()

// 优先从 attachments[0] 读取，兼容旧版顶层属性
const firstAtt = computed(() => props.body.attachments?.[0])
const fileUrl = computed(() => firstAtt.value?.downloadUrl || props.body.content || props.body.url || '')
const fileName = computed(() => firstAtt.value?.fileName || props.body.fileName || '未知文件')
const fileSize = computed(() => firstAtt.value?.fileSize || props.body.size || 0)

// 下载文件
const downloadFile = () => {
  download(fileUrl.value)
}

const cancelDownloadFile = () => {
  cancelDownload(fileUrl.value)
}

const isDownloading = computed(() => {
  return downloadObjMap.get(fileUrl.value)?.isDownloading || false
})

const process = computed(() => {
  return downloadObjMap.get(fileUrl.value)?.process || 0
})

// 是否排队中
const isQuenu = computed(() => {
  return quenu.includes(fileUrl.value)
})
</script>

<template>
  <div class="file">
    <Icon :icon="getFileSuffix(fileName)" :size="32" colorful />
    <div class="file-desc">
      <span class="file-name">{{ fileName }}</span>
      <span class="file-size">{{ formatBytes(fileSize) }}</span>
    </div>
    <el-text v-if="isQuenu" class="mx-1" size="small" type="warning" @click="cancelDownloadFile">
      等待下载
      <el-icon>
        <Close />
      </el-icon>
    </el-text>
    <Icon v-else-if="!isDownloading" icon="xiazai" :size="22" @click="downloadFile" />
    <el-progress
      v-else
      type="circle"
      :percentage="process"
      :width="22"
      :stroke-width="1"
      :show-text="false"
    />
  </div>
</template>
