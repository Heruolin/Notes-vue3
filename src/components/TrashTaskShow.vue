<template>
  <div class="flex card-container">
    <div v-for="taskgroup in taskgroups" :key="taskgroup.id" class="card-item">
      <el-card shadow="always" class="fixed-card">
        <template #header>
          <div>
            <h1>{{ taskgroup.title }}</h1>
          </div>
        </template>
        <div>
          <div v-if="taskgroup.tasks?.filter(task => !task.completed).length > 0">未完成清单</div>
          <div v-for="task in taskgroup.tasks?.filter(task => !task.completed).sort((a, b) => a.order - b.order) ?? []" :key="task.id">
            <el-input v-model="task.name" type="text" style="max-width: 600px" placeholder="空白内容" class="input-with-select" disabled>
            </el-input>
          </div>
          <div v-if="taskgroup.tasks?.filter(task => task.completed).length > 0">已完成清单</div>
          <div v-for="task in taskgroup.tasks?.filter(task => task.completed).sort((a, b) => a.order - b.order) ?? []" :key="task.id">
            <el-input v-model="task.name" style="max-width: 600px" placeholder="空白内容" class="input-with-select" disabled>
            </el-input>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-start gap-2" style="margin-top: 10px;">
            <el-button circle type="success" title="还原" icon="RefreshRight" @click.stop="restore(taskgroup.id)" />
            <el-button circle type="danger" title="删除" icon="Delete" @click.stop="deleteTaskgroup(taskgroup.id)" />
          </div>
        </template>
      </el-card>
    </div>
    <div class="flex justify-between">
      <preview-list :list="taskgroups" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from "vue";
import axios from "axios";
import { ElMessage } from 'element-plus';

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
}

// 定义事件
const emit = defineEmits(['taskgroupRestored']);

// 初始化 taskgroups
const taskgroups = ref<Taskgroup[]>([]);

// 还原任务组事件
const restore = async (id: number) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response = await axios.put(`http://localhost:8080/Taskgroup/Trash/Restore`, null, {
      params: { id },
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    if (response.data && response.data.code === '200') {
      // 从列表中移除已还原的任务组
      taskgroups.value = taskgroups.value.filter(taskgroup => taskgroup.id !== id);
      ElMessage.success(`任务组还原成功`);
      // 触发父组件的事件，通知任务组已还原
      emit('taskgroupRestored', id);
    } else {
      console.error("Failed to restore taskgroup:", response.data.message);
    }
  } catch (error) {
    console.error("Error restoring taskgroup:", error);
  }
};

// 删除任务组事件
const deleteTaskgroup = async (id: number) => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    const response = await axios.delete(`http://localhost:8080/Taskgroup/Trash/Delete`, {
      params: { id },
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    if (response.data && response.data.code === '200') {
      // 从列表中移除已删除的任务组
      taskgroups.value = taskgroups.value.filter(taskgroup => taskgroup.id !== id);
      ElMessage.success(`任务组删除成功`);
    } else {
      console.error("Failed to delete taskgroup:", response.data.message);
    }
  } catch (error) {
    console.error("Error deleting taskgroup:", error);
  }
};

// 获取数据
const fetchTaskgroups = async () => {
  try {
    const token = localStorage.getItem("jwt_token"); // 获取存储的 token
    if (!token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response = await axios.get("http://localhost:8080/Taskgroup/Trash/Taskgrouplist", {
      headers: { Authorization: `Bearer ${token}` } // 携带 Authorization 头部
    });
    if (response.data && Array.isArray(response.data.data)) {
      taskgroups.value = response.data.data.sort((a, b) => b.order - a.order);
      console.log("taskgroups updated:", taskgroups.value);
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
