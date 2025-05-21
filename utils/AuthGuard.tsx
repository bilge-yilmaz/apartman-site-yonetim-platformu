import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { useUserStore } from '../store/user';
import Colors from '../constants/Colors';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const { user, hydrate } = useUserStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Hydrate user state from storage
      await hydrate();
      setIsReady(true);
    };

    checkAuth();
  }, [hydrate]);

  useEffect(() => {
    if (!rootNavigationState?.key || !isReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSplashScreen = !segments[0]; // If undefined or empty
    
    // Tam URL path'ini oluştur
    const currentPath = '/' + segments.join('/');
    
    // URL pattern kontrolü
    const isAdminRoute = currentPath.startsWith('/admin');
    const isTabsRoute = currentPath.startsWith('/(tabs)');

    console.log('Navigation state:', { 
      segments, 
      currentPath,
      isAuthenticated: !!user,
      userRole: user?.role,
      inAuthGroup,
      isAdminRoute,
      isTabsRoute
    });

    // User is not signed in
    if (!user && !inAuthGroup && !inSplashScreen) {
      console.log('Redirecting to login: User not authenticated');
      router.replace('/auth/login');
    } 
    // User is signed in but tries to access auth screens
    else if (user && inAuthGroup) {
      console.log('Redirecting from auth: User already authenticated');
      
      if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    }
    // User is signed in and accessing protected routes
    else if (user) {
      // If trying to access admin routes but is not an admin
      if (isAdminRoute && user.role !== 'ADMIN') {
        console.log('Redirecting from admin: User is not an admin');
        router.replace('/(tabs)');
      }
      // If admin is trying to access resident routes
      else if (isTabsRoute && user.role === 'ADMIN') {
        console.log('Redirecting from tabs: Admin should use admin panel');
        router.replace('/admin');
      }
    }
  }, [segments, user, isReady, rootNavigationState?.key]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
}); 