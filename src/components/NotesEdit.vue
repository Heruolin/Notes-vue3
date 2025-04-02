<template>
  <el-dialog v-model="visibleProxy" title="编辑便签" width="650px" align-center :show-close="false">
    <template #header>
      <!-- 图片区域 -->
      <div class="image-gallery">
        <div v-for="(image, index) in localData.imgList" :key="index" class="image-container">
          <el-image :src="`/assets/Notesimages/${image}`" alt="test image" class="image"
            :preview-src-list="localData.imgList.map(img => `/assets/Notesimages/${img}`)" :initial-index="index" />
          <el-button circle type="danger" size="small" icon="Delete" @click="() => deleteImage(index)" class="delete-btn" />
        </div>
      </div>    
    </template>
    <!-- 修改标题 -->
    <el-input v-model="localData.title" placeholder="请输入标题" style="width: 619px; margin-top: 5px;"></el-input>
    <!-- 便签内容 -->
    <div>
      <el-input v-model="localData.text" style="width: 619px; margin-top: 5px; margin-bottom: 8px;"
        :autosize="{ minRows: 6, maxRows: 20 }" type="textarea" placeholder="请输入内容" />
    </div>

    <!-- 标签 -->
    <div style="margin-bottom: -10px;">
      <el-tag v-for="(tag, index) in localData.tagList" :key="index" closable type="primary" effect="plain"
        @close="() => removeTag(index)" round>
        {{ tag }}
      </el-tag>
    </div>

    <template #footer>
      <!-- 底部按钮 -->
      <div class="footer-buttons">
        <div class="left-buttons">
          <el-button v-if="localData.id" circle title="添加图片" icon="Picture" @click="AddImg" />
          <el-button v-if="localData.id" circle title="添加标签" icon="CollectionTag" @click="AddTag" />
        </div>
        <el-color-picker v-model="localData.color" title="修改背景色" show-alpha @change="handleColorChange" class="right-button" />
      </div>
      <div>
        <el-button @click="close">保存</el-button>
      </div>
    </template>
    <el-dialog title="添加标签" v-model="centerDialogVisible" width="30%" :show-close="false" append-to-body align-center>
      <div>
        <el-table :data="tagList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55">
          </el-table-column>
          <el-table-column prop="tag" label="标签名称">
          </el-table-column>
        </el-table>
        <div style="text-align: right; margin-top: 10px;">
          <el-button @click="addSelectedTags">添加选中标签</el-button>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, onMounted } from 'vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
const centerDialogVisible = ref(false);

interface LoginResponse {
  code: string;
  message: string;
  user: {
    userid: number;
    username: string;
    password: string;
  };
  token: string;
  data: {
    fileName: string;
    data: { id: number; tag: string ;userid: number}[];
    code: string;
  };
}

// 定义接收的 props
const props = defineProps({
  data: Object,
  visible: Boolean,
});

// 定义 emit 事件
const emit = defineEmits(['update:visible', 'close', 'refreshNotes', 'refreshTags']);

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
      // 确保 id 被正确传递
      localData.value.id = newValue.id;
      localData.value.title = newValue.title;
      localData.value.text = newValue.text;
      localData.value.tagList = [...newValue.tagList]; // 深拷贝
      localData.value.imgList = [...newValue.imgList]; // 深拷贝
      localData.value.color = newValue.color;
    }
  },
  { deep: true, immediate: true }
);

const close = async () => {
  await save();
  emit('update:visible', false);
  emit('close');
};

const save = async () => {
  try {
    if (localData.value.id) {
      // 如果存在 id，说明是更新便签
      const data: LoginResponse = await request.put('/Notes/NotesUpdate', localData.value, {
        headers: {
          Authorization: `Bearer ${localData.value.token}`
        }
      });
      if (data.code === "200") {
        console.log('便签更新成功', data.message);
        emit('refreshNotes');  // 刷新便签列表
        emit('refreshTags'); // 通知主页刷新标签列表
      } else {
        console.error('更新失败', data.message);
      }
    } else {
      // 如果没有 id，说明是添加便签
      const userId = localStorage.getItem('userId'); // 从 localStorage 获取 userId
      console.log('当前登录用户的userid:', userId);
      if (userId) {
        localData.value.userid = parseInt(userId); // 设置当前登录用户的userid
      }
      const data: LoginResponse = await request.post('/Notes/NotesAdd', localData.value, {
        headers: {
          Authorization: `Bearer ${localData.value.token}`
        }
      });
      if (data.code === "200") {
        console.log('便签添加成功', data);
        emit('refreshNotes');  // 刷新便签列表
        emit('refreshTags'); // 通知主页刷新标签列表
      } else {
        console.error('添加失败', data);
      }
    }
  } catch (error) {
    console.error('请求错误', error);
  }
};

// 处理颜色变化
const handleColorChange = (color: string) => {
  localData.value.color = color;
};

