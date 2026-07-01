<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import apis from '@/services/apis'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useRouter } from 'vue-router'
import { ChannelType, PermissionBit } from '@/services/types'
import type { ChannelVO } from '@/services/types'
import ChannelItem from './ChannelItem.vue'
import UserPanel from '../UserPanel.vue'

const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()

/** 服务器下拉菜单 —— 已移除，改为创建分类 */
const showCreateCategory = ref(false)
const newCategoryName = ref('')
const creatingCategory = ref(false)

async function createCategory() {
  const sid = globalStore.currentServerId
  if (!sid || !newCategoryName.value.trim()) return
  creatingCategory.value = true
  try {
    await apis.createCategory(sid, { name: newCategoryName.value.trim() }).send()
    ElMessage.success('分类创建成功')
    newCategoryName.value = ''
    showCreateCategory.value = false
    serverStore.getServerDetail(sid)
  } catch {
    ElMessage.error('创建分类失败')
  } finally {
    creatingCategory.value = false
  }
}

/** 分类列表（含折叠状态） */
const categories = computed(() => serverStore.currentDetail?.categories || [])

/** 折叠状态：Map<categoryId, collapsed> */
const collapsedMap = reactive<Map<number, boolean>>(new Map())

/**
 * 将所有分类下的频道打平，用于自动导航等场景
 */
const allChannels = computed<ChannelVO[]>(() => {
  const all: ChannelVO[] = []
  for (const cat of categories.value) {
    all.push(...cat.channels)
  }
  return all
})

const activeChannelId = computed(() => globalStore.currentChannelId)
const hasServer = computed(() => !!globalStore.currentServerId)

/** 服务器详情加载后，自动选中第一个频道 */
watch(
  () => serverStore.currentDetail,
  (detail) => {
    if (!detail) return
    const firstChannel = allChannels.value[0]
    if (firstChannel && !globalStore.currentChannelId) {
      onChannelClick(firstChannel.id)
    }
  },
  { immediate: true },
)

function onChannelClick(channelId: number) {
  globalStore.enterChannel(channelId)
  const sid = globalStore.currentServerId
  if (sid) router.push(`/servers/${sid}/channels/${channelId}`)
}

function toggleCategory(categoryId: number) {
  collapsedMap.set(categoryId, !collapsedMap.get(categoryId))
}

// ============ 创建频道 ============
const createChannelDialog = ref(false)
const newChannel = ref({ name: '', categoryId: 0 })
const creatingChannel = ref(false)

function openCreateChannel(catId: number) {
  newChannel.value = { name: '', categoryId: catId }
  createChannelDialog.value = true
}

async function createChannel() {
  const sid = globalStore.currentServerId
  if (!sid || !newChannel.value.name.trim()) return
  creatingChannel.value = true
  try {
    const cats = categories.value
    let catId = newChannel.value.categoryId
    if (!catId && !cats.length) {
      const cat = await apis.createCategory(sid, { name: '默认分类' }).send()
      catId = cat.id
    } else if (!catId && cats.length) {
      catId = cats[0].id
    }
    await apis
      .createChannel(sid, {
        name: newChannel.value.name,
        type: ChannelType.TEXT,
        categoryId: catId || undefined,
      })
      .send()
    ElMessage.success('频道创建成功')
    createChannelDialog.value = false
    newChannel.value = { name: '', categoryId: 0 }
    serverStore.getServerDetail(sid)
  } catch {
    ElMessage.error('创建失败')
  } finally {
    creatingChannel.value = false
  }
}

// ============ 编辑频道 ============
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editingChannel = ref<ChannelVO | null>(null)
const editFormRef = ref()

const editForm = ref({
  name: '',
  topic: ''
})

const editRules = {
  name: [
    { required: true, message: '请输入频道名称', trigger: 'blur' },
    { min: 1, max: 32, message: '频道名称长度为 1-32 个字符', trigger: 'blur' }
  ],
  topic: [
    { max: 256, message: '主题长度不能超过 256 个字符', trigger: 'blur' }
  ]
}

function handleEditChannel(channel: ChannelVO) {
  editingChannel.value = channel
  editForm.value = {
    name: channel.name || '',
    topic: channel.topic || ''
  }
  editDialogVisible.value = true
}

