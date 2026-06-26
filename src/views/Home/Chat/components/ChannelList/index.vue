<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import apis from '@/services/apis'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useRouter } from 'vue-router'
import { ChannelType } from '@/services/types'
import type { ChannelVO } from '@/services/types'
import ChannelItem from './ChannelItem.vue'
import UserPanel from '../UserPanel.vue'

const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()

/** 服务器下拉菜单 */
const showServerMenu = ref(false)
function toggleServerMenu() {
  showServerMenu.value = !showServerMenu.value
}
function goSettings() {
  const sid = globalStore.currentServerId
  if (sid) router.push(`/servers/${sid}/settings`)
  showServerMenu.value = false
}
function goMembers() {
  const sid = globalStore.currentServerId
  if (sid) router.push(`/servers/${sid}/members`)
  showServerMenu.value = false
}
function goSearch() {
  const sid = globalStore.currentServerId
  if (sid) router.push(`/servers/${sid}/search`)
  showServerMenu.value = false
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

// 创建频道
const showCreate = ref(false)
const newChannel = ref({ name: '', categoryId: 0 })

async function createChannel() {
  const sid = globalStore.currentServerId
  if (!sid || !newChannel.value.name.trim()) return
  try {
    const cats = categories.value
    let catId = newChannel.value.categoryId
    if (!catId && !cats.length) {
      // 没有分类时，先创建一个默认分类
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
    showCreate.value = false
    newChannel.value.name = ''
    serverStore.getServerDetail(sid)
  } catch {
    ElMessage.error('创建失败')
  }
}
</script>
<template>
  <aside class="channel-panel">
    <!-- 服务器名称 + 下拉菜单 -->
    <div class="server-name-bar" @click="toggleServerMenu">
      <span class="server-name">{{ serverStore.currentServer?.name || '未选择服务器' }}</span>
      <el-icon class="server-chevron" :class="{ rotated: showServerMenu }"><IEpArrowDown /></el-icon>
      <div v-if="showServerMenu" class="server-dropdown" @click.stop>
        <div class="dropdown-item" @click="goMembers">
          <span class="dd-icon">👥</span> 成员列表
        </div>
        <div class="dropdown-item" @click="goSearch">
          <span class="dd-icon">🔍</span> 搜索消息
        </div>
        <div class="dropdown-sep" />
        <div class="dropdown-item" @click="goSettings">
          <span class="dd-icon">⚙️</span> 服务器设置
        </div>
        <div class="dropdown-item" @click="showServerMenu = false">
          <span class="dd-icon">✕</span> 关闭菜单
        </div>
      </div>
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
        <div class="category-header-item" @click="toggleCategory(cat.id)">
          <el-icon :class="['arrow', { rotated: !collapsedMap.get(cat.id) }]">
            <IEpArrowRight />
          </el-icon>
          <span class="category-name">{{ cat.name }}</span>
        </div>
        <!-- 分类下的频道列表 -->
        <div v-if="!collapsedMap.get(cat.id)" class="category-channels">
          <ChannelItem
            v-for="ch in cat.channels"
            :key="ch.id"
            :channel="ch"
            :is-active="activeChannelId === ch.id"
            :unread-count="globalStore.unreadCounts.get(ch.id) || 0"
            @click="onChannelClick"
          />
        </div>
      </template>
    </div>

    <!-- 创建频道（仅在有服务器时显示） -->
    <div v-if="hasServer" class="create-channel-bar">
      <div v-if="showCreate" class="create-form">
        <el-input
          v-model="newChannel.name"
          size="small"
          placeholder="频道名称"
          @keydown.enter="createChannel"
        />
        <el-button size="small" type="primary" @click="createChannel">创建</el-button>
        <el-button size="small" @click="showCreate = false">取消</el-button>
      </div>
      <div v-else class="create-btn" @click="showCreate = true">+ 创建频道</div>
    </div>

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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
  transition: background-color 0.15s;
  user-select: none;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 5%));
  }
}
.server-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.server-chevron {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--font-secondary);
  transition: transform 0.2s;
  &.rotated {
    transform: rotate(180deg);
  }
}
.server-dropdown {
  position: absolute;
  top: 100%;
  left: 8px;
  z-index: 200;
  width: 200px;
  padding: 6px;
  margin-top: 4px;
  background-color: var(--background-wrapper, #272a37);
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 8%));
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 40%);
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.12s;
  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover, rgba(255, 255, 255, 6%));
  }
}
.dd-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
}
.dropdown-sep {
  height: 1px;
  margin: 4px 8px;
  background-color: var(--divider-color, rgba(255, 255, 255, 8%));
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
  gap: 4px;
  align-items: center;
  padding: 10px 12px 4px;
  font-size: 12px;
  color: var(--font-secondary, #949ba4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--font-main);
  }
}

.arrow {
  font-size: 10px;
  transition: transform 0.2s;

  &.rotated {
    transform: rotate(90deg);
  }
}

.category-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-channels {
  /* channels under this category */
}

.create-channel-bar {
  padding: 8px 12px;
  border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
}

.create-btn {
  padding: 6px;
  font-size: 13px;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover);
  }
}

.create-form {
  display: flex;
  gap: 4px;
}
</style>
