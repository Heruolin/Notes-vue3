<template>
    <div class="popup-container">
      <el-card v-if="note" class="popup-card">
        <template #header>
          <h2>{{ note.title }}</h2>
        </template>
        <div v-html="note.text"></div>
        <template #footer>
          <el-button type="danger" @click="closePopup">关闭</el-button>
        </template>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  
  const route = useRoute();
  const router = useRouter();
  const note = ref(null);
  
  onMounted(() => {
    const noteData = route.query.data;
    if (noteData) {
      try {
        note.value = JSON.parse(decodeURIComponent(noteData));
      } catch (e) {
        console.error("解析便签数据失败", e);
      }
    }
  });
  
  const closePopup = () => {
    router.push("/index"); // 关闭弹窗后跳回主页面
  };
  </script>
  
  <style scoped>
  .popup-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: rgba(0, 0, 0, 0.1);
  }
  .popup-card {
    width: 400px;
    padding: 20px;
  }
  </style>
  