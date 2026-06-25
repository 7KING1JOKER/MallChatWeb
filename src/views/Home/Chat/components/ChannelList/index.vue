<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useRouter } from 'vue-router'
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
</script>
<template>
  <aside class="channel-panel">
    <div class="server-name">{{ serverStore.currentServer?.name || '选择服务器' }}</div>
    <div class="channel-tree">
      <template v-for="cat in categories" :key="cat.id">
        <CategoryHeader :category="cat" />
        <ChannelItem v-for="ch in cat.channels" :key="ch.id" :channel="ch" :is-active="activeChannelId === ch.id" @click="onChannelClick" />
      </template>
      <div v-if="!categories.length" class="empty-hint">暂无频道</div>
    </div>
    <UserPanel />
  </aside>
</template>
<style lang="scss" scoped>
.channel-panel { display:flex;flex-direction:column;width:240px;min-width:240px;background-color:var(--background-secondary,#2b2d31);height:100% }
.server-name { padding:12px 16px;font-size:15px;font-weight:600;border-bottom:1px solid var(--divider-color,rgba(255,255,255,.06));white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.channel-tree { flex:1;overflow-y:auto;padding:8px 0 }
.empty-hint { padding:16px;text-align:center;color:var(--font-secondary);font-size:13px }
</style>
