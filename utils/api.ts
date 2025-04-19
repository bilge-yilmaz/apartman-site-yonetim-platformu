import axios from 'axios';
import { storage } from './storage';

// Web uygulamanızın API URL'i - geliştirme ortamında localhost, 
// production'da gerçek domain olacak şekilde değiştirilmeli
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istekte token kontrolü yapan interceptor
api.interceptors.request.use(
  async (config) => {
    const user = await storage.get('user');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Offline işlemleri için kuyruk sistemi
type QueuedRequest = {
  url: string;
  method: string;
  data?: any;
  id: string;
};

export const apiQueue = {
  async add(request: Omit<QueuedRequest, 'id'>) {
    const queue = await this.getQueue();
    const id = Date.now().toString();
    queue.push({ ...request, id });
    await storage.set('apiQueue', queue);
    return id;
  },

  async getQueue(): Promise<QueuedRequest[]> {
    return (await storage.get<QueuedRequest[]>('apiQueue')) || [];
  },

  async remove(id: string) {
    const queue = await this.getQueue();
    const newQueue = queue.filter(item => item.id !== id);
    await storage.set('apiQueue', newQueue);
  },

  async processQueue() {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    for (const request of queue) {
      try {
        await api({
          url: request.url,
          method: request.method,
          data: request.data,
        });
        await this.remove(request.id);
      } catch (error) {
        console.error('Kuyruk işleme hatası:', error);
        // Sadece network hatası değilse kuyruktaki öğeyi kaldır
        if (axios.isAxiosError(error) && !error.response) {
          break; // Hala offline, işlemi durdur
        }
        await this.remove(request.id);
      }
    }
  }
};

export default api;
