import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/Theme';
import { Camera, ChevronRight, FileCheck2, Headphones, LogOut, Settings, ShieldCheck, Star, User } from 'lucide-react-native';

function getInitials(name = 'Repartidor') {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'R';
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const uri = await AsyncStorage.getItem(`profile_image_rep_${user?.email || user?.id}`);
        if (uri) setProfileImage(uri);
      } catch (e) { console.log(e); }
    };
    if (user) loadProfileImage();
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galeria para cambiar tu foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem(`profile_image_rep_${user?.email || user?.id}`, result.assets[0].uri);
    }
  };

  const menuItems = [
    { title: 'Perfil repartidor', sub: 'Datos personales y telefono', icon: User },
    { title: 'Documentos', sub: 'Licencia, vehiculo y verificacion', icon: FileCheck2 },
    { title: 'Soporte', sub: 'Ayuda durante entregas', icon: Headphones },
    { title: 'Configuracion', sub: 'Preferencias de la app', icon: Settings },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.backgroundDark} />
      <View style={styles.hero} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Cuenta</Text>
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrap}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user?.nombre)}</Text></View>}
            <View style={styles.editBadge}><Camera size={16} color="#fff" /></View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.nombre || 'Repartidor'}</Text>
          <Text style={styles.userPhone}>{user?.telefono || 'Sin telefono registrado'}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}><Star size={16} color={theme.colors.warning} /><Text style={styles.ratingText}>{user?.calificacion || '4.9'} calificacion</Text></View>
            <View style={styles.verifiedPill}><ShieldCheck size={16} color={theme.colors.secondary} /><Text style={styles.verifiedText}>Verificado</Text></View>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={item.title} style={[styles.menuItem, index < menuItems.length - 1 && styles.menuDivider]} activeOpacity={0.8}>
                <View style={styles.menuIcon}><Icon color={theme.colors.primary} size={22} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight color={theme.colors.textSecondary} size={22} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.85}>
          <LogOut size={20} color={theme.colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 245, backgroundColor: theme.colors.backgroundDark, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  content: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 118 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 20 },
  profileCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 28, padding: 24, marginBottom: 18, shadowColor: theme.colors.shadow, shadowOpacity: .10, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  avatarWrap: { position: 'relative', marginBottom: 15 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 92, height: 92, borderRadius: 46 },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '900' },
  editBadge: { position: 'absolute', bottom: 2, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.surface },
  userName: { color: theme.colors.text, fontSize: 25, fontWeight: '900' },
  userPhone: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  ratingRow: { flexDirection: 'row', gap: 8, marginTop: 15 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.warningSoft, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 },
  ratingText: { color: theme.colors.warning, fontWeight: '900', fontSize: 12 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.secondarySoft, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 },
  verifiedText: { color: '#16A34A', fontWeight: '900', fontSize: 12 },
  menu: { backgroundColor: theme.colors.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 17 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  menuIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  menuSub: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 3 },
  logoutBtn: { marginTop: 18, height: 56, borderRadius: 20, backgroundColor: theme.colors.dangerSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  logoutText: { color: theme.colors.danger, fontSize: 16, fontWeight: '900' },
});
