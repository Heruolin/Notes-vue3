<template>
  <el-dialog v-model="localDialogVisible" title="修改密码" width="500px">
    <el-form :model="user" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="原始密码" prop="oldPassword">
        <el-input type="password" show-password prefix-icon="Lock" placeholder="请输入原始密码" v-model="user.oldPassword" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input type="password" show-password prefix-icon="Lock" placeholder="请输入新密码" v-model="user.newPassword" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input type="password" show-password prefix-icon="Lock" placeholder="请确认新密码" v-model="user.confirmPassword" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// 定义接收的 props
const props = defineProps<{ dialogVisible: boolean }>();

// 定义 emit 事件
const emit = defineEmits(['update:dialogVisible']);

// 本地变量，用于绑定到 el-dialog
const localDialogVisible = ref(props.dialogVisible);

// 监听 props.dialogVisible 的变化
watch(
  () => props.dialogVisible,
  (newValue) => {
    localDialogVisible.value = newValue;
  }
);

// 监听 localDialogVisible 的变化并同步到父组件
watch(
  () => localDialogVisible.value,
  (newValue) => {
    emit('update:dialogVisible', newValue);
  }
);

// 表单数据
const user = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 表单校验规则
const rules = {
  oldPassword: [{ required: true, message: '请输入原始密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== user.newPassword) {
          callback(new Error('两次输入的新密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const formRef = ref();
const router = useRouter();

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const username = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).username : null;
        const userId = localStorage.getItem('userId'); 
        if (!username || !userId) {
          ElMessage.error('用户信息缺失，请重新登录');
          return;
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) {
          ElMessage.error('用户未登录或缺少必要的认证信息');
          return;
        }

        const response = await axios.post(
          'http://localhost:8080/user/changePassword',
          {
            username, 
            userid: userId, 
            oldPassword: user.oldPassword,
            newPassword: user.newPassword,
          },
          {
            headers: { Authorization: `Bearer ${token}` }, 
          }
        );
          console.log('修改密码返回数据:', response.data);
        if (response.data.code === '200') {
          ElMessage.success('密码修改成功，请重新登录');
          logout(); 
        } else {
          ElMessage.error(response.data.message || '密码修改失败');
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        ElMessage.error('修改密码失败，请检查网络连接');
      }
    }
  });
};

// 关闭对话框
const closeDialog = () => {
  localDialogVisible.value = false;
};

// 退出登录
const logout = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  router.push('/login');
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
