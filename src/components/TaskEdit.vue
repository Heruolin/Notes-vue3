<template>
  <el-dialog v-model="dialogVisible" title="编辑便签" width="600px" align-center :show-close="false">
    <template #header>
      <!-- 修改标题 -->
      <el-input v-model="localData.title" placeholder="请输入标题"></el-input>
    </template>
    <!-- 清单内容 -->
    <div>
      <div v-if="incompleteList.length > 0">未完成清单</div>
      <div class="flex justify-between">
        <VueDraggable v-model="incompleteList" :animation="150" handle=".handle" @end="updateOrder('incomplete')"
          class="flex flex-col gap-2 p-4 w-300px bg-gray-500/5 rounded">
          <div v-for="(item, index) in incompleteList" :key="item.id"
            class="h-50px bg-gray-500/5 px-2 rounded flex items-center justify-between">
            <IconSort class="handle cursor-move"></IconSort>
            <div class="mt-4">
              <el-input v-model="item.name" type="text" style="max-width: 600px" placeholder="请输入内容" class="input-with-select">
                <template #prepend>
                  <el-button :icon="DCaret" class="handle" />
                </template>
                <template #append>
                  <el-button @click="markAsComplete(index)" :icon="Check" />
                  <el-button @click="removeIncomplete(index)" :icon="CloseBold" />
                </template>
              </el-input>
            </div>
          </div>
          <div class="mt-4">
            <el-input v-model="newItemName" style="max-width: 600px" placeholder="请输入内容" class="input-with-select">
              <template #append>
                <el-button @click="handleAdd" :icon="Plus" />
              </template>
            </el-input>
          </div>
        </VueDraggable>
        <preview-list :list="incompleteList" />
      </div>
      <div v-if="completeList.length > 0">已完成清单</div>
      <div class="flex justify-between">
        <VueDraggable v-model="completeList" :animation="150" handle=".handle" @end="updateOrder('complete')"
          class="flex flex-col gap-2 p-4 w-300px bg-gray-500/5 rounded">
          <div v-for="(item, index) in completeList" :key="item.id"
            class="h-50px bg-gray-500/5 px-2 rounded flex items-center justify-between">
            <IconSort class="handle cursor-move"></IconSort>
            <div class="mt-4">
              <el-input v-model="item.name" type="text" style="max-width: 600px" placeholder="请输入内容" class="input-with-select">
                <template #prepend>
                  <el-button :icon="DCaret" class="handle" />
                </template>
                <template #append>
                  <el-button @click="markAsIncomplete(index)" :icon="RefreshRight" />
                  <el-button @click="removeComplete(index)" :icon="CloseBold" />
                </template>
              </el-input>
            </div>
          </div>
        </VueDraggable>
        <preview-list :list="completeList" />
      </div>
    </div>
    <template #footer>
      <div>
        <el-button @click="close">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { DCaret, Plus, CloseBold, Check, RefreshRight } from '@element-plus/icons-vue';
import { VueDraggable } from 'vue-draggable-plus';
import axios from "axios";

// 定义接收的 props
const props = defineProps({
  data: Object,
  visible: Boolean,
});

// 定义 emit 事件
const emit = defineEmits(['update:visible', 'close', 'refreshTask', 'refreshTaskgroups']);

// 其他逻辑，如处理数据、保存、关闭等
const localData = ref({ ...props.data });

// 监听 props.data 的变化
watch(
  () => props.data,
  (newValue) => {
    if (newValue) {
      localData.value = { ...newValue };
      incompleteList.value = localData.value.tasks ? localData.value.tasks.filter(task => !task.completed).sort((a, b) => a.order - b.order) : [];
      completeList.value = localData.value.tasks ? localData.value.tasks.filter(task => task.completed).sort((a, b) => a.order - b.order) : [];
    }
  },
  { deep: true, immediate: true }
);

const dialogVisible = ref(false);

// 监听 props.visible 的变化
watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue;
  },
  { immediate: true }
);

// 监听 dialogVisible 的变化
watch(
  () => dialogVisible.value,
  (newValue) => {
    emit('update:visible', newValue);
  }
);

// 定义未完成和已完成的 list 数据
const incompleteList = ref<
  {
    name: string;
    id: string;
    taskgroupId: string;
    completed: boolean;
    order: number;
  }[]
