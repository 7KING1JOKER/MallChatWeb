<script setup lang="ts">
import { computed, reactive, watchEffect, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Select, CloseBold, EditPen } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { SexEnum } from '@/enums'
import apis from '@/services/apis'
import { judgeClient } from '@/utils/detectDevice'

// ============ 声明在最前面 ============
const client = judgeClient()
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  },
})

// ============ Stores ============
const userStore = useUserStore()
const serverStore = useServerStore()
const globalStore = useGlobalStore()

// ============ 缓存函数 ============
function getCachedNickname(serverId: number, userId: number): string {
  try {
    const key = `server_nickname_${serverId}_${userId}`
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function setCachedNickname(serverId: number, userId: number, nickname: string) {
  try {
    const key = `server_nickname_${serverId}_${userId}`
    if (nickname) {
      localStorage.setItem(key, nickname)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

// ============ 响应式状态 ============
const editName = reactive({ isEdit: false, tempName: '', saving: false })
const serverNicknameEdit = reactive({ isEdit: false, tempName: '', saving: false })

const userInfo = computed(() => userStore.userInfo)
const currentServerId = computed(() => globalStore.currentServerId)

// 使用 ref 存储显示昵称，便于手动更新
const displayServerNickname = ref('')

// 更新显示的服务器昵称
function updateDisplayServerNickname() {
  if (!currentServerId.value || !userInfo.value?.id) {
    displayServerNickname.value = ''
    return
  }
  
  const member = serverStore.members.find(m => m.userId === userInfo.value?.id)
  if (member?.serverNickname) {
    displayServerNickname.value = member.serverNickname
    return
  }
  
  const cached = getCachedNickname(currentServerId.value, userInfo.value.id)
  if (cached) {
    displayServerNickname.value = cached
    return
  }
  
  displayServerNickname.value = ''
}

// 监听 members 变化
watchEffect(() => {
  updateDisplayServerNickname()
})

// 监听弹窗打开时刷新
watch(() => value.value, (open) => {
  if (open) {
    updateDisplayServerNickname()
  }
})

// 定时刷新
let timer: any = null
onMounted(() => {
  updateDisplayServerNickname()
  timer = setInterval(() => {
    if (value.value) {
      updateDisplayServerNickname()
    }
  }, 2000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

// 当前用户的服务器昵称（用于显示）
const serverNickname = computed(() => displayServerNickname.value)

const isInServer = computed(() => !!currentServerId.value)

// ============ 全局昵称 ============
const onEditName = () => {
  editName.isEdit = true
  editName.tempName = userInfo.value.nickname || ''
}

const onSaveUserName = async () => {
  if (!editName.tempName || editName.tempName.trim() === '') {
    ElMessage.warning('昵称不能为空哦~')
    return
  }
  if (editName.tempName === userInfo.value.nickname) {
    ElMessage.warning('昵称和当前一样的哦~')
    return
  }
  editName.saving = true
  try {
    await apis.updateUserMe({ nickname: editName.tempName }).send()
    userStore.userInfo.nickname = editName.tempName
    ElMessage.success('修改成功')
  } catch {
    ElMessage.error('修改失败')
  } finally {
    onCancelEditName()
  }
}

const onCancelEditName = () => {
  editName.saving = false
  editName.isEdit = false
  editName.tempName = ''
}

// ============ 服务器昵称 ============
const onEditServerNickname = () => {
  serverNicknameEdit.isEdit = true
  serverNicknameEdit.tempName = serverNickname.value || ''
}

const onSaveServerNickname = async () => {
  if (!currentServerId.value) {
    ElMessage.warning('请先进入服务器')
    return
  }

  const newName = serverNicknameEdit.tempName.trim()
  
  if (newName === serverNickname.value) {
    ElMessage.warning('昵称和当前一样的哦~')
    onCancelServerNickname()
    return
  }

  serverNicknameEdit.saving = true
  try {
    await apis.updateMemberNickname(currentServerId.value, { nickname: newName || '' }).send()
    
    const member = serverStore.members.find(m => m.userId === userStore.userInfo?.id)
    if (member) {
      member.serverNickname = newName || ''
    }
    
    if (userStore.userInfo?.id) {
      setCachedNickname(currentServerId.value, userStore.userInfo.id, newName)
    }
    
    updateDisplayServerNickname()
    
    ElMessage.success('服务器昵称已更新')
    onCancelServerNickname()
  } catch (error: any) {
    console.error('更新服务器昵称失败:', error)
    const errMsg = error?.data?.message || error?.message || '修改失败'
    ElMessage.error(errMsg)
  } finally {
    serverNicknameEdit.saving = false
  }
}

const onCancelServerNickname = () => {
  serverNicknameEdit.saving = false
  serverNicknameEdit.isEdit = false
  serverNicknameEdit.tempName = ''
}

// ============ 退出登录 ============
function logout() {
  if (currentServerId.value && userStore.userInfo?.id) {
    const key = `server_nickname_${currentServerId.value}_${userStore.userInfo.id}`
    localStorage.removeItem(key)
  }
  
  userStore.isSign = false
  userStore.userInfo = {}
  localStorage.removeItem('TOKEN')
  localStorage.removeItem('USER_INFO')
  serverStore.reset()
  globalStore.resetServerState()
  value.value = false
  ElMessage.success('已退出登录')
}
</script>

<template>
  <ElDialog
    class="setting-box-modal"
    v-model="value"
    :width="client === 'PC' ? 580 : '85%'"
    :close-on-click-modal="false"
    center
  >
    <div class="setting-box">
      <div class="setting-avatar-box">
        <ElAvatar
          size="large"
          class="setting-avatar"
          :src="
            userInfo?.avatar ||
            'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
          "
        />
        <el-icon
          size="20"
          color="var(--font-main)"
          class="setting-avatar-sex"
          v-if="userInfo.sex && [SexEnum.MAN, SexEnum.REMALE].includes(userInfo.sex)"
          :style="{
            backgroundColor: `var(${
              userInfo.sex === SexEnum.MAN ? '--avatar-sex-bg-man' : '--avatar-sex-bg-female'
            })`,
          }"
        >
          <IEpFemale v-if="userInfo.sex === SexEnum.MAN" /><IEpMale
            v-if="userInfo.sex === SexEnum.REMALE"
          />
        </el-icon>
      </div>
      
      <div class="setting-name">
        <div class="name-edit-wrapper" v-show="editName.isEdit === false">
          <span class="user-name">{{ userInfo.nickname || '-' }}</span>
          <el-button
            class="name-edit-icon"
            size="small"
            :icon="EditPen"
            circle
            @click="onEditName"
          />
        </div>
        <div class="name-edit-wrapper" v-show="editName.isEdit">
          <ElInput type="text" v-model="editName.tempName" maxlength="16" />
          <el-button
            class="name-edit-icon"
            size="small"
            type="primary"
            :icon="Select"
            circle
            @click="onSaveUserName"
          />
          <el-button
            class="name-edit-icon"
            size="small"
            type="danger"
            :icon="CloseBold"
            circle
            @click="onCancelEditName"
          />
        </div>
      </div>

      <div v-if="isInServer" class="setting-server-nickname">
        <div class="server-nickname-label">
          <span class="label-icon">🏷️</span>
          <span class="label-text">服务器昵称</span>
          <span class="label-hint">（仅在此服务器生效）</span>
        </div>
        <div class="name-edit-wrapper" v-show="serverNicknameEdit.isEdit === false">
          <span class="user-name server-nickname-display">
            {{ serverNickname || '未设置（使用全局昵称）' }}
          </span>
          <el-button
            class="name-edit-icon"
            size="small"
            :icon="EditPen"
            circle
            @click="onEditServerNickname"
          />
        </div>
        <div class="name-edit-wrapper" v-show="serverNicknameEdit.isEdit">
          <ElInput 
            type="text" 
            v-model="serverNicknameEdit.tempName" 
            maxlength="16"
            placeholder="输入服务器昵称（留空则恢复全局昵称）"
          />
          <el-button
            class="name-edit-icon"
            size="small"
            type="primary"
            :icon="Select"
            circle
            :loading="serverNicknameEdit.saving"
            @click="onSaveServerNickname"
          />
          <el-button
            class="name-edit-icon"
            size="small"
            type="danger"
            :icon="CloseBold"
            circle
            @click="onCancelServerNickname"
          />
        </div>
      </div>

      <p class="setting-tips">💡 昵称在服务器内可单独设置（服务器昵称）</p>
      <el-button type="danger" class="logout-btn" @click="logout">退出登录</el-button>
    </div>
  </ElDialog>
</template>

<style lang="scss" src="./styles.scss" scoped />

<style lang="scss" scoped>
.setting-server-nickname {
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 6%));
}

.server-nickname-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: 13px;

  .label-icon {
    font-size: 14px;
  }

  .label-text {
    font-weight: 500;
    color: var(--font-main);
  }

  .label-hint {
    font-size: 12px;
    color: var(--font-secondary);
  }
}

.server-nickname-display {
  font-size: 14px;
  color: var(--font-secondary);
}

.server-nickname-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--font-secondary);
  opacity: 0.7;
}

.name-edit-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  .user-name {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
  }

  .name-edit-icon {
    flex-shrink: 0;
  }
}
</style>