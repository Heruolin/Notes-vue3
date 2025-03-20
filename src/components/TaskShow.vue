<template>
  <div class="flex">
    <VueDraggable ref="el" v-model="taskgroups" :animation="150" ghost-class="ghost" class="card-container"
      @start="onStart" @update="onUpdate" @end="onEnd" :filter="'.locked-card'">
      <div v-for="taskgroup in taskgroups" :key="taskgroup.id" class="card-item" :class="{ 'locked-card': taskgroup.lock === 'on' }">
        <el-card shadow="always" class="fixed-card" @click="openEditor(taskgroup)">
          <template #header>
            <div class="pin-container" @click.stop="toggleLock(taskgroup)" :class="{ 'hover-visible': taskgroup.lock === 'on' }">
              <svg>
                <use :xlink:href="taskgroup.lock === 'on' ? '#icon-pushpin-2-line' : '#icon-pushpin-line'"></use>
              </svg>
            </div>
            <div>
              <h1>{{ taskgroup.title }}</h1>
            </div>
          </template>
          <div>
            <div v-if="taskgroup.tasks?.filter(task => !task.completed).length > 0">未完成清单</div>
            <div v-for="task in taskgroup.tasks?.filter(task => !task.completed).sort((a, b) => a.order - b.order) ?? []" :key="task.id">
              <el-input v-model="task.name" type="text" style="max-width: 600px" placeholder="空白内容" class="input-with-select">
                <template #append>
                  <div class="button-group">
                    <el-button @click.stop="markAsComplete(taskgroup.id, task.id)" :icon="Check" />
                    <el-button @click.stop="removeTask(taskgroup.id, task.id)" :icon="CloseBold" />
                  </div>
                </template>
              </el-input>
            </div>
            <div v-if="taskgroup.tasks?.filter(task => task.completed).length > 0">已完成清单</div>
            <div v-for="task in taskgroup.tasks?.filter(task => task.completed).sort((a, b) => a.order - b.order) ?? []" :key="task.id">
              <el-input v-model="task.name" style="max-width: 600px" placeholder="空白内容" class="input-with-select" disabled>
                <template #append>
                  <div class="button-group">
                    <el-button @click.stop="markAsIncomplete(taskgroup.id, task.id)" :icon="RefreshRight" />
                    <el-button @click.stop="removeTask(taskgroup.id, task.id)" :icon="CloseBold" />
                  </div>
                </template>
              </el-input>
            </div>
          </div>
          <template #footer>
            <div class="flex justify-start gap-2" style="margin-top: 10px;">
              <el-button circle title="归档" icon="FolderAdd" @click.stop="archiveTaskgroup(taskgroup.id)" />
              <el-button circle title="删除清单" icon="Failed" @click.stop="confirmTrash(taskgroup.id)" />
            </div>
          </template>
        </el-card>
      </div>
    </VueDraggable>
    <TaskEdit v-model:visible="dialogVisible" :data="selectedTaskgroup" @refreshTaskgroups="fetchTaskgroups" @close="closeEditor" />
    <FloatingButton @refreshTaskgroups="fetchTaskgroups" />
    <div class="flex justify-between">
      <preview-list :list="taskgroups" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineProps, computed } from "vue";
import { type DraggableEvent, VueDraggable  } from "vue-draggable-plus";
import TaskEdit from "./TaskEdit.vue";
import axios from "axios";
import FloatingButton from "./FloatingButton.vue";
import { ElMessage, ElMessageBox } from 'element-plus';
import { DCaret, Check, CloseBold, RefreshRight } from '@element-plus/icons-vue';

// 定义接口
interface Task {
  id: number;
  taskgroupId: number;
  name: string;
  completed: boolean;
  order: number;
}

interface Taskgroup {
  id: number;
  userid: number;
  title: string;
  tasks: Task[];
  order: number;
  status: string; // 添加 status 字段
  lock?: string; // 添加 lock 属性
}

// 初始化 taskgroups
const taskgroups = ref<Taskgroup[]>([]);
// token
const token = localStorage.getItem("token");
// 卡片点击事件
const dialogVisible = ref(false);

// 用于存储当前选中的任务组
const selectedTaskgroup = ref<Taskgroup | null>(null);

