import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, SafeAreaView, Alert, StatusBar } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/Theme';
import { CheckCircle2, Clock3, CreditCard, MapPin, Navigation, Phone, Store, X, XCircle, PackageCheck, Route } from 'lucide-react-native';

const TABS = [
  { key: 'nuevos', label: 'Nuevos' },
  { key: 'aceptados', label: 'Aceptados' },
  { key: 'en_camino', label: 'En camino' },
  { key: 'entregados', label: 'Entregados' },
];

const normalize = (value = '') => String(value).toLowerCase().replace(/\s+/g, '_');
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function tabFor(order) {
  const state = normalize(order.estado || order.estado_envio);
  if (['asignado', 'nuevo', 'pendiente', 'listo'].includes(state)) return 'nuevos';
  if (['aceptado', 'recogido'].includes(state)) return 'aceptados';
  if (['en_camino', 'en-camino'].includes(state)) return 'en_camino';
  if (state === 'entregado') return 'entregados';
  return order.activo ? 'aceptados' : 'entregados';
}

function statusColor(order) {
  const state = tabFor(order);
  if (state === 'nuevos') return theme.colors.warning;
  if (state === 'aceptados') return theme.colors.primary;
  if (state === 'en_camino') return theme.colors.secondary;
  return theme.colors.info;
}