>([]);

const completeList = ref<
  {
    name: string;
    id: string;
    taskgroupId: string;
    completed: boolean;
    order: number;
  }[]
>([]);

// 新项名称
const newItemName = ref('');

// 添加新项
function handleAdd() {
  if (newItemName.value.trim() !== '') {
    const newTask = {
      name: newItemName.value.trim(),
      id: `${incompleteList.value.length + completeList.value.length + 1}-${Date.now()}`, // 确保每个任务的 id 唯一
      taskgroupId: localData.value.id,
      completed: false,
      order: incompleteList.value.length
    };
    incompleteList.value = [...incompleteList.value, newTask]; // 用新的数组替换原数组
    newItemName.value = ''; // 清空输入框
  }
}

// 删除未完成项
async function removeIncomplete(index: number) {
  const task = incompleteList.value.splice(index, 1)[0];
  if (task.id) {
    try {
      await axios.delete("http://localhost:8080/Task/TaskDelete", {
        params: { id: task.id }
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }
}

// 删除已完成项
async function removeComplete(index: number) {
  const task = completeList.value.splice(index, 1)[0];
  if (task.id) {
    try {
      await axios.delete("http://localhost:8080/Task/TaskDelete", {
        params: { id: task.id }
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }
}

// 标记为已完成
function markAsComplete(index: number) {
  const item = incompleteList.value.splice(index, 1)[0];
  item.completed = true;
  completeList.value.push(item);
  updateOrder('complete');
}

// 标记为未完成
function markAsIncomplete(index: number) {
  const item = completeList.value.splice(index, 1)[0];
  item.completed = false;
  incompleteList.value.push(item);
  updateOrder('incomplete');
}

// 更新任务顺序
function updateOrder(listType: 'incomplete' | 'complete') {
  const list = listType === 'incomplete' ? incompleteList.value : completeList.value;
  list.forEach((item, index) => {
    item.order = index;
  });
}

// 保存数据
async function save() {
  try {
    const updatedTasks = [...incompleteList.value, ...completeList.value];
    const updatedTaskgroup = { ...localData.value, tasks: updatedTasks };

    if (localData.value.id) {
      // 如果任务组存在 id，说明是更新任务组
      await axios.put("http://localhost:8080/Taskgroup/TaskgroupUpdate", updatedTaskgroup, {
        headers: { 'Content-Type': 'application/json' }
      });

      // 更新每个任务
      for (const task of updatedTasks) {
        if (typeof task.id === 'string' && task.id.includes('-')) {
          // 如果任务 id 包含 '-'，说明是新添加的任务
          await axios.post("http://localhost:8080/Task/TaskAdd", {
            name: task.name,
            taskgroupId: task.taskgroupId,
            completed: task.completed,
            order: task.order
          }, { headers: { 'Content-Type': 'application/json' } });
        } else {
          // 如果任务存在 id，说明是更新任务
          await axios.put("http://localhost:8080/Task/TaskUpdate", task, {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } else {
      // 如果任务组没有 id，说明是添加新任务组
      const response = await axios.post("http://localhost:8080/Taskgroup/TaskgroupAdd", updatedTaskgroup, {
        headers: { 'Content-Type': 'application/json' }
      });

      // 获取新添加的任务组的 id
      const newTaskgroupId = response.data.data;

      // 更新每个任务的 taskgroupId
      for (const task of updatedTasks) {
        task.taskgroupId = newTaskgroupId;
        await axios.post("http://localhost:8080/Task/TaskAdd", {
          name: task.name,
          taskgroupId: task.taskgroupId,
          completed: task.completed,
          order: task.order
        }, { headers: { 'Content-Type': 'application/json' } });
      }
    }

    emit('refreshTaskgroups'); // 刷新任务组列表
    console.log('Save button clicked');
  } catch (error) {
    console.error("Failed to save taskgroup:", error);
  }
}

// 关闭对话框
function close() {
  save();
  dialogVisible.value = false;
  emit('close');
  emit('refreshTaskgroups'); // 关闭对话框后刷新任务组列表
}

// 处理图标点击事件
function handleIconClick(item: { name: string; id: string }) {
  console.log('Icon clicked:', item);
}
</script>

<style scoped>
/* 底部按钮容器 */
.footer-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

/* 按钮容器 */
.button-container {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}
</style>