const fetchTaskgroups = async () => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    const userId = localStorage.getItem("userId"); // 获取存储的用户ID
    if (!token || !userId) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.get("http://localhost:8080/Taskgroup/Taskgrouplist", {
      headers: { Authorization: `Bearer ${token}` }, // 携带 Authorization 头部
      params: { userid: userId } // 传递用户ID
    });

    if (response.data && Array.isArray(response.data.data)) {
      taskgroups.value = response.data.data.sort((a, b) => a.order - b.order); // 确保 taskgroups 按 order 排序
      console.log("Taskgroups loaded:", taskgroups.value);

      // 获取每个任务组的任务
      for (const taskgroup of taskgroups.value) {
        const taskResponse = await axios.get("http://localhost:8080/Task/Tasklist", {
          headers: { Authorization: `Bearer ${token}` }, // 携带 Authorization 头部
          params: { taskgroupId: taskgroup.id }
        });

        if (taskResponse.data && Array.isArray(taskResponse.data.data)) {
          taskgroup.tasks = taskResponse.data.data.sort((a, b) => a.order - b.order); // 确保 tasks 按 order 排序
        } else {
          taskgroup.tasks = []; // 如果没有任务，初始化为空数组
          console.error("Unexpected task response format:", taskResponse.data);
        }
        if (!Array.isArray(taskgroup.tasks)) {
          taskgroup.tasks = [];
        }
      }
    } else {
      console.error("Unexpected response format:", response.data);
    }
  } catch (error) {
    console.error("Failed to fetch taskgroups:", error);
  }
};

// 监听 refreshTaskgroups 事件来更新任务组
const refreshTaskgroups = () => {
  fetchTaskgroups(); // 刷新任务组列表
};

// 初始化时加载数据
onMounted(() => {
  fetchTaskgroups();
  taskgroups.value.forEach(taskgroup => {
    taskgroup.lock = taskgroup.lock || "off"; // 初始化 lock 字段为 "off"（如果为空）
  });
});

// 监听 refreshTaskgroups 事件
const props = defineProps<{ refreshTaskgroups: boolean }>();
watch(() => props.refreshTaskgroups, refreshTaskgroups);

// 拖拽结束事件，更新顺序
const onEnd = async () => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const newOrder = taskgroups.value.map((item, index) => ({
      id: item.id,
      order: index, // 设置新的顺序
    }));
    await axios.put("http://localhost:8080/Taskgroup/UpdateOrder", newOrder, {
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
  taskgroups.value.forEach((item, index) => {
    item.order = index; // 每个项的 order 更新为新的顺序
  });
};

// 打开编辑页
const openEditor = (item: Taskgroup) => {
  selectedTaskgroup.value = { ...item }; // 克隆对象，避免直接修改原始数据
  dialogVisible.value = true;
};

// 关闭编辑页
const closeEditor = () => {
  dialogVisible.value = false;
  fetchTaskgroups(); // 关闭编辑页后刷新任务组列表
};

// 归档事件
const archiveTaskgroup = async (id: number) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.put("http://localhost:8080/Taskgroup/Archive/Add", null, {
      headers: { Authorization: `Bearer ${token}` }, // 携带 Authorization 头部
      params: { id }
    });
    if (response.data.code === "200") {
      ElMessage.success("任务组归档成功");
      fetchTaskgroups(); // 重新获取任务组列表
    } else {
      ElMessage.error("任务清单归档失败");
    }
  } catch (error) {
    ElMessage.error("任务清单归档失败，请检查网络连接");
  }
};

// 确认删除任务组事件
const confirmTrash = (id: number) => {
  ElMessageBox.confirm(
    '是否将任务清单放入回收站（任务组将在回收站存放10天）?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    trashTaskgroup(id);
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 删除任务组事件
const trashTaskgroup = async (id: number) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.put("http://localhost:8080/Taskgroup/Trash/Add", null, {
      headers: { Authorization: `Bearer ${token}` }, // 携带 Authorization 头部
      params: { id }
    });
    if (response.data.code === "200") {
      ElMessage.success("任务组已移到回收站");
      fetchTaskgroups(); // 重新获取任务组列表
    } else {
      ElMessage.error("任务组删除失败");
    }
  } catch (error) {
    ElMessage.error("任务组删除失败，请检查网络连接");
  }
};

