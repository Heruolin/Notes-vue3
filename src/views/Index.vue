<template>
  <div class="common-layout">
    <el-container>
      <!-- 头部 -->
      <el-header>
        <div>
          <el-radio-group v-model="isCollapse" style="margin-bottom: 20px">
            <el-button
              @click="toggleCollapse"
              style="display: flex; align-items: center; margin-left: -7px;"
              size="large"
              circle 
            >
              <el-icon v-if="isCollapse" size="large"><Expand /></el-icon>
              <el-icon v-else size="large"><Fold /></el-icon>
            </el-button>
          </el-radio-group>
        </div>  
        
      </el-header>
    </el-container>
    <el-container>
      <!-- 侧边栏 -->
      <el-aside style="width: 200px; min-height: 100vh;">
        <el-menu
          :default-active="$route.path"
          class="el-menu-vertical-demo"
          :collapse="isCollapse"
          @open="handleOpen"
          @close="handleClose"
          style="min-height: 100vh;"
        >
          <!-- 便签 -->
          <el-sub-menu index="notes">
            <template #title>
              <el-icon><House /></el-icon>
              <span>便签</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="all" @click="showAllNotes">
                全部
              </el-menu-item>
              <el-menu-item 
              v-for="(item,index) in menuItems"
              :key = "item.index"
              :index="item.index"
              @click="handleItemClick(item)"
              >
                {{ item.label }}
              </el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          <!-- 清单 -->
          <el-menu-item index="Task" @click="showTask">
              <el-icon><Tickets /></el-icon>
              <span>清单</span>
          </el-menu-item>
          <!-- 提醒 -->
          <el-menu-item index="remind" @click="showRemind">
              <el-icon><AlarmClock /></el-icon>
              <span>提醒</span>
          </el-menu-item>
          <!-- 标签修改 -->
          <el-menu-item @click="openTagEdit">
              <el-icon><EditPen /></el-icon>
              <span>标签修改</span>
          </el-menu-item>
          <!-- 归档 -->
          <el-sub-menu index="archive">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>归档</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="archiveNotes" @click="showArchiveNotes">
                便签
              </el-menu-item>
              <el-menu-item index="archiveTask" @click="showArchiveTask">
                清单
              </el-menu-item>
              <el-menu-item index="archiveRemind" @click="showArchiveRemind">
                提醒
              </el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          <!-- 垃圾桶 -->
          <el-sub-menu index="recycle">
            <template #title>
              <el-icon><Delete /></el-icon>
              <span>回收站</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="recycleNotes" @click="showRecycleNotes">
                便签
              </el-menu-item>
              <el-menu-item index="recycleTask" @click="showRecycleTask">
                清单
              </el-menu-item>
              <el-menu-item index="recycleRemind" @click="showRecycleRemind">
                提醒
              </el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          <!-- 注销登录 -->
           <el-sub-menu index="setting">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </template>
            <el-menu-item-group>
              <el-sub-menu index="profile">
                <template #title>
                  <span>个人中心</span>
                </template>
                <el-menu-item index="profile-ChangePassword" @click="openChangePassword">修改密码</el-menu-item>
                <el-menu-item index="profile-Deregister" @click="confirmDeregister">注销账户</el-menu-item>
              </el-sub-menu>
              <el-menu-item index="logout" @click="logout">
                退出登录
              </el-menu-item>
            </el-menu-item-group>
            </el-sub-menu>
        </el-menu>
      </el-aside>
    <!-- 主体 -->
      <el-main>
        <NotesShow v-if="currentView === 'notes'" :notes="filteredNotes" />
        <div v-else-if="currentView === 'notes' && filteredNotes.length === 0" class="empty-state">暂无便签</div>
        <TaskShow v-if="currentView === 'Task'" :refreshTaskgroups="true" />
        <RemindShow v-if="currentView === 'remind'" />
        <ArchiveNotesShow v-if="currentView === 'archiveNotes'" :notes="notes" />
        <div v-else-if="currentView === 'archiveNotes' && notes.length === 0" class="empty-state">暂无归档便签</div>
        <TrashNotesShow v-if="currentView === 'recycleNotes'" :notes="notes" />
        <div v-else-if="currentView === 'recycleNotes' && notes.length === 0" class="empty-state">暂无回收站便签</div>
        <ArchiveTaskShow v-if="currentView === 'archiveTask'" />
        <ArchiveRemindShow v-if="currentView === 'archiveRemind'" />
        <TrashTaskShow v-if="currentView === 'recycleTask'" />
        <TrashRemindShow v-if="currentView === 'recycleRemind'" />
      </el-main>
    </el-container>
    <TagEdit v-model:visible="tagEditVisible" @refreshTags="fetchTags" />
    <NotesEdit v-model:visible="dialogVisible" :data="selectedCard" @refreshNotes="fetchNotes" @refreshTags="fetchTags" @close="closeEditor" />
    <ChangePassword v-model:dialogVisible="changePasswordVisible" />
  </div>
