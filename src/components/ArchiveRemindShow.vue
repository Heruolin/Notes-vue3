<template>
  <div class="flex card-container">
    <div v-for="item in list" :key="item.id" class="card-item">
      <el-card shadow="always" class="fixed-card">
        <template #header>
          <div class="centered-header">
            <h1>{{ item.remindTime }}</h1>
          </div>
        </template>
        <div>
          <h1 class="centered-title">{{ item.text }}</h1>
        </div>
        <template #footer>
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
interface Remindcard {
  id: number;
  userid: number;
  text: string;
  remindTime: string;
  order: number;
}

// 定义事件
const emit = defineEmits(['remindRestored']);

// 初始化 list
const list = ref<Remindcard[]>([]);

// 还原提醒事件
const restore = async (id: number) => {
  try {
    const response = await axios.put(`http://localhost:8080/Remind/Archive/Restore`, null, {
      params: { id }
    });
    if (response.data && response.data.code === '200') {
      // 从列表中移除已还原的提醒
      list.value = list.value.filter(item => item.id !== id);
      ElMessage.success(`提醒还原成功`);
      // 触发父组件的事件，通知提醒已还原
      emit('remindRestored', id);
    } else {
      console.error("Failed to restore remind:", response.data.message);
    }
  } catch (error) {
    console.error("Error restoring remind:", error);
  }
};

// 获取数据
const fetchReminds = async () => {
  try {
    const response = await axios.get("http://localhost:8080/Remind/Archive/Remindlist");
    if (response.data && Array.isArray(response.data.data)) {
      list.value = response.data.data.sort((a, b) => b.order - a.order);
      console.log("Reminds loaded:", list.value);
    } else {
      console.error("Unexpected response format:", response.data);
    }
  } catch (error) {
    console.error("Failed to fetch reminds:", error);
  }
};

// 初始化时加载数据
onMounted(() => {
  fetchReminds();
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
  flex: 1 1 300px; /* 卡片宽度 */
  max-width: 300px; /* 卡片宽度 */
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
</style>
