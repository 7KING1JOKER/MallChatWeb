<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Delete, Search, Link } from '@element-plus/icons-vue'
import apis from '@/services/apis'
import type { ServerVO } from '@/services/types'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { useServerStore } from '@/stores/server'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const globalStore = useGlobalStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const servers = ref<ServerVO[]>([])
const loading = ref(false)
const searchQuery = ref('')

// 邀请码加入
const inviteCode = ref('')
const inviteLoading = ref(false)

// 搜索过滤
const filteredServers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return servers.value
  return servers.value.filter(
    (s) =>
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q),
  )
})

onMounted(async () => {
  loading.value = true
  const data = await apis.discoverServers().send()
  if (data) servers.value = data.list
  loading.value = false
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

async function join(sid: number) {
  try {
    await apis.joinServer(sid).send()
  } catch {
    /* 可能已经加入 */
  }
  await serverStore.getMyServers()
  await globalStore.enterServer(sid)
  await serverStore.getServerDetail(sid)
  router.push(`/servers/${sid}/channels/`)
}

async function deleteServer(sid: number, e: Event) {
  e.stopPropagation()
  try {
    await ElMessageBox.confirm(
      '删除后所有数据将无法恢复，确定要删除此服务器？',
      '删除服务器',
      {
        type: 'error',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }
  try {
    await serverStore.deleteServer(sid)
    servers.value = servers.value.filter((s) => s.id !== sid)
    ElMessage.success('服务器已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

// 通过邀请码加入
async function joinByInvite() {
  const input = inviteCode.value.trim()
  if (!input) {
    ElMessage.warning('请输入邀请码或邀请链接')
    return
  }

  inviteLoading.value = true
  try {
    let serverId: number | null = null
    let code = input

    // 1. 尝试匹配完整链接格式: /join/13?code=xxx 或 join/13?code=xxx
    const linkMatch = input.match(
      /(?:^|\/)(?:join\/)(\d+)(?:\?code=)([^\s&?]+)/,
    )
    if (linkMatch) {
      serverId = Number(linkMatch[1])
      code = linkMatch[2]
    }

    // 2. 尝试匹配纯邀请码
    if (!serverId && /^[a-zA-Z0-9]+$/.test(input)) {
      ElMessage.warning('请粘贴完整的邀请链接（格式：/join/服务器ID?code=邀请码）')
      inviteLoading.value = false
      return
    }

    // 3. 尝试从输入中提取 code 参数
    if (!serverId) {
      const codeMatch = input.match(/[?&]code=([^\s&?]+)/)
      if (codeMatch) {
        code = codeMatch[1]
        const sidMatch = input.match(/\/(\d+)(?:\?|$)/)
        if (sidMatch) {
          serverId = Number(sidMatch[1])
        }
      }
    }

    if (!serverId) {
      ElMessage.warning(
        '无法解析邀请链接，请粘贴完整链接（格式：/join/服务器ID?code=邀请码）',
      )
      inviteLoading.value = false
      return
    }

    await apis.joinByInvite(serverId, { code }).send()
    await serverStore.getMyServers()
    await globalStore.enterServer(serverId)
    await serverStore.getServerDetail(serverId)
    ElMessage.success('🎉 加入成功！')
    inviteCode.value = ''
    router.push(`/servers/${serverId}/channels`)
  } catch (error: any) {
    const errData = error?.data || error?.response?.data
    const errMsg = errData?.message || error?.message || '加入失败'
    ElMessage.error(errMsg)
  } finally {
    inviteLoading.value = false
  }
}
</script>

<template>
  <div class="discover-page">
    <!-- 顶部导航栏 -->
    <header class="discover-nav">
      <button class="nav-back-btn" @click="goBack">
        <span class="back-icon">
          <el-icon :size="18"><ArrowLeft /></el-icon>
        </span>
        <span class="back-label">返回</span>
      </button>

      <div class="nav-center">
        <h1 class="nav-title">发现服务器</h1>
      </div>

      <div class="nav-right">
        <div class="invite-compact">
          <el-input
            v-model="inviteCode"
            placeholder="邀请链接…"
            size="small"
            class="invite-input-compact"
            clearable
            @keydown.enter="joinByInvite"
          >
            <template #prefix>
              <el-icon :size="14"><Link /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            size="small"
            :loading="inviteLoading"
            class="invite-btn"
            @click="joinByInvite"
          >
            加入
          </el-button>
        </div>
      </div>
    </header>

    <!-- 搜索 & 统计栏 -->
    <div class="toolbar">
      <div class="search-wrap">
        <el-icon :size="16" class="search-icon"><Search /></el-icon>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索服务器名称或描述…"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          @click="searchQuery = ''"
        >
          <span>✕</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="discover-content">
      <!-- 加载态 -->
      <div v-if="loading" class="state-box">
        <div class="loader-pulse">
          <span class="pulse-dot" />
          <span class="pulse-dot" />
          <span class="pulse-dot" />
        </div>
        <p class="state-text">正在发现服务器…</p>
      </div>

      <!-- 空结果 -->
      <div v-else-if="searchQuery && filteredServers.length === 0" class="state-box">
        <div class="empty-illustration">
          <span class="empty-icon">🔍</span>
        </div>
        <p class="state-title">未找到匹配的服务器</p>
        <p class="state-desc">
          没有找到与「<strong>{{ searchQuery }}</strong>」相关的服务器
        </p>
        <button class="state-action" @click="searchQuery = ''">清除搜索</button>
      </div>

      <!-- 无服务器 -->
      <div v-else-if="!loading && servers.length === 0" class="state-box">
        <div class="empty-illustration">
          <span class="empty-icon">🌐</span>
        </div>
        <p class="state-title">暂无公开服务器</p>
        <p class="state-desc">还没有人创建公开服务器，去创建一个吧</p>
      </div>

      <!-- 服务器卡片网格 -->
      <div v-else class="server-grid">
        <div
          v-for="(s, idx) in filteredServers"
          :key="s.id"
          class="server-card"
          :style="{ animationDelay: `${idx * 0.05}s` }"
          @click="join(s.id)"
        >
          <div class="card-avatar">
            <el-avatar :size="52" shape="rounded" :src="s.icon">
              {{ s.name?.charAt(0) || 'S' }}
            </el-avatar>
          </div>

          <div class="card-body">
            <div class="card-name">{{ s.name }}</div>
            <div class="card-desc">{{ s.description || '暂无描述' }}</div>
            <div class="card-footer">
              <span class="card-meta">
                <span class="meta-dot" />
                {{ s.memberCount || 0 }} 名成员
              </span>
              <span class="card-tag">公开</span>
            </div>
          </div>

          <!-- 删除按钮 -->
          <el-tooltip
            v-if="userStore.userInfo?.id === s.ownerId"
            content="删除服务器"
            placement="top"
            :show-after="500"
          >
            <button
              class="delete-btn"
              @click="deleteServer(s.id, $event)"
            >
              <el-icon :size="15"><Delete /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ========== 页面容器 ========== */
.discover-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ========== 导航栏 ========== */
.discover-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin: 0 20px;
  margin-top: 12px;
  background: var(--background-secondary);
  border: 1px solid rgba(128, 128, 128, 0.08);
  border-radius: 14px;
  backdrop-filter: blur(12px);
}

.nav-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px 7px 10px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateX(-2px);
  }

  &:active {
    transform: translateX(-2px) scale(0.96);
  }
}

.back-icon {
  display: flex;
  align-items: center;
}

.nav-center {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.nav-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.nav-right {
  flex-shrink: 0;
}

.invite-compact {
  display: flex;
  align-items: center;
  gap: 6px;
}

.invite-input-compact {
  width: 195px;
  --el-input-bg-color: rgba(128, 128, 128, 0.04);
  --el-input-border-color: rgba(128, 128, 128, 0.1);
  --el-input-hover-border-color: rgba(128, 128, 128, 0.18);
  --el-input-focus-border-color: var(--el-color-primary);
}

.invite-btn {
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 8px;
}

/* ========== 搜索工具栏 ========== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  margin: 0 20px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
  height: 40px;
  background: var(--background-secondary);
  border: 1px solid rgba(128, 128, 128, 0.1);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: rgba(64, 150, 255, 0.35);
    box-shadow: 0 0 0 3px rgba(64, 150, 255, 0.08);
  }
}

.search-icon {
  flex-shrink: 0;
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.35);
  transition: opacity 0.3s, color 0.3s;

  .search-wrap:focus-within & {
    color: rgba(255, 255, 255, 0.7);
  }
}

.search-input {
  flex: 1;
  height: 100%;
  padding: 0 10px;
  font-size: 13.5px;
  color: #e8e8e8;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.3);
  border: none;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: rgba(128, 128, 128, 0.55);
    transform: scale(1.1);
  }
}

/* ========== 内容区 ========== */
.discover-content {
  flex: 1;
  padding: 0 20px 24px;
  overflow-y: auto;
}

/* ========== 状态占位 ========== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-illustration {
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.6;
  filter: grayscale(0.3);
}

.state-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.state-desc {
  margin: 0 0 20px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;

  strong {
    color: rgba(255, 255, 255, 0.75);
    font-weight: 500;
  }
}

.state-action {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-color-primary);
  cursor: pointer;
  background: rgba(64, 150, 255, 0.08);
  border: 1px solid rgba(64, 150, 255, 0.18);
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(64, 150, 255, 0.15);
    border-color: rgba(64, 150, 255, 0.3);
  }

  &:active {
    transform: scale(0.96);
  }
}

/* 加载动画 */
.loader-pulse {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  border-radius: 50%;
  animation: dotBounce 1.2s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.15s;
  }
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes dotBounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.35;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.state-text {
  margin: 0;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 服务器卡片网格 ========== */
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.server-card {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 18px;
  cursor: pointer;
  background: var(--background-secondary);
  border: 1px solid rgba(128, 128, 128, 0.06);
  border-radius: 14px;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s;
  animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(64, 150, 255, 0.15);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.08),
      0 2px 6px rgba(0, 0, 0, 0.04);

    .card-avatar {
      transform: scale(1.04);
    }
  }

  &:active {
    transform: translateY(-2px) scale(0.985);
  }
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头像区域 */
.card-avatar {
  position: relative;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}


/* 卡片内容 */
.card-body {
  flex: 1;
  min-width: 0;
  padding-right: 28px; /* 给删除按钮留空 */
}

.card-name {
  margin-bottom: 3px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 650;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.card-desc {
  color: rgba(255, 255, 255, 0.65);
  display: -webkit-box;
  margin-bottom: 8px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.45;
  color: var(--font-secondary);
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-dot {
  width: 6px;
  height: 6px;
  background: #67c23a;
  border-radius: 50%;
}

.card-tag {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

/* ========== 删除按钮 ========== */
.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #f56c6c;
  cursor: pointer;
  background: rgba(245, 108, 108, 0.06);
  border: 1px solid rgba(245, 108, 108, 0.12);
  border-radius: 9px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: #fff;
    background: #f56c6c;
    border-color: #f56c6c;
    box-shadow: 0 2px 10px rgba(245, 108, 108, 0.35);
    transform: translateX(0) scale(1.08);
  }

  &:active {
    transform: translateX(0) scale(0.92);
  }
}


/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .discover-nav {
    flex-wrap: wrap;
    gap: 10px;
  }

  .nav-subtitle {
    display: none;
  }

  .nav-right {
    width: 100%;
  }

  .invite-compact {
    width: 100%;
  }

  .invite-input-compact {
    flex: 1;
    width: auto;
  }

  .search-wrap {
    max-width: 100%;
  }

  .server-grid {
    grid-template-columns: 1fr;
  }
}
</style>
