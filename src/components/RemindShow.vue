<template>
  <div class="flex">
    <VueDraggable ref="el" v-model="list" :animation="150" ghost-class="ghost" class="card-container" @start="onStart"
      @update="onUpdate" @end="onEnd">
      <div v-for="item in list" :key="item.id" class="card-item" @click="openEditor(item)">
        <el-card shadow="always" class="fixed-card">
          <template #header>
            <div class="centered-header">
              <h1>{{ item.remindTime }}</h1>
            </div>
          </template>
          <div>
            {{ item.text }}
          </div>

          <template #footer>
            <div class="flex justify-between items-center w-full" style="margin-top: 10px;">
              <div class="flex gap-2">
                <el-button circle title="归档" icon="FolderAdd" @click.stop="Archive(item.id)" />
                <el-button circle title="删除提醒" icon="Failed" @click.stop="confirmTrash(item.id)" />
              </div>
              <div class="status-text-container">
                <div :class="['status-text', 'bordered', item.status === '已提醒' ? 'reminded' : 'not-reminded']">
                  {{ item.status }}
                </div>
              </div>
            </div>
          </template>
        </el-card>
      </div>
    </VueDraggable>
    <RemindEdit v-model:visible="dialogVisible" :data="selectedCard" @refreshRemind="fetchReminds"
      @close="closeEditor" />
    <FloatingButton @refreshRemind="fetchReminds" />
    <div class="flex justify-between">
      <preview-list :list="list" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { type DraggableEvent, VueDraggable } from "vue-draggable-plus";
import axios from "axios";
import { ElMessage, ElMessageBox } from 'element-plus';
import RemindEdit from './RemindEdit.vue';
import FloatingButton from './FloatingButton.vue';
import { useCssVar } from '@vueuse/core'

// 定义接口
interface Remindcard {
  id: number;
  userid: number;
  text: string;
  remindTime: string;
  order: number;
  status: string;
}

// 初始化 list
const list = ref<Remindcard[]>([]);

// 定义 radius 属性
const radius = ref({ type: 'round' });

// 卡片点击事件
const dialogVisible = ref(false);

// 用于存储当前选中的提醒
const selectedCard = ref<Remindcard | null>(null);

// 获取数据
const fetchReminds = async () => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    const userId = localStorage.getItem("userId"); // 获取存储的用户ID
    if (!token || !userId) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.get("http://localhost:8080/Remind/Remindlist", {
      params: { userid: userId }, // 携带用户ID
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    if (response.data && Array.isArray(response.data.data)) {
      list.value = response.data.data.sort((a, b) => a.order - b.order);
      console.log("Reminds loaded:", list.value);
    } else {
      console.error("Unexpected response format:", response.data);
    }
  } catch (error) {
    console.error("Failed to fetch reminds:", error);
  }
};

// 拖拽结束事件，更新顺序
const onEnd = async () => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const newOrder = list.value.map((item, index) => ({
      id: item.id,
      order: index, // 设置新的顺序
    }));
    await axios.put("http://localhost:8080/Remind/UpdateOrder", newOrder, {
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    console.log("Order updated successfully!");
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
const openEditor = (item: Remindcard) => {
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
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.put("http://localhost:8080/Remind/Archive/Add", null, {
      params: { id },
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    if (response.data.code === "200") {
      ElMessage.success("提醒归档成功");
      fetchReminds(); // 重新获取提醒列表
    } else {
      ElMessage.error("提醒归档失败");
    }
  } catch (error) {
    ElMessage.error("提醒归档失败，请检查网络连接");
  }
};

// 确认删除提醒事件
const confirmTrash = (id: number) => {
  ElMessageBox.confirm(
    '是否将提醒放入回收站（提醒将在回收站存放10天）?',
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

// 删除提醒事件
const Trash = async (id: number) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.put("http://localhost:8080/Remind/Trash/Add", null, {
      params: { id },
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    if (response.data.code === "200") {
      ElMessage.success("提醒已移到回收站");
      fetchReminds(); // 重新获取提醒列表
    } else {
      ElMessage.error("提醒删除失败");
    }
  } catch (error) {
    ElMessage.error("提醒删除失败，请检查网络连接");
  }
};

// 初始化时加载数据
onMounted(() => {
  fetchReminds();
  checkReminders();
});

// 检查提醒时间并弹出通知
const checkReminders = () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    setInterval(() => {
      const now = new Date().getTime();
      list.value.forEach(async item => {
        const remindTime = new Date(item.remindTime).getTime();
        if (remindTime <= now && remindTime + 60000 > now && item.status !== '已提醒') { // 提醒时间在当前时间前后1分钟内且未提醒
          new Notification("提醒", {
            body: item.text,
          });
          // 更新提醒状态为已提醒
          const token = localStorage.getItem("jwt_token"); // 获取存储的 token
          if (!token) {
            ElMessage.error('用户未登录或缺少必要的认证信息');
            return;
          }

          item.status = '已提醒';
          await axios.put('http://localhost:8080/Remind/RemindUpdate', item, {
            headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
          });
        }
      });
    }, 60000); // 每分钟检查一次
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        checkReminders();
      }
    });
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
  /* 卡片宽度 */
  max-width: 300px;
  /* 卡片宽度 */
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

/* 居中样式 */
.centered-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-text-container {
  display: flex;
  justify-content: flex-end; /* 右对齐 */
  width: 100%;
}

.status-text {
  text-align: right;
  display: inline-block; /* 使边框贴合文字 */
  border: 1px solid #ccc; /* 添加边框 */
  padding: 2px 8px; /* 添加内边距 */
  border-radius: 4px; /* 添加圆角 */
}

.reminded {
  background-color: #67C23A; /* 已提醒背景色 */
  color: white; /* 已提醒文字颜色 */
}

.not-reminded {
  background-color: #F0F2F5; /* 未提醒背景色 */
  color: black; /* 未提醒文字颜色 */
}

.demo-radius .radius {
  height: 40px;
  width: 70%;
  border: 1px solid var(--el-border-color);
  border-radius: 0;
  margin-top: 20px;
}
</style>
