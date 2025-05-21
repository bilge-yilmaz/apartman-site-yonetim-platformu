import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../store/user';
import Colors from '../constants/Colors';

interface AdminPageGuardProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminPageGuard({ children, title }: AdminPageGuardProps) {
  const { user } = useUserStore();
  
  useEffect(() => {
    if (!user) {
      console.log('AdminPageGuard: User not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (user.role !== 'ADMIN') {
      console.log('AdminPageGuard: User is not admin, redirecting to resident dashboard');
      router.replace('/(tabs)');
    }
  }, [user]);
  
  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Yetkilendiriliyor...</Text>
      </View>
    );
  }
  
  if (user.role !== 'ADMIN') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Yetkiniz Bulunmamaktadır</Text>
        <Text style={styles.subText}>Bu sayfaya erişmek için yönetici hakları gereklidir.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.pageContainer}>
      {title && <Text style={styles.pageTitle}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.primary,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  pageContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    paddingHorizontal: 16,
  }
}); 