</template>

<script lang="ts" setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  EditPen,
  House,
  Folder,
  Delete,
  Expand,
  Fold,
  Tickets,
  AlarmClock,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import NotesShow from '@/components/NotesShow.vue';
import TagEdit from '@/components/TagEdit.vue';
import ArchiveNotesShow from '@/components/ArchiveNotesShow.vue';
import TaskShow from '@/components/TaskShow.vue';
import RemindShow from '@/components/RemindShow.vue';
import ArchiveTaskShow from '@/components/ArchiveTaskShow.vue';
import ArchiveRemindShow from '@/components/ArchiveRemindShow.vue';
import TrashNotesShow from '@/components/TrashNotesShow.vue';
import TrashTaskShow from '@/components/TrashTaskShow.vue';
import TrashRemindShow from '@/components/TrashRemindShow.vue';
import NotesEdit from '@/components/NotesEdit.vue';
import ChangePassword from '@/components/ChangePassword.vue';
import axios from 'axios';

interface LoginResponse {
  code: string;
  message: string;
  user: {
    userid: number;
    username: string;
    password: string;
  };
  token: string;
  data: Array<{
    id: number;
    tag: string;
  }>;
}

interface LoginResponseTag {
  code: string;
  message: string;
  user: {
    userid: number;
    username: string;
    password: string;
  };
  token: string;
  data: {
    data: { id: number; tag: string ;userid: number}[];
    code: string;
  };
}
// 折叠状态
const isCollapse = ref(true);

// 标签编辑对话框的显示状态
const tagEditVisible = ref(false);

// 选中的便签卡片数据
const selectedCard = ref(null);

// 便签编辑对话框的显示状态
const dialogVisible = ref(false);

// 当前显示的视图
const currentView = ref('notes');

// 切换折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 打开标签编辑对话框
const openTagEdit = () => {
  tagEditVisible.value = true;
};

// 动态菜单数据
const menuItems = ref([]);

// 便签数据
const notes = ref([]);

// 筛选后的便签数据
const filteredNotes = ref([]);

// 获取标签数据
const fetchTags = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    const token = localStorage.getItem('jwt_token'); // 获取存储的token
    if (!userId || !token) {
      ElMessage.error('用户未登录或缺少必要的认证信息');
      return;
    }

    const response: any = await request.get('/Tag/Taglist', {
      headers: {
        Authorization: `Bearer ${token}` // 传递Authorization头部
      },
      params: {
        userid: userId // 传递userid参数
      }
    });

    console.log('获取到的响应数据为:', response.data);  // 输出完整的响应数据
    
    // 判断返回的数据是否是一个数组
    if (Array.isArray(response.data)) {
      menuItems.value = response.data.map((tag: { id: number; tag: string }) => ({
        index: `2-${tag.id}`,
        label: tag.tag,
        action: () => filterNotesByTag(tag.tag)
      }));
    } else {
      ElMessage.error('获取标签数据失败');
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      ElMessage.error('权限不足，请重新登录');
    } else {
      ElMessage.error('获取标签数据失败，请检查网络连接');
    }
  }
};

const selectedTag = ref<string | null>(null);

// 获取便签数据
const fetchNotes = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const data: LoginResponse = await request.get('/Notes/Noteslist', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      params: { userid: userId }
    });
    console.log('获取到的便签code为:', data.code);
    if (data.code === "200") {
      notes.value = data.data.map((item: any) => ({
        ...item,
        imgList: item.img ? item.img.split(",").filter(img => img.trim() !== "") : [],
        tagList: item.tag ? item.tag.split(",").filter(tag => tag.trim() !== "") : [],
      }));

      // 重新筛选便签
      if (currentView.value === 'notes') {
        filteredNotes.value = notes.value.filter(note => 
          selectedTag.value ? note.tagList.includes(selectedTag.value) : true
        );
      }
    } else {
      ElMessage.error('获取便签数据失败');
    }
  } catch (error) {
    ElMessage.error('获取便签数据失败，请检查网络连接');
  }
};


// 在组件挂载时获取标签和便签列表
onMounted(() => {
  fetchTags();
  fetchNotes();
});

// 显示全部便签
const showAllNotes = async () => {
  await fetchNotes(); // 切换到全部便签时重新获取数据
  filteredNotes.value = [...notes.value];
  currentView.value = 'notes';
};

