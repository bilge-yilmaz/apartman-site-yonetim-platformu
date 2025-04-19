import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T = any>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  async set(key: string, value: any) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  async clear() {
    await AsyncStorage.clear();
  },
};
