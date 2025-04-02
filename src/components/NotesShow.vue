<template>
  <div class="flex flex-col">
    <!-- 置顶便签 -->
    <div v-if="pinnedList.length > 0" class="card-container">
      <div v-for="item in pinnedList" :key="item.id" class="card-item pinned-card" @click="openEditor(item)">
        <el-card shadow="always" :style="{ backgroundColor: item.color }" class="fixed-card">
          <template #header>
            <div class="pin-container" @click.stop="toggleLock(item)" :class="{ 'hover-visible': item.lock == 'on' }">
              <svg>
                <use :xlink:href="item.lock === 'on' ? '#icon-pushpin-2-line' : '#icon-pushpin-line'"></use>
              </svg>
            </div>
            <div v-for="(img, index) in item.imgList" :key="index" class="card-header">
              <el-image :src="`/assets/Notesimages/${img}`" alt="Card image" class="image" />
            </div>
          </template>
          <div>
            <h1 class="centered-title">{{ item.title }}</h1>
          </div>
          <div v-html="formatText(item.text)" class="card-content"></div>
          <template #footer>
            <div class="flex gap-2 mb-2">
              <el-tag v-for="(tag, index) in item.tagList" :key="index" type="info" :class="getTagClass(item.color)">
                {{ tag }}
              </el-tag>
            </div>
            <div class="flex justify-start gap-2" style="margin-top: 10px;">
              <el-button circle title="弹出便签" icon="Top" @click.stop="openPopupNote(item)" :class="getButtonClass(item.color)" />
              <el-button circle title="归档" icon="FolderAdd" @click.stop="Archive(item.id)" :class="getButtonClass(item.color)" />
              <el-button circle title="删除便签" icon="Failed" @click.stop="confirmTrash(item.id)" :class="getButtonClass(item.color)" />
            </div>
          </template>
        </el-card>
      </div>
      <el-divider />
    </div>

    <!-- 非置顶的便签 -->
    <VueDraggable ref="el" v-model="nonPinnedList" :animation="150" ghost-class="ghost" class="card-container" @start="onStart"
      @update="onUpdate" @end="onEnd" :filter="'.locked-card'">
      <div v-if="nonPinnedList.length > 0" v-for="item in nonPinnedList" :key="item.id" class="card-item" @click="openEditor(item)" :class="{ 'locked-card': item.lock === 'on' }">
        <el-card shadow="always" :style="{ backgroundColor: item.color }" class="fixed-card">
          <template #header>
            <div class="pin-container" @click.stop="toggleLock(item)" :class="{ 'hover-visible': item.lock == 'on' }">
              <svg>
                <use :xlink:href="item.lock === 'on' ? '#icon-pushpin-2-line' : '#icon-pushpin-line'"></use>
              </svg>
            </div>
            <div v-for="(img, index) in item.imgList" :key="index" class="card-header">
              <el-image :src="`/assets/Notesimages/${img}`" alt="Card image" class="image" />
            </div>
          </template>
          <div>
            <h1 class="centered-title">{{ item.title }}</h1>
          </div>
          <div v-html="formatText(item.text)" class="card-content"></div>
          <template #footer>
            <div class="flex gap-2 mb-2">
              <el-tag v-for="(tag, index) in item.tagList" :key="index" type="info" :class="getTagClass(item.color)">
                {{ tag }}
              </el-tag>
            </div>
            <div class="flex justify-start gap-2" style="margin-top: 10px;">
              <el-button circle title="弹出便签" icon="Top" @click.stop="openPopupNote(item)" :class="getButtonClass(item.color)" />
              <el-button circle title="归档" icon="FolderAdd" @click.stop="Archive(item.id)" :class="getButtonClass(item.color)" />
              <el-button circle title="删除便签" icon="Failed" @click.stop="confirmTrash(item.id)" :class="getButtonClass(item.color)" />
            </div>
          </template>
        </el-card>
      </div>
    </VueDraggable>

    <NotesEdit v-model:visible="dialogVisible" :data="selectedCard" @refreshNotes="fetchNotes" @@close="closeEditor" />
    <FloatingButton @refreshNotes="fetchNotes" />
    <div class="flex justify-between">
      <preview-list :list="list" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { type DraggableEvent, VueDraggable } from "vue-draggable-plus";
