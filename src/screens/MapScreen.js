import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MapPin, Navigation, Radio, Route } from 'lucide-react-native';
import { theme } from '../theme/Theme';

export default function MapScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.backgroundDark} />
      <View style={styles.mapMock}>
        <View style={styles.routeLine} />
        <View style={[styles.pin, styles.pinDriver]}><Navigation size={22} color="#fff" /></View>
        <View style={[styles.pin, styles.pinStore]}><MapPin size={22} color="#fff" /></View>
        <View style={[styles.pin, styles.pinClient]}><Radio size={22} color="#fff" /></View>
      </View>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Mapa de entregas</Text>
        <Text style={styles.subtitle}>Ruta activa, ubicacion del cliente y zonas con mayor demanda.</Text>
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricValue}>2.4 km</Text><Text style={styles.metricLabel}>Distancia</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>12 min</Text><Text style={styles.metricLabel}>ETA</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>Alta</Text><Text style={styles.metricLabel}>Demanda</Text></View>
        </View>
        <TouchableOpacity style={styles.cta} activeOpacity={0.9}>
          <Navigation size={20} color="#fff" />
          <Text style={styles.ctaText}>Abrir navegacion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.backgroundDark },
  mapMock: { flex: 1, backgroundColor: '#0A1628', overflow: 'hidden' },
  routeLine: { position: 'absolute', top: '24%', left: '25%', width: 210, height: 210, borderLeftWidth: 6, borderBottomWidth: 6, borderColor: theme.colors.primary, borderBottomLeftRadius: 120, transform: [{ rotate: '-22deg' }], opacity: .9 },
  pin: { position: 'absolute', width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .28, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  pinDriver: { left: '19%', top: '28%', backgroundColor: theme.colors.secondary },
  pinStore: { right: '22%', top: '42%', backgroundColor: theme.colors.primary },
  pinClient: { left: '46%', bottom: '30%', backgroundColor: theme.colors.warning },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 110, marginTop: -34 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: theme.colors.border, marginBottom: 18 },
  title: { color: theme.colors.text, fontSize: 25, fontWeight: '900' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 21 },
  metrics: { flexDirection: 'row', gap: 12, marginTop: 22 },
  metric: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 18, padding: 15 },
  metricValue: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  cta: { marginTop: 22, height: 58, borderRadius: 20, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
