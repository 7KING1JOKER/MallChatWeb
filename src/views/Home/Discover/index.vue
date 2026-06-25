<script setup lang="ts">
import { onMounted, ref } from 'vue'
import apis from '@/services/apis'
import type { ServerVO } from '@/services/types'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { useServerStore } from '@/stores/server'
const router = useRouter()
const globalStore = useGlobalStore()
const serverStore = useServerStore()
const servers = ref<ServerVO[]>([])
const loading = ref(false)
onMounted(async () => { loading.value = true; const data = await apis.discoverServers().send(); if (data) servers.value = data.list; loading.value = false })
async function join(sid: number) {
  try { await apis.joinServer(sid).send() } catch { /* 可能已经加入 */ }
  await serverStore.getMyServers()
  await globalStore.enterServer(sid)
  await serverStore.getServerDetail(sid)
  router.push(`/servers/${sid}/channels/`)
}
</script>
<template>
  <div class="discover-page">
    <h2>发现公开服务器</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div class="server-grid">
      <div v-for="s in servers" :key="s.id" class="server-card" @click="join(s.id)">
        <el-avatar :size="56" shape="rounded" :src="s.icon">{{ s.name?.charAt(0) || 'S' }}</el-avatar>
        <div class="card-body"><div class="card-name">{{ s.name }}</div><div class="card-desc">{{ s.description || '暂无描述' }}</div><div class="card-meta">{{ s.memberCount || 0 }} 名成员</div></div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.discover-page { padding:24px;height:100%;overflow-y:auto }
h2 { margin-bottom:16px }
.loading { text-align:center;color:var(--font-secondary);padding:40px }
.server-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px }
.server-card { display:flex;gap:12px;padding:16px;background-color:var(--background-secondary);border-radius:8px;cursor:pointer;transition:box-shadow .2s;&:hover{box-shadow:0 2px 12px rgba(0,0,0,.2)} }
.card-body { flex:1;min-width:0 }
.card-name { font-size:16px;font-weight:600;margin-bottom:4px }
.card-desc { font-size:13px;color:var(--font-secondary);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
.card-meta { font-size:12px;color:var(--font-secondary) }
</style>
