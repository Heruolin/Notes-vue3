<template>
  <div
    style="height: 100vh; display: flex; align-items: center; justify-content: center;background-color: rgb(148.6, 212.3, 117.1);">
    <div style="display: flex; background-color: white; width: 50%; border-radius: 5px; overflow: hidden;">
      <div style="flex: 1;">
        <img src="../assets/logo.png" alt="" style="width:100%">
      </div>
      <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <el-form ref="userRef" :model="user" style="width:80%" status-icon :rules="rules" label-width="auto"
          class="demo-user">
          <div style="font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px;">便签系统</div>
          <el-form-item label="帐号" prop="username">
            <el-input prefix-icon="User" size="default" placeholder="请输入帐号" v-model="user.username"
              autocomplete="off" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input show-password prefix-icon="Lock" size="default" placeholder="请输入密码" v-model="user.password"
              autocomplete="off" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="width: 100%;" @click="submitForm(userRef)" :loading="isSubmitting">登录</el-button>
          </el-form-item>
          <div>还没有帐号？请<span style="color: #0f9876; cursor: pointer;" @click="goToRegister">注册</span></div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'

const userRef = ref<FormInstance>()
const router = useRouter()

interface LoginResponse {
  code: string;
  message: string;
  user: {
    userid: number;
    username: string;
    password: string;
  };
  token: string;
}

// 用于防止重复提交
const isSubmitting = ref(false);

const user = reactive({
  username: '',
  password: '',
})

const rules = reactive<FormRules<typeof user>>({
  username: [{ required: true, message: '请输入帐号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl || isSubmitting.value) return; // 防止重复提交

  await formEl.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;  // 启动加载状态，防止重复点击

      try {
        const data: LoginResponse = await request.post('/user/login', user); // 登录请求
        console.log('后端返回数据:', data);

        if (data.code === "200") { // 登录成功
          // 将 JWT Token 存储到 localStorage 中
          const token = data.token;
          localStorage.setItem('jwt_token', token); // 存储 Token
          localStorage.setItem('user', JSON.stringify(data.user)); // 存储用户信息
          // 存储用户的 UserId
          const userId = data.user.userid;
          localStorage.setItem('userId', userId.toString()); // 存储 UserId

          // 跳转到首页
          router.push('/index');
          console.log("✅ 存储的 Token:", token);
          console.log("✅ 存储的 userid:", userId);
        } else {
          console.error('登录失败:', data.message);
        }
      } catch (error) {
        console.error('请求失败:', error.message || '服务器错误');
      } finally {
        isSubmitting.value = false;  // 重置加载状态
      }
    }
  });
};

const goToRegister = () => {
  router.push('/register')
}
</script>

<style lang="scss" scoped>
.login-page {
  border: 1.5px solid rgb(123, 109, 30);
  border-radius: 8px;
  width: 400px;
  margin: 0 auto;
  margin-top: 50px;
  padding: 20px;

  .code {
    text-align: center;
    margin-bottom: 10px;
  }

  .login_btn {
    width: 100%;
  }
}
</style>
