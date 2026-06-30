<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { Select, CloseBold, EditPen } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { SexEnum } from '@/enums'
import apis from '@/services/apis'
import { judgeClient } from '@/utils/detectDevice'

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
const editName = reactive({ isEdit: false, tempName: '', saving: false })
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

watchEffect(() => {
  if (value.value) userStore.getUserMeAction()
})

const onEditName = () => {
  editName.isEdit = true
  editName.tempName = userInfo.value.nickname || ''
}

function logout() {
  userStore.isSign = false
  userStore.userInfo = {}
  localStorage.removeItem('TOKEN')
  localStorage.removeItem('USER_INFO')
  // 清除服务器和全局状态，避免侧边栏残留
  const serverStore = useServerStore()
  const globalStore = useGlobalStore()
  serverStore.reset()
  globalStore.resetServerState()
  value.value = false
  ElMessage.success('已退出登录')
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
      <el-alert
        class="setting-tips"
        title="Tips: 昵称在服务器内可单独设置（服务器昵称）"
        type="info"
        :closable="false"
      />
      <el-button type="danger" class="logout-btn" @click="logout">退出登录</el-button>
    </div>
  </ElDialog>
</template>
<style lang="scss" src="./styles.scss" scoped />
