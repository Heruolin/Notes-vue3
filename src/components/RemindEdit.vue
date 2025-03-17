<template>
  <el-dialog v-model="visibleProxy" title="编辑提醒" width="500px" align-center :show-close="false">
    <template #header>
      <!-- 提醒时间 -->
      <div class="flex justify-center">
        <el-date-picker v-model="localData.remindTime" type="datetime" placeholder="请选择提醒的时间" format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss" style="width: 450px;" />
      </div>
    </template>

    <!-- 提醒内容内容 -->
    <div class="flex justify-center">
      <el-input v-model="localData.text" maxlength="30" style="width: 450px" placeholder="请输入提醒内容" show-word-limit
        type="textarea" />
    </div>

    <template #footer>
      <div>
        <el-button @click="saveRemind">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import axios from 'axios';

// 定义接收的 props
const props = defineProps({
  data: Object,
  visible: Boolean,
});

// 定义 emit 事件
const emit = defineEmits(['update:visible', 'close', 'refreshRemind']);

// 创建一个 computed 代理 visible
const visibleProxy = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    emit('update:visible', value);
  }
});

// 其他逻辑，如处理数据、保存、关闭等
const localData = ref({ ...props.data });

// 监听 props.data 的变化（如果需要同步更新）
watch(
  () => props.data,
  (newValue) => {
    if (newValue) {
      localData.value = { ...newValue };
    }
  },
  { deep: true, immediate: true }
);

const saveRemind = async () => {
  try {
    const remindData = {
      id: localData.value.id,
      text: localData.value.text,
      remindTime: localData.value.remindTime,
      order: localData.value.order,
      status: localData.value.status || '未提醒' // 新添加的提醒默认状态为未提醒
    };

    let response;
    if (remindData.id) {
      response = await axios.put('http://localhost:8080/Remind/RemindUpdate', remindData);
    } else {
      // 新添加的提醒默认排在最前面
      remindData.order = -1;
      response = await axios.post('http://localhost:8080/Remind/RemindAdd', remindData);
    }

    if (response.data.code === '200') {
      console.log('提醒保存成功');
      emit('refreshRemind'); // 刷新提醒列表
      emit('update:visible', false); // 关闭对话框
    } else {
      console.error('提醒保存失败', response.data.message);
    }
  } catch (error) {
    console.error('请求错误', error);
  }
};

// 重置提醒数据
const resetRemindData = () => {
  localData.value = {
    id: null,
    userid: null,
    text: '',
    remindTime: '',
    order: 0,
    status: '未提醒' // 重置时默认状态为未提醒
  };
};
</script>

<style scoped>
.flex {
  display: flex;
}

.justify-center {
  justify-content: center;
}
</style>