export default function OrdersScreen() {
  const { BASE_URL } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('nuevos');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/repartidores/pedidos.php`);
      setOrders(response.data?.data || []);
    } catch (e) {
      console.log('Error cargando pedidos', e);
    } finally {
      setRefreshing(false);
    }
  }, [BASE_URL]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    const poll = setInterval(loadOrders, 10000);
    return () => clearInterval(poll);
  }, [loadOrders]);

  const visible = useMemo(() => orders.filter(order => tabFor(order) === tab), [orders, tab]);
  const counts = useMemo(() => TABS.reduce((acc, item) => {
    acc[item.key] = orders.filter(order => tabFor(order) === item.key).length;
    return acc;
  }, {}), [orders]);

  const patchOrder = async (pedidoId, estado) => {
    try {
      await axios.patch(`${BASE_URL}/repartidores/estado_pedido.php`, { pedido_id: pedidoId, estado });
      setSelected(null);
      loadOrders();
      if (estado === 'entregado') {
        Alert.alert('Entrega completada', 'El pedido fue marcado como entregado.');
      }
    } catch (e) {
      Alert.alert('No se pudo actualizar', 'Intenta de nuevo en unos segundos.');
    }
  };

  const rejectOrder = async (pedidoId) => {
    try {
      await axios.patch(`${BASE_URL}/repartidores/rechazar_pedido.php`, { pedido_id: pedidoId });
      loadOrders();
    } catch (e) {
      console.log('No se pudo rechazar pedido', e);
    }
  };

  const nextAction = (order) => {
    const state = normalize(order.estado);
    if (state === 'aceptado') return { label: 'Ya recogi', next: 'recogido', color: theme.colors.secondary };
    if (state === 'recogido') return { label: 'Iniciar entrega', next: 'en_camino', color: theme.colors.warning };
    if (state === 'en_camino') return { label: 'Entregado', next: 'entregado', color: theme.colors.primary };
    return { label: 'Aceptar', next: 'aceptado', color: theme.colors.secondary };
  };

  const renderOrder = (order) => {
    const color = statusColor(order);
    const state = tabFor(order);
    return (
      <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => setSelected(order)} activeOpacity={0.88}>
        <View style={styles.orderTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>Pedido #{order.id}</Text>
            <Text style={styles.orderPlace} numberOfLines={1}>{order.tienda || order.restaurante || 'Restaurante'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.statusText, { color }]}>{order.estado || 'Nuevo'}</Text>
          </View>
        </View>

        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <Store size={17} color={theme.colors.primary} />
            <Text style={styles.routeText} numberOfLines={1}>{order.tienda || 'Sucursal'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <MapPin size={17} color={theme.colors.danger} />
            <Text style={styles.routeText} numberOfLines={2}>{order.direccion || order.cliente || 'Cliente'}</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}><Route size={16} color={theme.colors.textSecondary} /><Text style={styles.metricText}>{order.distancia || '2.4 km'}</Text></View>
          <View style={styles.metric}><Clock3 size={16} color={theme.colors.textSecondary} /><Text style={styles.metricText}>{order.eta || '15 min'}</Text></View>
          <View style={styles.metric}><CreditCard size={16} color={theme.colors.textSecondary} /><Text style={styles.metricText}>{order.metodo_pago || 'Efectivo'}</Text></View>
          <Text style={styles.earning}>{money(order.ganancia || order.total)}</Text>
        </View>

        {state === 'nuevos' ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.reject} onPress={() => rejectOrder(order.id)} activeOpacity={0.85}>
              <XCircle size={19} color={theme.colors.danger} />
              <Text style={styles.rejectText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.accept} onPress={() => patchOrder(order.id, 'aceptado')} activeOpacity={0.85}>
              <CheckCircle2 size={19} color="#fff" />
              <Text style={styles.acceptText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const action = selected ? nextAction(selected) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={theme.colors.primary} />}
      >
        <Text style={styles.title}>Pedidos</Text>
        <Text style={styles.subtitle}>Gestiona ofertas, rutas y entregas con controles grandes y claros.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((item) => {
            const isActive = tab === item.key;
            return (
              <TouchableOpacity key={item.key} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setTab(item.key)} activeOpacity={0.85}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item.label}</Text>
                <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>{counts[item.key] || 0}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <PackageCheck color={theme.colors.textSecondary} size={42} />
            <Text style={styles.emptyTitle}>Sin pedidos en esta etapa</Text>
            <Text style={styles.emptySub}>Cuando llegue uno nuevo aparecera aqui.</Text>
          </View>
        ) : visible.map(renderOrder)}
      </ScrollView>

      <Modal visible={Boolean(selected)} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Pedido #{selected?.id}</Text>
                <Text style={styles.detailSub}>{money(selected?.ganancia || selected?.total)} · {selected?.eta || '15 min'}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <X size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Store color={theme.colors.primary} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Restaurante</Text>
                <Text style={styles.infoValue}>{selected?.tienda || selected?.restaurante || 'Restaurante'}</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <MapPin color={theme.colors.danger} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Cliente</Text>
                <Text style={styles.infoValue}>{selected?.cliente || selected?.direccion || 'Cliente'}</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickBtn}><Phone color={theme.colors.primary} size={20} /><Text style={styles.quickText}>Llamar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn}><Navigation color={theme.colors.primary} size={20} /><Text style={styles.quickText}>Navegacion</Text></TouchableOpacity>
            </View>

            <View style={styles.timeline}>
              {['Aceptado', 'Recogido', 'En camino', 'Entregado'].map((step, index) => {
                const current = normalize(selected?.estado);
                const activeIndex = current === 'entregado' ? 3 : current === 'en_camino' ? 2 : current === 'recogido' ? 1 : current === 'aceptado' ? 0 : -1;
                const done = index <= activeIndex;
                return (
                  <View key={step} style={styles.timelineRow}>
                    <View style={[styles.timelineDot, done && styles.timelineDotOn]} />
                    {index < 3 && <View style={[styles.timelineLine, done && styles.timelineLineOn]} />}
                    <Text style={[styles.timelineText, done && styles.timelineTextOn]}>{step}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.detailActions}>
              {action ? (
                <TouchableOpacity style={[styles.primaryDetailBtn, { backgroundColor: action.color }]} onPress={() => patchOrder(selected.id, action.next)} activeOpacity={0.9}>
                  <Text style={styles.primaryDetailText}>{action.label}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.problemBtn} activeOpacity={0.85}>
                <Text style={styles.problemText}>Problema con pedido</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 118 },
  title: { color: theme.colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 21, marginBottom: 20 },
  tabs: { gap: 10, paddingBottom: 18 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderRadius: 18, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: theme.colors.border },
  tabActive: { backgroundColor: theme.colors.backgroundDark, borderColor: theme.colors.backgroundDark },
  tabText: { color: theme.colors.textSecondary, fontWeight: '800' },
  tabTextActive: { color: '#fff' },
  tabCount: { color: theme.colors.textSecondary, backgroundColor: theme.colors.background, borderRadius: 10, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, fontSize: 12, fontWeight: '900' },
  tabCountActive: { color: theme.colors.backgroundDark, backgroundColor: '#fff' },
  orderCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.shadow, shadowOpacity: .07, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  orderId: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  orderPlace: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '900' },
  routeBox: { backgroundColor: theme.colors.background, borderRadius: 18, padding: 14, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  routeText: { color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 },
  routeLine: { width: 2, height: 15, backgroundColor: theme.colors.border, marginLeft: 8, marginVertical: 4 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F4F8', borderRadius: 13, paddingHorizontal: 10, height: 34 },
  metricText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800' },
  earning: { marginLeft: 'auto', color: theme.colors.secondary, fontSize: 20, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  reject: { flex: 1, height: 52, borderRadius: 18, backgroundColor: theme.colors.dangerSoft, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  rejectText: { color: theme.colors.danger, fontWeight: '900' },
  accept: { flex: 1, height: 52, borderRadius: 18, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  acceptText: { color: '#fff', fontWeight: '900' },
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 34, borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 14 },
  emptySub: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,17,31,.55)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 34 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  detailTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '900' },
  detailSub: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 4 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: theme.colors.background, borderRadius: 18, padding: 15, marginBottom: 10 },
  infoLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  infoValue: { color: theme.colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  quickActions: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  quickBtn: { flex: 1, height: 50, borderRadius: 17, backgroundColor: theme.colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  quickText: { color: theme.colors.primary, fontWeight: '900' },
  timeline: { paddingVertical: 8, marginTop: 4 },
  timelineRow: { height: 48, flexDirection: 'row', alignItems: 'center' },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#D0D5DD', marginRight: 14 },
  timelineDotOn: { backgroundColor: theme.colors.secondary },
  timelineLine: { position: 'absolute', left: 7, top: 31, width: 2, height: 28, backgroundColor: '#D0D5DD' },
  timelineLineOn: { backgroundColor: theme.colors.secondary },
  timelineText: { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '800' },
  timelineTextOn: { color: theme.colors.text },
  detailActions: { gap: 10, marginTop: 8 },
  primaryDetailBtn: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primaryDetailText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  problemBtn: { height: 54, borderRadius: 18, backgroundColor: theme.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  problemText: { color: theme.colors.danger, fontSize: 15, fontWeight: '900' },
});
