import { create } from 'zustand';
import {
  getAnnouncements as apiGetAnnouncements,
  createAnnouncement as apiCreateAnnouncement,
  getAnnouncementById as apiGetAnnouncementById,
  updateAnnouncement as apiUpdateAnnouncement,
  deleteAnnouncement as apiDeleteAnnouncement,
  Announcement, // services/api.ts'den import edildi
  AnnouncementData // services/api.ts'den import edildi
} from '../services/api';

interface AnnouncementsState {
  announcements: Announcement[];
  currentAnnouncement: Announcement | null;
  isLoading: boolean;
  error: string | null;
  fetchAnnouncements: (params?: { category?: string; isActive?: boolean }) => Promise<void>;
  fetchAnnouncementById: (id: string) => Promise<void>;
  addAnnouncement: (data: AnnouncementData) => Promise<Announcement | null>;
  editAnnouncement: (id: string, data: Partial<AnnouncementData>) => Promise<Announcement | null>;
  removeAnnouncement: (id: string) => Promise<void>;
  clearCurrentAnnouncement: () => void;
}

export const useAnnouncementsStore = create<AnnouncementsState>((set, get) => ({
  announcements: [],
  currentAnnouncement: null,
  isLoading: false,
  error: null,

  fetchAnnouncements: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiGetAnnouncements(params);
      set({ announcements: data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Duyurular yüklenemedi' });
      console.error('Error fetching announcements:', error);
    }
  },

  fetchAnnouncementById: async (id) => {
    try {
      set({ isLoading: true, error: null, currentAnnouncement: null });
      const data = await apiGetAnnouncementById(id);
      set({ currentAnnouncement: data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Duyuru yüklenemedi' });
      console.error(`Error fetching announcement ${id}:`, error);
    }
  },

  addAnnouncement: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const newAnnouncement = await apiCreateAnnouncement(data);
      set((state) => ({
        announcements: [newAnnouncement, ...state.announcements],
        isLoading: false,
      }));
      return newAnnouncement;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Duyuru eklenemedi' });
      console.error('Error adding announcement:', error);
      return null;
    }
  },

  editAnnouncement: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      const updatedAnnouncement = await apiUpdateAnnouncement(id, data);
      set((state) => ({
        announcements: state.announcements.map((a) =>
          a._id === id ? updatedAnnouncement : a
        ),
        currentAnnouncement: state.currentAnnouncement?._id === id ? updatedAnnouncement : state.currentAnnouncement,
        isLoading: false,
      }));
      return updatedAnnouncement;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Duyuru güncellenemedi' });
      console.error(`Error editing announcement ${id}:`, error);
      return null;
    }
  },

  removeAnnouncement: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiDeleteAnnouncement(id);
      set((state) => ({
        announcements: state.announcements.filter((a) => a._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Duyuru silinemedi' });
      console.error(`Error deleting announcement ${id}:`, error);
    }
  },
  
  clearCurrentAnnouncement: () => {
    set({ currentAnnouncement: null });
  },
})); 