import request from '@/utils/request';
import NotesEdit from "./NotesEdit.vue";
import FloatingButton from "./FloatingButton.vue";
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
  pinned?: boolean; // 添加 pinned 属性
  lock?: string; // 添加 lock 属性
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

// 初始化 list，确保非空
const list = ref<Notecard[]>([]);

// 计算置顶的便签
const pinnedList = computed(() => list.value.filter(item => item.lock === "on"));

// 计算非置顶的便签
const nonPinnedList = computed(() => list.value.filter(item => item.lock !== "on"));

// 监听 props.notes 的变化并更新 list
watch(() => props.notes, (newNotes) => {
  list.value = newNotes
    .map((item) => ({
      ...item,
      imgList: item.img ? item.img.split(",").filter((img) => img.trim() !== "") : [], // 过滤空图片
      tagList: item.tag ? item.tag.split(",").filter((tag) => tag.trim() !== "") : [], // 过滤空标签
    }))
    .sort((a, b) => a.order - b.order); // 按 order 排序
});

// 卡片点击事件
const dialogVisible = ref(false);

// 用于存储当前选中的便签
const selectedCard = ref<Notecard | null>(null);



// 获取数据
const fetchNotes = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    const data: LoginResponse = await request.get('/Notes/Noteslist', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      params: {
        userid: userId // 传递userid参数
      }
    });
    if (data.code === "200" && Array.isArray(data.data)) {
      list.value = data.data.map((item) => ({
        ...item,
        imgList: item.img ? item.img.split(",").filter((img) => img.trim() !== "") : [],
        tagList: item.tag ? item.tag.split(",").filter((tag) => tag.trim() !== "") : [],
      })).sort((a, b) => a.order - b.order); // 按 order 排序
      console.log("list updated:", list.value);
    } else {
      console.error("Unexpected response format:", data);
    }
  } catch (error) {
    ElMessage.error('获取便签数据失败，请检查网络连接');
    console.error("Failed to fetch notes:", error);
  }
};

