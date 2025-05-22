import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useUserStore } from '../store/user';
import Colors from '../constants/Colors';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const segments = useSegments();
  const { user, hydrate } = useUserStore();
  const [isReady, setIsReady] = useState(false);

  // Initial data loading
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Hydrate user state from storage
        await hydrate();
      } catch (error) {
        console.error('Error hydrating user state:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [hydrate]);

  // Auth and routing logic
  useEffect(() => {
    // Wait until auth state is ready
    if (!isReady) return;
    
    // Make sure segments exist
    if (!segments) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSplashScreen = !segments[0]; // If undefined or empty
    
    // Full URL path
    const currentPath = '/' + segments.join('/');
    
    // URL pattern checks
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

    // Authentication and access control logic
    if (!user && !inAuthGroup && !inSplashScreen) {
      // Not logged in and trying to access protected routes
      console.log('Redirecting to login: User not authenticated');
      router.replace('/auth/login');
    } 
    else if (user && inAuthGroup) {
      // Logged in but trying to access auth screens
      console.log('Redirecting from auth: User already authenticated');
      
      if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    }
    else if (user) {
      // Logged in and accessing protected routes
      // Check role permissions
      if (isAdminRoute && user.role !== 'ADMIN') {
        console.log('Redirecting from admin: User is not an admin');
        router.replace('/(tabs)');
      }
      else if (isTabsRoute && user.role === 'ADMIN') {
        console.log('Redirecting from tabs: Admin should use admin panel');
        router.replace('/admin');
      }
    }
  }, [segments, user, isReady]);

  // Show loading while initializing
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