// 重置便签数据
const resetNoteData = () => {
  localData.value = {
    id: null,
    userid: null,
    title: '',
    text: '',
    tag: '',
    img: null,
    color: '',
    order: 0,
    imgList: [],
    tagList: []
  };
};

// 添加标签
const AddTag = () => {
  centerDialogVisible.value = true;
  fetchTags();  // 在点击添加标签按钮时获取最新的标签数据
  console.log("添加标签事件");
};

//图片添加按钮
const AddImg = () => {
  // 创建一个隐藏的文件上传按钮
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  // 监听文件上传事件
  input.addEventListener('change', handleImageUpload);

  // 模拟点击上传按钮
  input.click();
};

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null;

  if (file) {
    const uniqueName = `${Date.now()}-${file.name}`; // 使用时间戳+原文件名生成唯一文件名
    const formData = new FormData();
    formData.append('file', file, uniqueName);
    formData.append('id', localData.value.id); // 传递便签的 ID

    try {
      const data: LoginResponse = await request.post('/Notes/uploadImage', formData);
      if (data.code === "200") {
        const uploadedFileName = data.data.fileName;  // 读取返回的文件名
        localData.value.imgList.push(uploadedFileName); // 将上传的图片添加到图片列表中
        console.log('图片上传成功', uploadedFileName);
      } else {
        console.error('图片上传失败', data);
        alert('图片上传失败，请重试');
      }
    } catch (error) {
      console.error('图片上传失败', error);
      alert('图片上传失败，图片过大，或请检查网络连接');
    }
  } else {
    console.error('未选择文件');
    alert('请选择要上传的图片');
  }
};

// 删除图片
const deleteImage = (index: number) => {
  localData.value.imgList.splice(index, 1);
};

//背景色选择按钮
const BackgroundColor = () => {
  console.log("背景颜色事件")
}

const Archive = () => {
  centerDialogVisible.value = false
  console.log("归档事件")
}
//便签删除按钮
const Failed = () => {
  centerDialogVisible.value = false
  console.log("便签删除事件")
}

//删除标签
const removeTag = (index: number) => {
  localData.value.tagList.splice(index, 1);
};

const tagList = ref([]);
const selectedTags = ref([]);

// 获取标签列表
const fetchTags = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    if (!userId || !token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }
    
    const response: LoginResponse = await request.get('/Tag/Taglist', {
      headers: {
        Authorization: `Bearer ${token}` 
      },
      params: {
        userid: userId 
      }
    });
    
    if (response.code === '200' && Array.isArray(response.data)) {
      tagList.value = response.data.map((tag: { id: number; tag: string }) => ({
        id: tag.id,
        tag: tag.tag
      }));  // 更新标签列表
    } else {
      ElMessage.error('获取标签数据失败');
    }
  } catch (error) {
    ElMessage.error('获取标签数据失败，请检查网络连接');
    console.error('请求错误', error);
  }
};

// 在组件挂载时获取标签列表
onMounted(() => {
  fetchTags();
});

// 处理复选框选中变化
const handleSelectionChange = (val: any) => {
  selectedTags.value = val;
};

// 添加选中的标签到便签
const addSelectedTags = () => {
  let duplicateTags = [];
  selectedTags.value.forEach((tag: any) => {
    if (!localData.value.tagList.includes(tag.tag)) {
      localData.value.tagList.push(tag.tag);  
    } else {
      duplicateTags.push(tag.tag);
    }
  });

  if (duplicateTags.length > 0) {
    ElMessage({
      message: `标签 ${duplicateTags.join(', ')} 已存在，无法重复添加`,
      type: 'warning',
    });
  }

  centerDialogVisible.value = false;
  emit('refreshTags'); // 通知父组件刷新标签列表
};
</script>


<style scoped>
/* 图片区域 */
.image-gallery {
  display: flex;
  flex-wrap: wrap;
  /* 换行支持 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
  gap: 10px;
  /* 图片间距 */
  padding: 10px;
}

/* 每张图片容器 */
.image-container {
  flex-shrink: 0;
  /* 图片不缩小 */
  max-width: 619px;
  /* 限制图片最大宽度 */
  position: relative;
  display: flex;
  justify-content: center;
  /* 图片居中 */
  align-items: center;
  /* 图片居中 */
}

/* 图片样式 */
.image {
  width: auto;
  max-width: 100%;
  /* 图片宽度限制为容器的宽度 */
  max-height: 350px;
  /* 图片最高限制 */
  border-radius: 4px;
  /* 圆角样式 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  /* 图片阴影 */
}

/* 隐藏按钮 */
.delete-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: none;
  z-index: 10;
  transition: opacity 0.3s ease-in-out;
}

/* 鼠标悬停时显示按钮 */
.image-container:hover .delete-btn {
  display: inline-flex;
}

/* 底部按钮容器 */
.footer-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px; 
}

.left-buttons {
  display: flex;
  gap: 0px;
}

.right-button {
  margin-left: auto;
}
</style>
