import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import Colors from '../constants/Colors';

export default function BottomNav() {
  const pathname = usePathname();
  
  // Debug amaçlı pathname değerini konsola yazdırma
  useEffect(() => {
    console.log('Current pathname:', pathname);
  }, [pathname]);
  
  // Ana sayfa kontrolü için özel bir fonksiyon
  const isHomeScreen = () => {
    const homePaths = ['/', '/(tabs)', '/(tabs)/', '/(tabs)/index', '/(tabs)/index/'];
    return homePaths.includes(pathname);
  };
  
  // Diğer sayfalar için genel kontrol
  const isActive = (route: string) => {
    if (route === '/') {
      return isHomeScreen();
    }
    return pathname.includes(route);
  };
  
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/' as any)}
      >
        {isActive('/') ? (
          <View style={styles.navIconActive}>
            <Ionicons name="home" size={22} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="home-outline" size={22} color={Colors.light.tabIconDefault} />
        )}
        <Text style={isActive('/') ? styles.navText : styles.navTextInactive}>Ana Sayfa</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/payments' as any)}
      >
        {isActive('/payments') ? (
          <View style={styles.navIconActive}>
            <Ionicons name="cash" size={22} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="cash-outline" size={22} color={Colors.light.tabIconDefault} />
        )}
        <Text style={isActive('/payments') ? styles.navText : styles.navTextInactive}>Aidatlar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/maintenance' as any)}
      >
        {isActive('/maintenance') ? (
          <View style={styles.navIconActive}>
            <Ionicons name="construct" size={22} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="construct-outline" size={22} color={Colors.light.tabIconDefault} />
        )}
        <Text style={isActive('/maintenance') ? styles.navText : styles.navTextInactive}>Arızalar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/reservations' as any)}
      >
        {isActive('/reservations') ? (
          <View style={styles.navIconActive}>
            <Ionicons name="calendar" size={22} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="calendar-outline" size={22} color={Colors.light.tabIconDefault} />
        )}
        <Text style={isActive('/reservations') ? styles.navText : styles.navTextInactive}>Rezervasyon</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/announcements' as any)}
      >
        {isActive('/announcements') ? (
          <View style={styles.navIconActive}>
            <Ionicons name="megaphone" size={22} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="megaphone-outline" size={22} color={Colors.light.tabIconDefault} />
        )}
        <Text style={isActive('/announcements') ? styles.navText : styles.navTextInactive}>Duyurular</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/profile' as any)}
      >
        {isActive('/profile') ? (
          <View style={styles.navIconActive}>
            <Ionicons name="person" size={22} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="person-outline" size={22} color={Colors.light.tabIconDefault} />
        )}
        <Text style={isActive('/profile') ? styles.navText : styles.navTextInactive}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 5,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  navIconActive: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: Colors.primary,
    fontWeight: '500',
  },
  navTextInactive: {
    fontSize: 10,
    marginTop: 4,
    color: Colors.light.tabIconDefault,
  },
}); 