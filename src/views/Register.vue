<template>
  <div style="height: 100vh; display: flex; align-items: center; justify-content: center;background-color: rgb(121.3, 187.1, 255);">
      <div style="display: flex; background-color: white; width: 50%; border-radius: 5px; overflow: hidden;">
          <div style="flex: 1;">
              <img src="../assets/logo.png" alt="" style="width:100%">
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
            <el-form ref="userRef" :model="user" style="width:80%" status-icon :rules="rules" label-width="auto">
              <div style="font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px;">记事系统 - 注册</div>

              <!-- 帐号 -->
              <el-form-item label="帐号" prop="username" required>
                <el-input prefix-icon="User" placeholder="请输入帐号" v-model="user.username" />
              </el-form-item>

              <!-- 密码 -->
              <el-form-item label="密码" prop="password" required>
                <el-input type="password" show-password prefix-icon="Lock" placeholder="请输入密码" v-model="user.password" />
              </el-form-item>

              <!-- 确认密码 -->
              <el-form-item label="确认密码" prop="confirmPassword" required>
                <el-input type="password" show-password prefix-icon="Lock" placeholder="请确认密码" v-model="user.confirmPassword" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" style="width: 100%;" @click="submitForm(userRef)">注册</el-button>
              </el-form-item>

              <div>已有帐号？请<span style="color: #0f9876; cursor: pointer;" @click="goToLogin">登录</span></div>
            </el-form>
          </div>
      </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const userRef = ref<FormInstance>();
const router = useRouter();

const user = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

const validatePass = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请输入密码'));
  } else {
    callback();
  }
};

const validateConfirmPass = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请确认密码'));
  } else if (value !== user.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = reactive<FormRules<typeof user>>({
  username: [{ required: true, message: '请输入帐号', trigger: 'blur' }],
  password: [{ validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPass, trigger: 'blur' }],
});

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      request.post('/user/register', {
        username: user.username,
        password: user.password,
      }).then(res => {
        if (res.code === '200') {
          ElMessage.success('注册成功');
          router.push('/login');
        } else if (res.code === '400' && res.message === '用户名已存在') {
          ElMessage.error('用户名已存在，请选择其他用户名');
        } else {
          ElMessage.error('注册失败，请稍后再试');
        }
      }).catch(err => {
        console.error('注册失败', err);
        ElMessage.error('注册失败，请检查网络连接');
      });
    }
  });
};

const goToLogin = () => {
  router.push('/login');
};
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