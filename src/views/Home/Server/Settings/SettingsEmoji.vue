<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useEmojiStore } from '@/stores/emoji'
import { useGlobalStore } from '@/stores/global'
import apis from '@/services/apis'

const route = useRoute()
const emojiStore = useEmojiStore()
const globalStore = useGlobalStore()

const serverId = computed(() => Number(route.params.serverId))

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
  }
  await emojiStore.getEmojiList(sid)
})

const uploadName = ref('')
const uploadFile = ref<File | null>(null)
const uploading = ref(false)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadFile.value = file
}

async function doUpload() {
  if (!uploadName.value.trim() || !uploadFile.value) {
    ElMessage.warning('请填写表情名称并选择文件')
    return
  }
  uploading.value = true
  try {
    await emojiStore.uploadEmojiAction(serverId.value, uploadFile.value)
    uploadName.value = ''
    uploadFile.value = null
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

async function removeEmoji(emojiId: number) {
  try {
    await emojiStore.deleteEmojiAction(serverId.value, emojiId)
    ElMessage.success('已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

function getDownloadUrl(emojiId: number) {
  apis.getDownloadUrl(emojiId).send().then((res) => {
    if (res?.downloadUrl) window.open(res.downloadUrl, '_blank')
  })
}
</script>

<template>
  <div class="settings-emoji">
    <h3>自定义表情</h3>

    <div class="upload-section">
      <div class="upload-row">
        <el-input
          v-model="uploadName"
          placeholder="表情名称"
          maxlength="32"
          style="width: 180px"
        />
        <label class="file-pick">
          <el-button size="small" as="span">选择文件</el-button>
          <input type="file" accept="image/*" hidden @change="onFileChange" />
        </label>
        <span v-if="uploadFile" class="file-name">{{ uploadFile.name }}</span>
        <el-button type="primary" size="small" :loading="uploading" @click="doUpload">
          上传
        </el-button>
      </div>
    </div>

    <div class="emoji-grid">
      <div v-for="e in emojiStore.emojiList" :key="e.id" class="emoji-card">
        <img :src="e.url" :alt="e.name" class="emoji-img" @click="getDownloadUrl(e.id)" />
        <div class="emoji-name">{{ e.name }}</div>
        <el-button size="small" text type="danger" @click="removeEmoji(e.id)">删除</el-button>
      </div>
      <div v-if="!emojiStore.emojiList.length" class="empty">暂无自定义表情</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-emoji {
  padding: 24px;

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 700;
  }
}

.upload-section {
  margin-bottom: 24px;
}

.upload-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.file-name {
  max-width: 200px;
  overflow: hidden;
  font-size: 13px;
  color: var(--font-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.emoji-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 12px;
  background-color: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 6%));
  border-radius: 8px;
}

.emoji-img {
  width: 48px;
  height: 48px;
  cursor: pointer;
  object-fit: contain;
  border-radius: 4px;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.15);
  }
}

.emoji-name {
  font-size: 12px;
  color: var(--font-secondary);
}

.empty {
  padding: 40px;
  font-size: 14px;
  color: var(--font-secondary);
}
</style>
