import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Linking, Platform, RefreshControl, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import axios from 'axios';
import { MapPin, Navigation, RefreshCw, Route, Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/Theme';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function createMapHtml({ current, destination }) {
  const hasDestination = destination?.lat && destination?.lng;
  const destinationScript = hasDestination
    ? `
      const destLat = ${Number(destination.lat)};
      const destLng = ${Number(destination.lng)};
      const destIcon = L.divIcon({ className: '', html: '<div class="pin dest"></div>', iconSize: [30,30], iconAnchor: [15,15] });
      L.marker([destLat, destLng], { icon: destIcon }).addTo(map).bindPopup('<b>Destino</b>');
      L.polyline([[lat, lng], [destLat, destLng]], { color: '#6D5DFB', weight: 5, opacity: .9, dashArray: '10,10' }).addTo(map);
      map.fitBounds(L.latLngBounds([[lat, lng], [destLat, destLng]]), { padding: [42, 42] });
    `
    : 'map.setView([lat, lng], 16);';

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #0A1628; }
    .leaflet-control-zoom a { background: #101827; color: #fff; border-color: rgba(255,255,255,.18); }
    .pin { width: 22px; height: 22px; border-radius: 50%; background: #24D982; border: 4px solid white; box-shadow: 0 8px 20px rgba(0,0,0,.35); }
    .pin.dest { background: #EF5B6C; }
    .pulse { animation: pulse 1.8s infinite; }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(36,217,130,.45); }
      70% { box-shadow: 0 0 0 22px rgba(36,217,130,0); }
      100% { box-shadow: 0 0 0 0 rgba(36,217,130,0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const lat = ${Number(current.latitude)};
    const lng = ${Number(current.longitude)};
    const map = L.map('map', { zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    const driverIcon = L.divIcon({ className: '', html: '<div class="pin pulse"></div>', iconSize: [30,30], iconAnchor: [15,15] });
    L.marker([lat, lng], { icon: driverIcon }).addTo(map).bindPopup('<b>Tu ubicacion</b>');
    L.circle([lat, lng], { radius: 90, color: '#24D982', fillColor: '#24D982', fillOpacity: 0.12, weight: 2 }).addTo(map);
    ${destinationScript}
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const { BASE_URL } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Activa el permiso de ubicacion para ver el mapa.');
        return;
      }

      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) setCurrentLocation(last.coords);

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation(loc.coords);

      const ordersResponse = await axios.get(`${BASE_URL}/repartidores/pedidos.php`);
      const orders = ordersResponse.data?.data || [];
      setActiveOrder(orders.find(o => o.activo) || orders.find(o => ['Aceptado', 'Recogido', 'En camino', 'en_camino'].includes(o.estado)) || null);
    } catch (e) {
      setError('No se pudo cargar mapa o pedidos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [BASE_URL]);

  useEffect(() => { loadData(); }, [loadData]);

  const destination = useMemo(() => {
    const lat = Number(activeOrder?.lat);
    const lng = Number(activeOrder?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 ? { lat, lng } : null;
  }, [activeOrder]);

  const mapHtml = useMemo(() => currentLocation ? createMapHtml({ current: currentLocation, destination }) : null, [currentLocation, destination]);

  const openNavigation = () => {
    if (!destination) {
      alert('Este pedido no tiene coordenadas GPS de destino.');
      return;
    }
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.backgroundDark} />

      <View style={styles.mapArea}>
        {loading ? (
          <View style={styles.mapEmpty}>
            <ActivityIndicator color={theme.colors.secondary} size="large" />
            <Text style={styles.mapEmptyText}>Cargando ubicacion...</Text>
          </View>
        ) : error ? (
          <View style={styles.mapEmpty}>
            <MapPin color={theme.colors.danger} size={36} />
            <Text style={styles.mapEmptyText}>{error}</Text>
          </View>
        ) : Platform.OS === 'web' && currentLocation ? (
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.longitude - 0.015},${currentLocation.latitude - 0.015},${currentLocation.longitude + 0.015},${currentLocation.latitude + 0.015}&layer=mapnik&marker=${currentLocation.latitude},${currentLocation.longitude}`}
            title="Mapa repartidor"
          />
        ) : mapHtml ? (
          <WebView source={{ html: mapHtml }} style={styles.webview} javaScriptEnabled domStorageEnabled originWhitelist={['*']} />
        ) : null}
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.colors.primary} />}
      >
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Mapa de entregas</Text>
            <Text style={styles.subtitle}>{activeOrder ? `Pedido #${activeOrder.id} en ruta` : 'Sin pedido activo por ahora'}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
            <RefreshCw color={theme.colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}><Route color={theme.colors.primary} size={20} /><Text style={styles.metricValue}>{activeOrder?.distancia || 'GPS'}</Text><Text style={styles.metricLabel}>Distancia</Text></View>
          <View style={styles.metric}><Navigation color={theme.colors.secondary} size={20} /><Text style={styles.metricValue}>{activeOrder?.eta || 'Actual'}</Text><Text style={styles.metricLabel}>ETA</Text></View>
          <View style={styles.metric}><Wallet color={theme.colors.warning} size={20} /><Text style={styles.metricValue}>{money(activeOrder?.ganancia || activeOrder?.total)}</Text><Text style={styles.metricLabel}>Ganancia</Text></View>
        </View>

        {activeOrder ? (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>{activeOrder.tienda || 'Sucursal'}</Text>
            <Text style={styles.orderText}>{activeOrder.direccion || activeOrder.cliente || 'Direccion del cliente'}</Text>
            <Text style={styles.orderStatus}>{activeOrder.estado || 'Activo'}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.cta} onPress={openNavigation} activeOpacity={0.9}>
          <Navigation size={20} color="#fff" />
          <Text style={styles.ctaText}>Abrir navegacion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.backgroundDark },
  mapArea: { flex: 1, backgroundColor: '#0A1628' },
  webview: { flex: 1, backgroundColor: '#0A1628' },
  mapEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 26 },
  mapEmptyText: { color: '#D9E0EA', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  sheet: { maxHeight: 365, backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  sheetContent: { padding: 24, paddingBottom: 120 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: theme.colors.border, marginBottom: 18 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { color: theme.colors.text, fontSize: 25, fontWeight: '900' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 21 },
  refreshBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft },
  metrics: { flexDirection: 'row', gap: 10, marginTop: 22 },
  metric: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 18, padding: 13 },
  metricValue: { color: theme.colors.text, fontSize: 16, fontWeight: '900', marginTop: 8 },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4, fontWeight: '800' },
  orderCard: { marginTop: 14, padding: 15, borderRadius: 18, backgroundColor: theme.colors.background },
  orderTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  orderText: { color: theme.colors.textSecondary, marginTop: 5, fontSize: 14, fontWeight: '700' },
  orderStatus: { color: theme.colors.secondary, marginTop: 8, fontSize: 13, fontWeight: '900' },
  cta: { marginTop: 16, height: 58, borderRadius: 20, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