const filterNotesByTag = async (tag: string) => {
  selectedTag.value = tag; // 记录当前筛选的标签
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的userid
    const response: LoginResponse = await request.get('/Notes/NotesByTag', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      params: {
        tag: tag,
        userid: userId
      }
    });

    if (response.code === "200") {
      filteredNotes.value = response.data.map((item: any) => ({
        ...item,
        imgList: item.img ? item.img.split(",").filter(img => img.trim() !== "") : [],
        tagList: item.tag ? item.tag.split(",").filter(tag => tag.trim() !== "") : [],
      }));
      currentView.value = 'notes';
    } else {
      ElMessage.error('根据标签筛选便签失败');
    }
  } catch (error) {
    ElMessage.error('根据标签筛选便签失败，请检查网络连接');
  }
};

// 显示清单
const showTask = () => {
  currentView.value = 'Task';
};

// 显示提醒
const showRemind = () => {
  currentView.value = 'remind';
};

// 显示归档便签
const showArchiveNotes = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 确保 userId 存在
    const response: LoginResponse = await request.get('/Notes/Archive/Noteslist', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      params: { userid: userId }
    });

    if (response.code === "200") {
      notes.value = response.data.map((item: any) => ({
        ...item,
        imgList: item.img ? item.img.split(",").filter(img => img.trim() !== "") : [],
        tagList: item.tag ? item.tag.split(",").filter(tag => tag.trim() !== "") : [],
      }));
      currentView.value = 'archiveNotes';
    } else {
      ElMessage.error('获取归档便签数据失败');
    }
  } catch (error) {
    ElMessage.error('获取归档便签数据失败，请检查网络连接');
  }
};

// 显示归档清单
const showArchiveTask = () => {
  currentView.value = 'archiveTask';
};

// 显示归档提醒
const showArchiveRemind = () => {
  currentView.value = 'archiveRemind';
};

// 显示回收站便签
const showRecycleNotes = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 获取当前用户的 userid
    const response: LoginResponse = await request.get('/Notes/Trash/Noteslist', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt_token')}` // 传递 Authorization 头部
      },
      params: { userid: userId } // 传递 userid 参数
    });

    if (response.code === "200") {
      notes.value = response.data.map((item: any) => ({
        ...item,
        imgList: item.img ? item.img.split(",").filter(img => img.trim() !== "") : [],
        tagList: item.tag ? item.tag.split(",").filter(tag => tag.trim() !== "") : [],
      }));
      currentView.value = 'recycleNotes';
    } else {
      ElMessage.error('获取回收站便签数据失败');
    }
  } catch (error) {
    ElMessage.error('获取回收站便签数据失败，请检查网络连接');
  }
};

// 显示回收站清单
const showRecycleTask= () => {
  currentView.value = 'recycleTask';
};

// 显示回收站提醒
const showRecycleRemind = () => {
  currentView.value = 'recycleRemind';
};

// 处理点击事件
const handleItemClick = (item) => {
  if (item.action) {
    item.action(); // 调用数据中定义的 action 函数
  } else {
    console.log(`${item.label} 被点击，但未定义 action`);
  }
};

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
// 关闭编辑器
const closeEditor = () => {
  dialogVisible.value = false;
};
// 退出登录
const router = useRouter(); // 初始化 router 实例
const logout = () => {
  localStorage.removeItem('jwt_token'); // 清除存储的 Token
  localStorage.removeItem('user'); // 清除用户信息
  localStorage.removeItem('userId'); // 清除 UserId
  ElMessage.success('退出登录成功');
  router.push('/login'); // 跳转到登录页面
};

const changePasswordVisible = ref(false);

const openChangePassword = () => {
  changePasswordVisible.value = true;
};

const confirmDeregister = () => {
  ElMessageBox.confirm(
    '确定要注销账户吗？此操作不可恢复！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const userId = localStorage.getItem('userId'); // 获取存储的 userid
      if (!token || !userId) {
        ElMessage.error('用户未登录或缺少必要的认证信息');
        return;
      }

      const response = await axios.post(
        'http://localhost:8080/user/deregister',
        { userid: userId }, // 携带 userid 参数
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.code === '200') {
        ElMessage.success('账户已成功注销');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        router.push('/login');
      } else {
        ElMessage.error(response.data.message || '注销失败');
      }
    } catch (error) {
      console.error('注销失败:', error);
      ElMessage.error('注销失败，请检查网络连接');
    }
  }).catch(() => {
    ElMessage.info('已取消注销');
  });
};
</script>