// 删除任务
const removeTask = async (taskgroupId: number, taskId: number) => {
  try {
    await axios.delete("http://localhost:8080/Task/TaskDelete", {
      headers: { Authorization: `Bearer ${token}` },
      params: { id: taskId }
    });
    const taskgroup = taskgroups.value.find(group => group.id === taskgroupId);
    if (taskgroup) {
      taskgroup.tasks = taskgroup.tasks.filter(task => task.id !== taskId);
    }
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
};

// 标记任务为已完成
const markAsComplete = async (taskgroupId: number, taskId: number) => {
  try {
    const taskgroup = taskgroups.value.find(group => group.id === taskgroupId);
    if (taskgroup) {
      const task = taskgroup.tasks.find(task => task.id === taskId);
      if (task) {
        task.completed = true;
        await axios.put("http://localhost:8080/Task/TaskUpdate", task);
      }
    }
  } catch (error) {
    console.error("Failed to mark task as complete:", error);
  }
};

// 标记任务为未完成
const markAsIncomplete = async (taskgroupId: number, taskId: number) => {
  try {
    const taskgroup = taskgroups.value.find(group => group.id === taskgroupId);
    if (taskgroup) {
      const task = taskgroup.tasks.find(task => task.id === taskId);
      if (task) {
        task.completed = false;
        await axios.put("http://localhost:8080/Task/TaskUpdate", task);
      }
    }
  } catch (error) {
    console.error("Failed to mark task as incomplete:", error);
  }
};

// 过滤出状态为 actived和teashed 的任务清单
const activeTaskgroups = computed(() => {
  return taskgroups.value.filter(taskgroup => taskgroup.status !== 'archived' && taskgroup.status !== 'trashed');
});

// 切换锁定状态并更新数据库
const toggleLock = async (taskgroup: Taskgroup) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error("用户未登录或缺少必要的认证信息");
      return;
    }

    // 切换锁定状态
    taskgroup.lock = taskgroup.lock === "on" ? "off" : "on";

    // 更新数据库中的 lock 字段
    await axios.put("http://localhost:8080/Taskgroup/UpdateLock", { id: taskgroup.id, lock: taskgroup.lock }, {
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
  } catch (error) {
    console.error("Failed to update lock status:", error);
    ElMessage.error("更新锁定状态失败，请检查网络连接");
  }
};

// 初始化时加载数据
onMounted(() => {
  fetchTaskgroups();
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
  flex: 1 1 300px; /* 固定宽度 */
  max-width: 300px; /* 固定宽度 */
  box-sizing: border-box;
  position: relative; /* 设置父容器为相对定位 */
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

.button-group {
  display: flex;
  gap: 27px; /* 增加按钮之间的间距 */
}

.pin-container {
  position: absolute;  /* 绝对定位 */
  top: 6px;  /* 调整与顶部的距离 */
  right: 6px;  /* 调整与右侧的距离 */
  z-index: 10;  /* 确保图钉在最上层 */
  cursor: pointer;  /* 鼠标变成手型 */
  width: 20px; /* 调整容器大小 */
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.2s ease-in-out;
}

.pin-container svg {
  width: 20px;  /* 缩小图标 */
  height: 20px;
  fill: rgba(0, 0, 0, 0.5);  /* 让图标颜色稍暗，增强对比度 */
  transition: transform 0.2s ease-in-out;
}

.pin-container svg:hover {
  transform: scale(1.2); /* 鼠标悬停时放大 */
}

.pin-container.hover-visible {
  opacity: 1; /* 鼠标悬浮时显示 */
}

.card-item:hover .pin-container {
  opacity: 1; /* 鼠标悬浮时显示 */
}

.pin-container svg {
  width: 20px;  /* 缩小图标 */
  height: 20px;
  fill: rgba(0, 0, 0, 0.5);  /* 让图标颜色稍暗，增强对比度 */
  transition: transform 0.2s ease-in-out;
}

.pin-container svg:hover {
  transform: scale(1.2); /* 鼠标悬停时放大 */
}

.locked-card {
  pointer-events: auto; /* 允许点击事件 */
}
</style>
