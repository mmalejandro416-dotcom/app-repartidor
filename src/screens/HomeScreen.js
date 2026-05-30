import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Switch, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/Theme';
import { BarChart3, ChevronRight, Clock3, Map, PackageCheck, ShoppingBag, Star, Wallet, Route } from 'lucide-react-native';

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

function initials(name = 'Repartidor') {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'R';
}

export default function HomeScreen() {
  const { user, BASE_URL } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.estado === 'disponible');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ entregas: 0, ganancias: 0, conectado: '8h 15m', calificacion: '0.0' });

  useEffect(() => setIsOnline(user?.estado === 'disponible'), [user?.estado]);

  const load = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/repartidores/pedidos.php`),
        axios.get(`${BASE_URL}/repartidores/ganancias.php`),
      ]);
      setOrders(ordersRes.data?.data || []);
      const data = statsRes.data?.data || {};
      setStats({
        entregas: Number(data.hoy?.entregas || 0),
        ganancias: Number(data.hoy?.ganado || 0),
        conectado: data.hoy?.tiempo_conectado || '8h 15m',
        calificacion: Number(data.repartidor?.calificacion || 0).toFixed(1),
      });
    } catch (e) {
      console.log('Error cargando inicio repartidor', e);
    } finally {
      setRefreshing(false);
    }
  }, [BASE_URL]);

  useEffect(() => { load(); }, [load]);

  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    try {
      await axios.patch(`${BASE_URL}/repartidores/estado.php`, { estado: next ? 'disponible' : 'desconectado' });
    } catch (e) {
      setIsOnline(!next);
    }
  };

  const recent = orders.slice(0, 3);
  const statItems = [
    { label: 'Entregas', value: stats.entregas, icon: ShoppingBag, color: theme.colors.secondary },
    { label: 'Ganancias', value: formatMoney(stats.ganancias), icon: BarChart3, color: theme.colors.primary },
    { label: 'Calificacion', value: stats.calificacion, icon: Star, color: theme.colors.info },
    { label: 'En linea', value: stats.conectado, icon: Clock3, color: theme.colors.warning },
  ];
  const shortcuts = [
    { label: 'Pedidos activos', icon: ShoppingBag, route: 'Pedidos', color: theme.colors.secondary },
    { label: 'Mapa', icon: Map, route: 'Mapa', color: theme.colors.primary },
    { label: 'Ganancias', icon: Wallet, route: 'Ganancias', color: theme.colors.warning },
    { label: 'Historial', icon: BarChart3, route: 'Pedidos', color: theme.colors.info },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.backgroundDark} />
      <View style={styles.hero} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.colors.primary} />}
      >
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            {user?.foto ? <Image source={{ uri: user.foto }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{initials(user?.nombre)}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hola, {user?.nombre || 'Carlos'}</Text>
            <Text style={styles.role}>Repartidor</Text>
          </View>
          <View style={styles.onlinePill}>
            <Text style={styles.onlinePillText}>{isOnline ? 'En linea' : 'Fuera'}</Text>
            <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: '#344054', true: '#58E28F' }} thumbColor="#fff" />
          </View>
        </View>

        <TouchableOpacity style={styles.statusCard} onPress={() => navigation.navigate('Mapa')} activeOpacity={0.9}>
          <View style={[styles.liveDot, !isOnline && { backgroundColor: theme.colors.textSecondary }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{isOnline ? 'Estas en linea' : 'Estas fuera de linea'}</Text>
            <Text style={styles.statusSub}>{isOnline ? 'Recibiendo pedidos' : 'Activa tu turno para recibir pedidos'}</Text>
          </View>
          <Text style={styles.mapLink}>VER MAPA</Text>
          <ChevronRight color={theme.colors.secondary} size={24} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Resumen de hoy</Text>
        <View style={styles.statsCard}>
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <View style={styles.stat} key={item.label}>
                <View style={[styles.iconBubble, { backgroundColor: item.color + '18' }]}>
                  <Icon color={item.color} size={27} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Atajos rapidos</Text>
        <View style={styles.shortcutGrid}>
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={item.label} style={styles.shortcut} onPress={() => navigation.navigate(item.route)} activeOpacity={0.85}>
                <View style={[styles.iconBubble, { backgroundColor: item.color + '14' }]}>
                  <Icon color={item.color} size={28} />
                </View>
                <Text style={styles.shortcutText}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Pedidos recientes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Pedidos')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentCard}>
          {recent.length === 0 ? (
            <View style={styles.emptyRecent}>
              <PackageCheck color={theme.colors.textSecondary} size={30} />
              <Text style={styles.emptyText}>No hay pedidos recientes</Text>
            </View>
          ) : recent.map((order, index) => (
            <TouchableOpacity key={order.id || index} style={[styles.recentRow, index < recent.length - 1 && styles.recentDivider]} onPress={() => navigation.navigate('Pedidos')} activeOpacity={0.8}>
              <View style={[styles.orderIcon, { backgroundColor: index === 0 ? theme.colors.secondarySoft : theme.colors.primarySoft }]}>
                <ShoppingBag color={index === 0 ? theme.colors.secondary : theme.colors.primary} size={26} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>#{order.id} · {order.tienda || order.restaurante || 'Pedido'}</Text>
                <Text style={styles.orderAddress} numberOfLines={1}>{order.direccion || order.cliente || 'Direccion del cliente'}</Text>
                <Text style={styles.orderEta}>{(order.estado || '').toLowerCase().includes('camino') ? 'Entregar en: 15 min' : order.estado || 'En proceso'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderBadge}>{order.estado || 'Activo'}</Text>
                <Text style={styles.orderPay}>{formatMoney(order.ganancia || order.total)}</Text>
              </View>
              <ChevronRight color="#98A2B3" size={21} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 315, backgroundColor: theme.colors.backgroundDark, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  content: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 118 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 26 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#203047', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 30 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  greeting: { color: '#fff', fontSize: 23, fontWeight: '900' },
  role: { color: '#B8C1D1', fontSize: 15, marginTop: 2 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.09)', paddingLeft: 16, paddingRight: 4, height: 52, borderRadius: 26, gap: 6 },
  onlinePillText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#111A2A', borderRadius: 22, padding: 23, marginBottom: 28, shadowColor: '#000', shadowOpacity: .22, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  liveDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.secondary },
  statusTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statusSub: { color: '#D9E0EA', fontSize: 17, marginTop: 4 },
  mapLink: { color: theme.colors.secondary, fontSize: 14, fontWeight: '900' },
  sectionTitle: { fontSize: 23, fontWeight: '900', color: theme.colors.text, marginBottom: 14 },
  statsCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 22, paddingVertical: 22, paddingHorizontal: 10, marginBottom: 30, shadowColor: theme.colors.shadow, shadowOpacity: .08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  stat: { flex: 1, alignItems: 'center' },
  iconBubble: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { color: theme.colors.text, fontSize: 19, fontWeight: '900' },
  statLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 5, textAlign: 'center' },
  shortcutGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  shortcut: { flex: 1, minHeight: 126, backgroundColor: theme.colors.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 10, shadowColor: theme.colors.shadow, shadowOpacity: .07, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  shortcutText: { color: theme.colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { color: '#16A34A', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  recentCard: { backgroundColor: theme.colors.surface, borderRadius: 22, overflow: 'hidden', shadowColor: theme.colors.shadow, shadowOpacity: .08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  recentDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  orderIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  orderTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '900' },
  orderAddress: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  orderEta: { color: '#16A34A', fontSize: 14, fontWeight: '800', marginTop: 6 },
  orderBadge: { color: '#16A34A', backgroundColor: theme.colors.secondarySoft, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontWeight: '800', fontSize: 12 },
  orderPay: { color: theme.colors.text, fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptyRecent: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  emptyText: { color: theme.colors.textSecondary, fontWeight: '700' },
});
