<template>
  <el-dialog
    v-model="localVisible"
    title="修改标签"
    width="30%"
    :show-close="false"
    @open="fetchTags"
  >
    <div style="display: flex; align-items: center;">
      <el-input 
        v-model="newTag"
        placeholder="请输入新标签" 
        style="flex-grow: 1; margin-right: 10px;" />
      <el-button 
        @click="addTag" 
        :icon="Plus" 
        circle 
        style="padding: 5px 15px;"/>
    </div>
    <div v-for="(tag, index) in tags" :key="index" style="display: flex; align-items: center; margin-top: 10px;">
      <el-input 
        v-model="tag.tag" 
        v-show="tag.editing" 
        @blur="updateTag(tag)"
        style="flex-grow: 1; margin-right: 10px;" />
      <div 
        v-show="!tag.editing" 
        style="flex-grow: 1;" 
        @click="tag.editing = true">
        {{ tag.tag }}
      </div>
      <el-button 
        :icon="Failed" 
        circle 
        style="padding: 5px 15px; margin-left: 10px;"
        @click="deleteTag(tag.id)"/>
    </div>
    <template #footer>
        <div slot="footer" class="dialog-footer" style="text-align: right;">
      <el-button @click="closeDialog">关闭</el-button>
    </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, defineProps, watch, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Failed, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

interface LoginResponse {
  code: string;
  message: string;
  user: {
    userid: number;
    username: string;
    password: string;
  };
  token: string;
  data: {
    data: { id: number; tag: string ;userid: number}[];
    code: string;
  };
}

// 定义接收的 props
const props = defineProps({
  visible: Boolean,
})

// 定义 emit 事件
const emit = defineEmits(['update:visible', 'refreshTags'])

// 监听 props.visible 的变化
const localVisible = ref(props.visible)
watch(
  () => props.visible,
  (newValue) => {
    localVisible.value = newValue
  }
)

// 监听 localVisible 的变化并同步到父组件
watch(
  () => localVisible.value,
  (newValue) => {
    emit('update:visible', newValue)
  }
)

// 新标签输入框的值
const newTag = ref('')

// 标签列表
const tags = ref<{ id: number; tag: string; editing: boolean }[]>([])

// 关闭对话框
const closeDialog = () => {
  localVisible.value = false
}

// 获取标签数据
const fetchTags = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    console.log("Fetching tags for userId:", userId);
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    console.log("Fetching tags for jwt_token:", token);
    if (!userId || !token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response: LoginResponse = await axios.get('http://localhost:8080/Tag/Taglist', {
      headers: {
        Authorization: `Bearer ${token}` // 传递Authorization头部
      },
      params: {
        userid: userId // 传递userid参数
      }
    });
    console.log("Full response:", response);
    if (response.data.code === '200') {
      tags.value = response.data.data.map((tag: { id: number; tag: string }) => ({
        ...tag,
        editing: false
      }))
    } else {
      ElMessage.error('获取标签数据失败')
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      ElMessage.error('权限不足，请重新登录');
    } else {
      ElMessage.error('获取标签数据失败，请检查网络连接');
    }
  }
}

// 添加标签
const addTag = async () => {
  if (!newTag.value.trim()) {
    ElMessage.error('标签名称不能为空')
    return
  }

  // 检查标签是否已存在
  const existingTag = tags.value.find(tag => tag.tag === newTag.value.trim());
  if (existingTag) {
    ElMessage.error('标签已存在，无法重复添加');
    return;
  }

  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    if (!userId || !token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response: LoginResponse = await axios.post('http://localhost:8080/Tag/TagAdd', { tag: newTag.value.trim(), userid: userId }, {
      headers: {
        Authorization: `Bearer ${token}` // 传递Authorization头部
      }
    });
    if (response.data.code === '200') {
      ElMessage.success('标签添加成功')
      newTag.value = ''
      fetchTags() // 重新获取标签列表，确保标签列表立即更新
      emit('refreshTags') // 通知父组件刷新标签列表
    } else {
      ElMessage.error('标签添加失败')
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      ElMessage.error('权限不足，请重新登录');
    } else {
      ElMessage.error('标签添加失败，请检查网络连接');
    }
  }
}

// 更新标签
const updateTag = async (tag: { id: number; tag: string; editing: boolean }) => {
  tag.editing = false
  try {
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response: LoginResponse = await axios.put('http://localhost:8080/Tag/TagUpdate', { id: tag.id, tag: tag.tag }, {
      headers: {
        Authorization: `Bearer ${token}` // 传递Authorization头部
      }
    });
    if (response.data.code === '200') {
      ElMessage.success('标签更新成功')
      emit('refreshTags') // 通知父组件刷新标签列表
    } else {
      ElMessage.error('标签更新失败')
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      ElMessage.error('权限不足，请重新登录');
    } else {
      ElMessage.error('标签更新失败，请检查网络连接');
    }
  }
}

// 删除标签
const deleteTag = async (id: number) => {
  try {
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response: LoginResponse = await axios.delete(`http://localhost:8080/Tag/TagDelete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}` // 传递Authorization头部
      }
    });
    if (response.data.code === '200') {
      ElMessage.success('标签删除成功')
      tags.value = tags.value.filter(tag => tag.id !== id)
      emit('refreshTags') // 通知父组件刷新标签列表
    } else {
      ElMessage.error('标签删除失败')
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      ElMessage.error('权限不足，请重新登录');
    } else {
      ElMessage.error('标签删除失败，请检查网络连接');
    }
  }
}
</script>
