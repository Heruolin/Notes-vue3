import axios from "axios";

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8080', // 后端 API 地址
  timeout: 30000, // 设置请求超时
  withCredentials: true // 确保带上凭证信息（cookies）
});

// 请求拦截器：添加 Authorization 头
request.interceptors.request.use(
  config => {
    // 获取存储的 Token（根据你的存储方式）
    let token = localStorage.getItem('token') || localStorage.getItem('jwt_token'); // 兼容两种存储
    // console.log("读取到的 Token:", token); // 输出 Token，确认是否读取到有效的值
    if (token && token !== 'undefined') {
      // 设置 Authorization 头
      config.headers['Authorization'] = `Bearer ${token}`;
      // console.log("✅ 发送的 Authorization 头:", config.headers['Authorization']); // 确认是否添加了 Authorization 头
    } else {
      console.warn("⚠️ Token 为空，未添加 Authorization 头！");
    }

    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：确保返回正确的 data 数据
request.interceptors.response.use(
  (response) => {
    // 检查返回的 data 是否存在
    if (response.data) {
      return response.data; // 返回 data 部分
    } else {
      // 如果没有数据，返回一个错误
      return Promise.reject(new Error('服务器未返回数据'));
    }
  },
  (error) => {
    // 输出更详细的错误信息，方便调试
    console.error('响应错误:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default request;
