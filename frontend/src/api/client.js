import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  refresh:   (data) => api.post('/auth/refresh', data),
  logout:    ()     => api.post('/auth/logout'),
  me:        ()     => api.get('/auth/me'),
  googleUrl: ()     => `${BASE_URL}/auth/google`,
  githubUrl: ()     => `${BASE_URL}/auth/github`,
};

// ── Questions ─────────────────────────────────────────────────────────────
export const questionsAPI = {
  list:     (params) => api.get('/questions', { params }),
  get:      (id)     => api.get(`/questions/${id}`),
  create:   (data)   => api.post('/questions', data),
  update:   (id, d)  => api.put(`/questions/${id}`, d),
  delete:   (id)     => api.delete(`/questions/${id}`),
  vote:     (id, v)  => api.post(`/questions/${id}/vote`, { value: v }),
  bookmark: (id)     => api.post(`/questions/${id}/bookmark`),
  close:    (id, r)  => api.post(`/questions/${id}/close`, null, { params: { reason: r } }),
  addComment: (id, body) => api.post(`/questions/${id}/comments`, { body }),
};

// ── Answers ───────────────────────────────────────────────────────────────
export const answersAPI = {
  create:    (qid, d)  => api.post(`/questions/${qid}/answers`, d),
  update:    (id, d)   => api.put(`/answers/${id}`, d),
  delete:    (id)      => api.delete(`/answers/${id}`),
  vote:      (id, v)   => api.post(`/answers/${id}/vote`, { value: v }),
  accept:    (id)      => api.post(`/answers/${id}/accept`),
  addComment: (id, b)  => api.post(`/answers/${id}/comments`, { body: b }),
};

// ── Comments ──────────────────────────────────────────────────────────────
export const commentsAPI = {
  delete: (id) => api.delete(`/comments/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:           (params) => api.get('/users', { params }),
  profile:        (username) => api.get(`/users/${username}`),
  updateMe:       (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  bookmarks:      (params) => api.get('/users/me/bookmarks', { params }),
};

// ── Tags ──────────────────────────────────────────────────────────────────
export const tagsAPI = {
  list:   (params) => api.get('/tags', { params }),
  get:    (name)   => api.get(`/tags/${name}`),
  create: (data)   => api.post('/tags', data),
};
