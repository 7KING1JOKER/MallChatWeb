<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useRouter } from 'vue-router'
import ServerIcon from './ServerIcon.vue'
import CreateServerModal from './CreateServerModal.vue'

const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const createModalRef = ref<InstanceType<typeof CreateServerModal>>()

onMounted(() => { serverStore.getMyServers() })

const servers = computed(() => serverStore.servers)
const activeServerId = computed(() => globalStore.currentServerId)

async function onServerClick(serverId: number) {
  await globalStore.enterServer(serverId)
  await serverStore.getServerDetail(serverId)
  router.push('/')
}
</script>

<template>
  <nav class="server-list">
    <router-link to="/discover" class="discover-link" title="发现服务器">
      <el-avatar shape="rounded" :size="48" class="discover-icon">🧭</el-avatar>
    </router-link>
    <div class="server-icons">
      <ServerIcon
        v-for="s in servers" :key="s.id" :server="s"
        :is-active="activeServerId === s.id"
        :unread-count="[...globalStore.unreadCounts.values()].reduce((a,b) => a+b, 0) || undefined"
        @click="onServerClick"
      />
    </div>
    <div class="divider" />
    <div class="create-server-btn" @click="createModalRef?.open()">
      <el-avatar shape="rounded" :size="48" class="add-server-icon">
        <el-icon :size="24"><IEpPlus /></el-icon>
      </el-avatar>
    </div>
    <CreateServerModal ref="createModalRef" />
  </nav>
</template>

<style lang="scss" scoped>
.server-list { display: flex; flex-direction: column; align-items: center; padding: 12px 0; width: 72px; background-color: var(--background-dark, #1e1e2e); min-height: 100%; overflow-y: auto; }
.discover-link { margin-bottom:4px;.discover-icon{font-size:24px;display:flex;align-items:center;justify-content:center;background:var(--bg-hover,rgba(255,255,255,.05));transition:border-radius .2s;&:hover{border-radius:30%;background:var(--el-color-primary)}} }
.server-icons { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.divider { width: 32px; height: 2px; background-color: var(--divider-color, rgba(255,255,255,0.1)); margin: 8px 0; border-radius: 1px; }
.create-server-btn { cursor: pointer; .add-server-icon { background-color: var(--bg-hover, rgba(255,255,255,0.05)); transition: background-color 0.2s, border-radius 0.2s; &:hover { background-color: var(--el-color-primary); border-radius: 30%; } } }
</style>