// 拖拽结束事件，更新顺序
const onEnd = async () => {
  try {
    const newOrder = list.value.map((item, index) => ({
      id: item.id,
      order: index, // 设置新的顺序
    }));
    const data: LoginResponse = await request.put('/Notes/UpdateOrder', newOrder, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (data.code === "200") {
      console.log("Order updated successfully!");
    } else {
      console.error("Order update failed:", data);
    }
  } catch (error) {
    console.error("Failed to update order:", error);
  }
};

// 拖拽事件处理函数
const onStart = (e: DraggableEvent) => {
  console.log("start", e);
};

const onUpdate = (e: DraggableEvent) => {
  console.log("update", e);
  // 更新顺序
  list.value.forEach((item, index) => {
    item.order = index; // 每个项的 order 更新为新的顺序
  });
};

// 打开编辑页
const openEditor = (item: Notecard) => {
  selectedCard.value = { ...item }; // 克隆对象，避免直接修改原始数据
  dialogVisible.value = true;
};

// 关闭编辑页
const closeEditor = () => {
  dialogVisible.value = false;
};

// 归档事件
const Archive = async (id: number) => {
  try {
    const data: LoginResponse = await request.put('/Notes/Archive/Add', null, {
      params: { id },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (data.code === "200") {
      ElMessage.success("便签归档成功");
      fetchNotes(); // 重新获取便签列表
    } else {
      ElMessage.error("便签归档失败");
    }
  } catch (error) {
    ElMessage.error("便签归档失败，请检查网络连接");
  }
};

// 确认删除便签事件
const confirmTrash = (id: number) => {
  ElMessageBox.confirm(
    '是否将便签放入回收站（便签将在回收站存放10天）?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    Trash(id);
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 删除便签事件
const Trash = async (id: number) => {
  try {
    const data: LoginResponse = await request.put('/Notes/Trash/Add', null, {
      params: { id },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (data.code === "200") {
      ElMessage.success("便签已移到回收站");
      fetchNotes(); // 重新获取便签列表
    } else {
      ElMessage.error("便签删除失败");
    }
  } catch (error) {
    ElMessage.error("便签删除失败，请检查网络连接");
  }
};

// 判断颜色是否为白色
const isWhiteColor = (color: string) => {
  const whiteColors = ['#ffffff', 'rgb(255, 255, 255)', 'rgba(255, 255, 255, 1)'];
  return whiteColors.includes(color.toLowerCase());
};

// 获取标签样式
const getTagClass = (color: string) => {
  return isWhiteColor(color) ? '' : 'transparent-tag';
};

// 获取按钮样式
const getButtonClass = (color: string) => {
  return isWhiteColor(color) ? '' : 'transparent-button';
};

// 初始化时加载数据
onMounted(() => {
  fetchNotes();
  list.value.forEach(item => {
    item.pinned = false; // 初始化 pinned 状态为 false
    item.lock = item.lock || "off"; // 初始化 lock 字段为 "off"（如果为空）
  });
});

// 格式化文本，将换行符替换为 <br> 标签
const formatText = (text: string | null | undefined) => {
  return (text || '').replace(/\n/g, '<br>'); // 确保 text 为字符串
};

// 切换图钉状态
const togglePin = (item: Notecard) => {
  item.pinned = !item.pinned; // 切换 pinned 状态
  console.log(`Note ${item.id} pinned status:`, item.pinned);
};

// 切换锁定状态并更新数据库
const toggleLock = async (item: Notecard) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error("用户未登录或缺少必要的认证信息");
      return;
    }

    // 切换锁定状态
    item.lock = item.lock === "on" ? "off" : "on";

    // 更新数据库中的 lock 字段
    await request.put(`/Notes/UpdateLock`, { id: item.id, lock: item.lock }, {
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
  } catch (error) {
    console.error("Failed to update lock status:", error);
    ElMessage.error("更新锁定状态失败，请检查网络连接");
  }
};

// 在 Vue 中发送便签数据到 Electron 主进程
const openPopupNote = (item: Notecard) => {
  const noteData = {
    title: item.title,
    content: item.text.replace(/\n/g, '<br>'),
    backgroundColor: item.color,
    images: item.imgList.map(img => `http://localhost:5173/assets/Notesimages/${img}`),
  };

  if (typeof window !== 'undefined') {
    if (window.electron) {
      // Electron 环境下，通过 IPC 发送数据
      try {
        console.log("Electron API:", window.electron);
        window.electron.openNote(noteData);
        console.log("消息已发送到 Electron 主进程:", noteData);
      } catch (error) {
        console.error("发送消息到 Electron 主进程失败:", error);
        ElMessage.error("无法打开便签弹窗，请检查 Electron 主进程是否正常运行！");
      }
    } else {
      // 非 Electron 环境下，直接在新窗口打开 note.html，并使用 URL 传递数据
      console.warn("Electron API 不存在，直接在新窗口打开 note.html");
      
      // 构造 URL 参数
      const queryParams = new URLSearchParams({
        title: noteData.title,
        content: encodeURIComponent(noteData.content),
        backgroundColor: noteData.backgroundColor,
        images: encodeURIComponent(JSON.stringify(noteData.images)), // 传递 JSON 字符串
      }).toString();

      const noteWindow = window.open(`/electron/note.html?${queryParams}`, '_blank', 'width=400,height=500');
      
      if (!noteWindow) {
        ElMessage.error("弹出窗口被浏览器阻止，请允许弹出窗口！");
      }
    }
  } else {
    console.error("window 对象未定义，代码可能运行在非浏览器环境中");
  }
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
  flex: 1 1 300px;
  max-width: 300px;
  box-sizing: border-box;
  position: relative; /* 设置父容器为相对定位 */
}

.card-item .el-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-item .el-card .card-content {
  word-wrap: break-word; /* 自动换行 */
  word-break: break-word; /* 防止长单词溢出 */
  max-width: 100%; /* 限制文本宽度不超出卡片范围 */
  overflow-wrap: break-word; /* 兼容性处理 */
}

.pin-container {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.pin-container.hover-visible {
  opacity: 1;
}

.card-item:hover .pin-container {
  opacity: 1;
}

.pin-container svg {
  width: 20px;
  height: 20px;
  fill: rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease-in-out;
}

.pin-container svg:hover {
  transform: scale(1.2);
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.card-header {
  text-align: center;
}

/* 透明背景色样式 */
.transparent-tag {
  background-color: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.transparent-button {
  background-color: rgba(255, 255, 255, 0.5) !important;
  border: none !important;
}

/* 标题居中样式 */
.centered-title {
  text-align: center;
}

.empty-state {
  text-align: center;
  font-size: 18px;
  color: #999;
  margin-top: 20px;
}


</style>