async function submitEdit() {
  if (!editingChannel.value) return
  const sid = globalStore.currentServerId
  if (!sid) return

  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }

  editLoading.value = true
  try {
    const data: { name?: string; topic?: string } = {}
    if (editForm.value.name.trim() !== editingChannel.value.name) {
      data.name = editForm.value.name.trim()
    }
    if (editForm.value.topic.trim() !== (editingChannel.value.topic || '')) {
      data.topic = editForm.value.topic.trim()
    }
    
    if (Object.keys(data).length === 0) {
      ElMessage.info('没有修改任何内容')
      editDialogVisible.value = false
      return
    }

    await apis.updateChannel(
      sid,
      editingChannel.value.id,
      data
    ).send()

    ElMessage.success('频道已更新')
    editDialogVisible.value = false
    await serverStore.getServerDetail(sid)
  } catch (error: any) {
    console.error('编辑频道错误:', error)
    const errData = error?.data || error?.response?.data
    const errCode = errData?.code
    const errMsg = errData?.message || error?.message || '更新频道失败'
    
    if (errCode === 2002) {
      ElMessage.error('无权执行此操作')
    } else if (errCode === 2005) {
      ElMessage.error('频道不存在')
    } else {
      ElMessage.error(errMsg)
    }
  } finally {
    editLoading.value = false
  }
}

// ============ 删除频道 ============
function handleDeleteChannel(channel: ChannelVO) {
  ElMessageBox.confirm(
    `确定删除频道「${channel.name}」？此操作不可撤销。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    const sid = globalStore.currentServerId
    if (!sid) {
      ElMessage.error('未选择服务器')
      return
    }

    try {
      await apis.deleteChannel(sid, channel.id).send()
      
      ElMessage.success(`频道「${channel.name}」已删除`)
      
      const detail = serverStore.currentDetail
      if (detail) {
        for (const cat of detail.categories) {
          const index = cat.channels.findIndex(c => c.id === channel.id)
          if (index !== -1) {
            cat.channels.splice(index, 1)
            break
          }
        }
      }
      
      if (activeChannelId.value === channel.id) {
        const firstChannel = allChannels.value[0]
        if (firstChannel) {
          onChannelClick(firstChannel.id)
        } else {
          globalStore.currentChannelId = null
          const sid2 = globalStore.currentServerId
          if (sid2) router.push(`/servers/${sid2}`)
        }
      }
    } catch (error: any) {
      console.error('删除频道错误:', error)
      ElMessage.error('删除频道失败，请重试')
    }
  }).catch(() => {})
}

// ============ 分类重命名 ============
const renameDialogVisible = ref(false)
const renameLoading = ref(false)
const renamingCategory = ref<any>(null)
const renameFormRef = ref()
const renameForm = ref({ name: '' })

const renameRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 16, message: '分类名称长度为 1-16 个字符', trigger: 'blur' }
  ]
}

function handleRenameCategory(category: any) {
  renamingCategory.value = category
  renameForm.value.name = category.name
  renameDialogVisible.value = true
}

async function submitRename() {
  if (!renamingCategory.value) return
  const sid = globalStore.currentServerId
  if (!sid) return

  try {
    await renameFormRef.value?.validate()
  } catch {
    return
  }

  renameLoading.value = true
  try {
    await apis.updateCategory(sid, renamingCategory.value.id, {
      name: renameForm.value.name.trim()
    }).send()

    ElMessage.success('分类已重命名')
    renameDialogVisible.value = false
    await serverStore.getServerDetail(sid)
  } catch (error: any) {
    console.error('重命名分类错误:', error)
    const errData = error?.data || error?.response?.data
    const errMsg = errData?.message || error?.message || '重命名失败'
    ElMessage.error(errMsg)
  } finally {
    renameLoading.value = false
  }
}

// ============ 删除分类 ============
function handleDeleteCategory(category: any) {
  // 检查分类下是否有频道
  if (category.channels && category.channels.length > 0) {
    ElMessage.warning('该分类下还有频道，无法删除')
    return
  }

  ElMessageBox.confirm(
    `确定删除分类「${category.name}」？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    const sid = globalStore.currentServerId
    if (!sid) return

    try {
      await apis.deleteCategory(sid, category.id).send()
      
      ElMessage.success(`分类「${category.name}」已删除`)
      
      // 直接从本地移除分类
      const detail = serverStore.currentDetail
      if (detail) {
        const index = detail.categories.findIndex(c => c.id === category.id)
        if (index !== -1) {
          detail.categories.splice(index, 1)
        }
      }
    } catch (error: any) {
      console.error('删除分类错误:', error)
      const errData = error?.data || error?.response?.data
      const errMsg = errData?.message || error?.message || '删除失败'
      ElMessage.error(errMsg)
    }
  }).catch(() => {})
}
</script>

