<template>
    <div class="flex card-container">
        <div v-for="item in list" :key="item.id" class="card-item">
            <el-card shadow="always" :style="{ backgroundColor: item.color }" class="fixed-card">
                <template #header>
                    <div v-for="(img, index) in item.imgList" :key="index" class="card-header">
                        <el-image :src="`/assets/Notesimages/${img}`" alt="Card image" class="image" />
                    </div>
                </template>
                <div>
                    <h1 class="centered-title">{{ item.title }}</h1>
                </div>
                <div v-html="formatText(item.text)">
                </div>
                <template #footer>
                    <div class="flex gap-2 mb-2">
                        <el-tag v-for="(tag, index) in item.tagList" :key="index" type="info">
                            {{ tag }}
                        </el-tag>
                    </div>
                    <div class="flex justify-start gap-2" style="margin-top: 10px;">
                        <el-button circle type="success" title="还原" icon="RefreshRight" @click.stop="restore(item.id)" />
                    </div>
                </template>
            </el-card>
        </div>
        <div class="flex justify-between">
            <preview-list :list="list" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from "vue";
import axios from "axios";
import { ElMessage } from 'element-plus';

// 定义接口
interface Notecard {
    id: number;
    userid: number;
    title: string;
    text: string;
    tag: string;
    img: string | null;
    color: string;
    order: number;
    imgList: string[];
    tagList: string[];
}
interface LoginResponse {
  code: string;
  message: string;
  user: {
    userid: number;
    username: string;
    password: string;
  };
  token: string;
  data: Notecard[];
}

// 接收父组件传递的 notes 属性
const props = defineProps<{ notes: Notecard[] }>();

// 定义事件
const emit = defineEmits(['noteRestored']);

// 初始化 list
const list = ref<Notecard[]>(props.notes);

// 还原便签事件
const restore = async (id: number) => {
    try {
        const response:LoginResponse = await axios.put(`http://localhost:8080/Notes/Archive/Restore`, null, {
            params: { id }
        });
        if (response.data && response.code === '200') {
            // 从列表中移除已还原的便签
            list.value = list.value.filter(item => item.id !== id);
            ElMessage.success(`便签还原成功`);
            // 触发父组件的事件，通知便签已还原
            emit('noteRestored', id);
        } else {
            console.error("Failed to restore note:", response.message);
        }
    } catch (error) {
        console.error("Error restoring note:", error);
    }
};

// 获取数据
const fetchNotes = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    if (!userId || !token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response: LoginResponse = await axios.get("http://localhost:8080/Notes/Archive/Noteslist", {
      headers: {
        Authorization: `Bearer ${token}` // 传递Authorization头部
      },
      params: {
        userid: userId // 传递userid参数
      }
    });
    if (response.data && Array.isArray(response.data)) {
      list.value = response.data.map((item) => ({
        ...item,
        imgList: item.img ? item.img.split(",") : [],
        tagList: item.tag ? item.tag.split(",") : [],
      })).sort((a, b) => b.order - a.order);
      console.log("list updated:", list.value); 
    } else {
      console.error("Unexpected response format:", response.data);
    }
  } catch (error) {
    console.error("Failed to fetch notes:", error);
  }
};

// 初始化时加载数据
onMounted(() => {
    fetchNotes();
});

// 格式化文本，将换行符替换为 <br> 标签
const formatText = (text: string) => {
    return text.replace(/\n/g, '<br>');
};

</script>

<style scoped>
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    padding: 16px;
}

.card-item {
    flex: 1 1 300px; /* 略微加大宽度 */
    max-width: 300px; /* 略微加大宽度 */
    box-sizing: border-box;
}

.ghost {
    opacity: 0.5;
    background: #c8ebfb;
}

.card-header {
    text-align: center;
}

/* 标题居中样式 */
.centered-title {
    text-align: center;
}
</style>
