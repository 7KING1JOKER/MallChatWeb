import { ref } from 'vue'
import apis from '@/services/apis'
import { ElMessage } from 'element-plus'

export type FileInfoType = {
  name: string
  type: string
  size: number
  suffix: string
  width?: number
  height?: number
  downloadUrl?: string
  second?: number
}

const MAX_MB = 100
const MAX_FILE_SIZE = MAX_MB * 1024 * 1024

export const useUpload = () => {
  const isUploading = ref(false)
  const progress = ref(0)
  const fileInfo = ref<FileInfoType | null>(null)
  const pendingFileId = ref<number | null>(null)
  const changeCbs: Array<(s: string) => void> = []
  const startCbs: Array<() => void> = []

  function onChange(cb: (s: string) => void) {
    changeCbs.push(cb)
  }
  function onStart(cb: () => void) {
    startCbs.push(cb)
  }
  function triggerChange(s: string) {
    changeCbs.forEach((cb) => cb(s))
  }
  function triggerStart() {
    startCbs.forEach((cb) => cb())
  }

  async function parseFile(file: File, ap: Record<string, any> = {}) {
    const { name, size, type } = file
    const suffix = name.split('.').pop()?.toLowerCase() || ''
    const base = { name, size, type, suffix, ...ap }
    if (type.includes('image')) {
      const img = new Image()
      const tu = URL.createObjectURL(file)
      img.src = tu
      const { w, h } = await new Promise<{ w: number; h: number }>((r) => {
        img.onload = () => {
          r({ w: img.width, h: img.height })
          URL.revokeObjectURL(tu)
        }
        img.onerror = () => {
          r({ w: 0, h: 0 })
          URL.revokeObjectURL(tu)
        }
      })
      return { ...base, width: w, height: h }
    }
    if (type.includes('audio')) {
      const a = new Audio()
      const tu = URL.createObjectURL(file)
      a.src = tu
      const sec = await new Promise<number>((r) => {
        const p = async () => {
          while (isNaN(a.duration) || a.duration === Infinity) {
            await new Promise((rr) => setTimeout(rr, 100))
            a.currentTime = 100000 * Math.random()
          }
          r(Math.round(a.duration || 0))
          URL.revokeObjectURL(tu)
        }
        p()
        a.onerror = () => {
          r(0)
          URL.revokeObjectURL(tu)
        }
      })
      return { ...base, second: sec }
    }
    return base
  }

  async function uploadFile(file: File, ap?: Record<string, any>) {
    if (isUploading.value || !file) return
    if (file.size > MAX_FILE_SIZE) {
      ElMessage.warning(`文件不得大于 ${MAX_MB} MB`)
      return
    }
    const info = await parseFile(file, ap)
    fileInfo.value = info
    triggerStart()
    try {
      const pre = await apis
        .getPresignedUrl({ fileName: info.name, fileSize: info.size, mimeType: info.type })
        .send()
      if (!pre?.uploadUrl) {
        triggerChange('fail')
        return
      }
      isUploading.value = true
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', pre.uploadUrl, true)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
        xhr.onload = () => {
          isUploading.value = false
          xhr.status === 200 ? resolve() : reject(new Error(`HTTP ${xhr.status}`))
        }
        xhr.onerror = () => {
          isUploading.value = false
          reject(new Error('Network error'))
        }
        xhr.send(file)
      })
      const cf = await apis.confirmUpload({ fileId: pre.fileId }).send()
      if (cf) {
        fileInfo.value = { ...info, downloadUrl: cf.downloadUrl }
        pendingFileId.value = cf.id
        triggerChange('success')
      } else triggerChange('fail')
    } catch {
      isUploading.value = false
      triggerChange('fail')
    }
  }
  return { fileInfo, isUploading, progress, pendingFileId, onStart, onChange, uploadFile }
}
