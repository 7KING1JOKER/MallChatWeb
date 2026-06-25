<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useWsLoginStore } from '@/stores/ws'
import apis from '@/services/apis'

const userStore = useUserStore()
const wsLoginStore = useWsLoginStore()

const visible = ref(false)
const form = reactive({ username: '', password: '' })
const loading = ref(false)

// 暴露给外部调用的 show 方法
function show() { visible.value = true }
defineExpose({ show })

// 监听 v-login 指令触发的 showLogin
import { watch } from 'vue'
watch(() => wsLoginStore.showLogin, (v) => { if (v) visible.value = true })

async function handleLogin() {
  if (!form.username.trim() || !form.password.trim()) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const data = await apis.login({ username: form.username, password: form.password }).send()
    if (data) {
      userStore.isSign = true
      userStore.userInfo = { ...userStore.userInfo, ...data }
      if (data.token) {
        localStorage.setItem('TOKEN', data.token)
      }
      localStorage.setItem('USER_INFO', JSON.stringify(data))
      ElMessage.success('登录成功')
      visible.value = false
      wsLoginStore.showLogin = false
      form.username = ''
      form.password = ''
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败，请检查后端是否启动')
  } finally {
    loading.value = false
  }
}

function close() {
  visible.value = false
  wsLoginStore.showLogin = false
}
</script>

<template>
  <ElDialog class="login-box-modal" :width="400" v-model="visible" :close-on-click-modal="false" center @close="close">
    <div class="login-box">
      <img class="login-logo" src="@/assets/logo.jpeg" alt="MallChat" />
      <p class="login-slogan">账号密码登录</p>
      <el-form label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" @keydown.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">登 录</el-button>
      </el-form>
    </div>
  </ElDialog>
</template>

<style lang="scss" src="./styles.scss" scoped />
