import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/index',
    name: 'index',
    component: () => import('../views/Index.vue'),
  },
  {
    path: '/Login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/Register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
  },
  {
    path: '/Test',
    name: 'Test',
    component: () => import('../views/Test.vue'),
  },
  {
    path: '/NotesShow',
    name: 'NotesShow',
    component: () => import('../components/NotesShow.vue'),
  },
  {
    path: '/NotesEdit',
    name: 'NotesEdit',
    component: () => import('../components/NotesEdit.vue'),
  },
  {
    path: '/ArchiveNotesShow',
    name: 'ArchiveNotesShow',
    component: () => import('../components/ArchiveNotesShow.vue'),
  },
  {
    path: '/TaskEdit',
    name: 'TaskEdit',
    component: () => import('../components/TaskEdit.vue'),
  },
  {
    path: '/TaskShow',
    name: 'TaskShow',
    component: () => import('../components/TaskShow.vue'),
  },
  {
    path:'/RemindShow',
    name:'RemindShow',
    component:()=>import('../components/RemindShow.vue')
  },
  {
    path:'/RemindEdit',
    name:'RemindEdit',
    component:()=>import('../components/RemindEdit.vue')
  },
  {
    path:'/ChangePassword',
    name:'ChangePassword',
    component:()=>import('../components/ChangePassword.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt_token'); // 检查是否有 token
  if (!token && to.name === 'index') {
    // 如果未登录且访问的是 Index 页面，跳转到 Login 页面
    next({ name: 'Login' });
  } else {
    next(); // 继续导航
  }
});

export default router;
