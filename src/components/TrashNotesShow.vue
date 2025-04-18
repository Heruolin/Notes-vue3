<template>
    <div class="flex card-container" v-if="list.length > 0"> <!-- 确保 list 有数据时才渲染 -->
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
                        <el-button circle title="还原" icon="RefreshRight" @click.stop="restore(item.id)" type="success" />
                        <el-button circle title="删除" icon="Delete" @click.stop="deleteNote(item.id)" type="danger"/>
                    </div>
                </template>
            </el-card>
        </div>
    </div>
    <div v-else class="empty-state">暂无回收站便签</div> 
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from 'element-plus';

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

// 初始化 list，确保非空
const list = ref<Notecard[]>([]);

// 还原便签事件
const restore = async (id: number) => {
    try {
        const token = localStorage.getItem('jwt_token'); // 获取存储的 token
        if (!token) {
            ElMessage.error('缺少必要的认证信息');
            return;
        }
        const response = await axios.put(`http://localhost:8080/Notes/Trash/Restore`, null, {
            headers: {
                Authorization: `Bearer ${token}` // 传递 Authorization 头部
            },
            params: { id }
        });
        if (response.data && response.data.code === '200') {
            // 从列表中移除已还原的便签
            list.value = list.value.filter(item => item.id !== id);
            ElMessage.success(`便签还原成功`);
            // 触发父组件的事件，通知便签已还原
            emit('noteRestored', id);
            fetchNotes(); // 重新获取便签列表
        } else {
            console.error("Failed to restore note:", response.data.message);
        }
    } catch (error) {
        console.error("Error restoring note:", error);
    }
};

// 删除便签事件
const deleteNote = async (id: number) => {
    ElMessageBox.confirm(
        '是否要永久删除该便签（此操作将无法撤回）?',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        try {
            const token = localStorage.getItem('jwt_token'); // 获取存储的 token
            const response = await axios.delete(`http://localhost:8080/Notes/Trash/Delete`, {
                headers: {
                Authorization: `Bearer ${token}` // 传递 Authorization 头部
                },
                params: { id }
            });
            if (response.data && response.data.code === '200') {
                // 从列表中移除已删除的便签
                list.value = list.value.filter(item => item.id !== id);
                ElMessage.success(`便签删除成功`);
                fetchNotes(); // 重新获取便签列表
            } else {
                console.error("Failed to delete note:", response.data.message);
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    }).catch(() => {
        ElMessage.info('已取消删除');
    });
};

// 获取数据
const fetchNotes = async () => {
    try {
        const userId = localStorage.getItem('userId'); // 获取当前用户的 userid
        const token = localStorage.getItem('jwt_token'); // 获取存储的 token
        if (!userId || !token) {
            ElMessage.error('用户未登录或缺少必要的认证信息');
            return;
        }
        const response = await axios.get("http://localhost:8080/Notes/Trash/Noteslist", {
            headers: {
                Authorization: `Bearer ${token}` // 传递 Authorization 头部
            },
            params: {
                userid: userId // 传递 userid 参数
            }
        });
        if (response.data && Array.isArray(response.data.data)) {
            list.value = response.data.data.map((item) => ({
                ...item,
                imgList: item.img ? item.img.split(",") : [],
                tagList: item.tag ? item.tag.split(",") : [],
            })).sort((a, b) => b.order - a.order);
        } else {
            console.error("Unexpected response format:", response.data);
            ElMessage.error('获取回收站便签数据失败');
        }
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        ElMessage.error('获取回收站便签数据失败，请检查网络连接');
    }
};

// 格式化文本，将换行符替换为 <br> 标签
const formatText = (text: string | null | undefined) => {
    return text ? text.replace(/\n/g, '<br>') : ""; 
};

// 初始化时加载数据
onMounted(() => {
    fetchNotes();
});
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
