<script setup lang="ts">
import { computed, ref } from 'vue'
import apis from '@/services/apis'
import { ElMessage } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useRouter } from 'vue-router'
import { ChannelType } from '@/services/types'
import CategoryHeader from './CategoryHeader.vue'
import ChannelItem from './ChannelItem.vue'
import UserPanel from '../UserPanel.vue'

const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const categories = computed(() => serverStore.currentDetail?.categories || [])
const activeChannelId = computed(() => globalStore.currentChannelId)

function onChannelClick(channelId: number) {
  globalStore.enterChannel(channelId)
  const sid = globalStore.currentServerId
  if (sid) router.push(`/servers/${sid}/channels/${channelId}`)
}

// 创建频道
const showCreate = ref(false)
const newChannel = ref({ name: '', categoryId: 0 })

async function createChannel() {
  const sid = globalStore.currentServerId
  if (!sid || !newChannel.value.name.trim()) return
  try {
    // 如果没有分类，先创建默认分类
    let catId = newChannel.value.categoryId
    if (!catId && !categories.value.length) {
      const cat = await apis.createCategory(sid, { name: '文字频道' }).send()
      catId = cat.id
    } else if (!catId && categories.value.length) {
      catId = categories.value[0].id
    }
    await apis.createChannel(sid, { name: newChannel.value.name, type: ChannelType.TEXT, categoryId: catId || undefined }).send()
    ElMessage.success('频道创建成功')
    showCreate.value = false
    newChannel.value.name = ''
    // 刷新服务器详情
    serverStore.getServerDetail(sid)
  } catch {
    ElMessage.error('创建失败')
  }
}
</script>
<template>
  <aside class="channel-panel">
    <div class="server-name">{{ serverStore.currentServer?.name || '选择服务器' }}</div>
    <div class="channel-tree">
      <template v-for="cat in categories" :key="cat.id">
        <CategoryHeader :category="cat" />
        <ChannelItem v-for="ch in cat.channels" :key="ch.id" :channel="ch" :is-active="activeChannelId === ch.id" :unread-count="globalStore.unreadCounts.get(ch.id) || 0" @click="onChannelClick" />
      </template>
      <div v-if="!categories.length" class="empty-hint">暂无频道</div>
    </div>
    <!-- 创建频道 -->
    <div class="create-channel-bar">
      <div v-if="showCreate" class="create-form">
        <el-input v-model="newChannel.name" size="small" placeholder="频道名称" @keydown.enter="createChannel" />
        <el-button size="small" type="primary" @click="createChannel">创建</el-button>
        <el-button size="small" @click="showCreate = false">取消</el-button>
      </div>
      <div v-else class="create-btn" @click="showCreate = true">+ 创建频道</div>
    </div>
    <UserPanel />
  </aside>
</template>
<style lang="scss" scoped>
.channel-panel { display:flex;flex-direction:column;width:240px;min-width:240px;background-color:var(--background-secondary,#2b2d31);height:100% }
.server-name { padding:12px 16px;font-size:15px;font-weight:600;border-bottom:1px solid var(--divider-color,rgba(255,255,255,.06));white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.channel-tree { flex:1;overflow-y:auto;padding:8px 0 }
.empty-hint { padding:16px;text-align:center;color:var(--font-secondary);font-size:13px }
.create-channel-bar { padding:8px 12px;border-top:1px solid var(--divider-color,rgba(255,255,255,.06)) }
.create-btn { padding:6px;font-size:13px;color:var(--font-secondary);cursor:pointer;border-radius:4px;&:hover{color:var(--font-main);background-color:var(--bg-hover)} }
.create-form { display:flex;gap:4px }
</style>