<template>
  <aside class="channel-panel">
    <!-- 服务器名称 + 新建分类 -->
    <div class="server-name-bar">
      <span class="server-name">{{ serverStore.currentServer?.name || '未选择服务器' }}</span>
      <span v-if="hasServer && !showCreateCategory" class="new-category-btn" @click="showCreateCategory = true">＋ 分类</span>
      <span v-if="hasServer && showCreateCategory" class="new-category-btn" @click="showCreateCategory = false; newCategoryName = ''">✕</span>
    </div>
    <!-- 新建分类表单 -->
    <div v-if="hasServer && showCreateCategory" class="create-form">
      <el-input
        v-model="newCategoryName"
        size="small"
        placeholder="分类名称"
        @keydown.enter="createCategory"
      />
      <el-button size="small" type="primary" :loading="creatingCategory" @click="createCategory">创建</el-button>
    </div>

    <!-- 未选服务器时提示 -->
    <div v-if="!hasServer" class="empty-hint">
      <p>请先选择一个服务器</p>
      <p class="sub">点击左侧 + 创建或加入服务器</p>
    </div>

    <!-- 频道树（按分类分组） -->
    <div v-else class="channel-tree">
      <div v-if="!allChannels.length" class="empty-hint">暂无频道，请创建一个</div>
      <template v-for="cat in categories" :key="cat.id">
        <!-- 分类标题（可折叠） -->
        <div class="category-header-item">
          <div class="category-left" @click="toggleCategory(cat.id)">
            <el-icon :class="['arrow', { rotated: !collapsedMap.get(cat.id) }]">
              <IEpArrowRight />
            </el-icon>
            <span class="category-name">{{ cat.name }}</span>
          </div>
          <!-- 分类操作菜单 -->
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            class="category-menu"
          >
            <span class="category-more" @click.stop>⋯</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openCreateChannel(cat.id)">
                  ＋ 创建频道
                </el-dropdown-item>
                <el-dropdown-item @click="handleRenameCategory(cat)">
                  📝 重命名
                </el-dropdown-item>
                <el-dropdown-item
                  @click="handleDeleteCategory(cat)"
                  :disabled="cat.channels && cat.channels.length > 0"
                  :style="{ color: cat.channels && cat.channels.length > 0 ? '#8e9297' : '#f56c6c' }"
                >
                  🗑 删除分类
                  <span v-if="cat.channels && cat.channels.length > 0" style="font-size: 11px; color: #8e9297; margin-left: 4px;">
                    (有 {{ cat.channels.length }} 个频道)
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <!-- 分类下的频道列表 -->
        <div v-if="!collapsedMap.get(cat.id)" class="category-channels">
          <ChannelItem
            v-for="ch in cat.channels"
            :key="ch.id"
            :channel="ch"
            :server-id="globalStore.currentServerId!"
            :is-active="activeChannelId === ch.id"
            :unread-count="globalStore.unreadCounts.get(ch.id) || 0"
            @click="onChannelClick"
            @edit="handleEditChannel"
            @delete="handleDeleteChannel"
          />
        </div>
      </template>
    </div>

    <!-- 编辑频道弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑频道"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-position="top"
      >
        <el-form-item label="频道名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入频道名称"
            maxlength="32"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="主题" prop="topic">
          <el-input
            v-model="editForm.topic"
            placeholder="请输入频道主题（可选）"
            maxlength="256"
            show-word-limit
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 重命名分类弹窗 -->
    <el-dialog
      v-model="renameDialogVisible"
      title="重命名分类"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="renameFormRef"
        :model="renameForm"
        :rules="renameRules"
        label-position="top"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入分类名称"
            maxlength="16"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="renameLoading" @click="submitRename">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建频道弹窗 -->
    <el-dialog
      v-model="createChannelDialog"
      title="创建频道"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" @submit.prevent="createChannel">
        <el-form-item label="频道名称">
          <el-input
            v-model="newChannel.name"
            placeholder="输入频道名称"
            maxlength="32"
            show-word-limit
            @keydown.enter="createChannel"
          />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="newChannel.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createChannelDialog = false">取消</el-button>
        <el-button type="primary" :loading="creatingChannel" @click="createChannel">创建</el-button>
      </template>
    </el-dialog>

    <UserPanel />
  </aside>
</template>

<style lang="scss" scoped>
.channel-panel {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  height: 100%;
  background-color: var(--background-secondary, #2b2d31);
}

.server-name-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
  user-select: none;
}
.server-name {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-category-btn {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover);
  }
}

.channel-tree {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.empty-hint {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  font-size: 14px;
  color: var(--font-secondary);
  text-align: center;

  .sub {
    font-size: 12px;
    opacity: 0.7;
  }
}

.category-header-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 2px;
  cursor: default;
  user-select: none;
}

.category-left {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  overflow: hidden;
}

.category-more {
  flex-shrink: 0;
  padding: 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 3px;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover);
  }
}

.category-menu {
  flex-shrink: 0;
}

.arrow {
  font-size: 10px;
  color: var(--font-secondary);
  transition: transform 0.2s;

  &.rotated {
    transform: rotate(90deg);
  }
}

.category-name {
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--font-main);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-add {
  flex-shrink: 0;
  padding: 0 5px;
  font-size: 14px;
  font-weight: 600;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 3px;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover);
  }
}

.category-channels {
  /* channels under this category */
}

.create-form {
  display: flex;
  gap: 4px;
  padding: 6px 12px;
}

.create-form-inline {
  display: flex;
  gap: 4px;
  padding: 4px 8px 8px 28px;
}

</style>