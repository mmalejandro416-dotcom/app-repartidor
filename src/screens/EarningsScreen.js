import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/Theme';
import { Calendar, CheckCircle2, TrendingUp, Wallet } from 'lucide-react-native';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function EarningsScreen() {
  const { BASE_URL } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/repartidores/ganancias.php`);
      if (response.data?.data) setData(response.data.data);
    } catch (error) {
      console.log('Error fetching earnings', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEarnings(); }, []);

  const history = data?.historial || [];
  const maxTotal = useMemo(() => Math.max(1, ...history.map(d => Number(d.total || 0))), [history]);
  const totalWeek = history.reduce((sum, day) => sum + Number(day.total || 0), 0);

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loading}>Cargando ganancias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEarnings(); }} tintColor={theme.colors.primary} />}
      >
        <Text style={styles.title}>Ganancias</Text>
        <Text style={styles.subtitle}>Balance claro, resumen semanal y rendimiento de entregas.</Text>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.walletIcon}><Wallet color="#fff" size={25} /></View>
            <Text style={styles.balanceLabel}>Balance de hoy</Text>
          </View>
          <Text style={styles.balanceAmount}>{money(data.hoy?.ganado)}</Text>
          <Text style={styles.balanceSub}>{Number(data.hoy?.entregas || 0)} entregas completadas</Text>
          <View style={styles.breakdown}>
            <View><Text style={styles.breakLabel}>Base</Text><Text style={styles.breakValue}>{money(data.hoy?.detalles?.base)}</Text></View>
            <View><Text style={styles.breakLabel}>Propinas</Text><Text style={styles.breakValue}>{money(data.hoy?.detalles?.propinas)}</Text></View>
            <View><Text style={styles.breakLabel}>Bonos</Text><Text style={styles.breakValue}>{money(data.hoy?.detalles?.bonos)}</Text></View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <TrendingUp color={theme.colors.secondary} size={23} />
            <Text style={styles.summaryValue}>{money(totalWeek)}</Text>
            <Text style={styles.summaryLabel}>Semana</Text>
          </View>
          <View style={styles.summaryCard}>
            <CheckCircle2 color={theme.colors.primary} size={23} />
            <Text style={styles.summaryValue}>{history.reduce((s, d) => s + Number(d.entregas || 0), 0)}</Text>
            <Text style={styles.summaryLabel}>Entregas</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ultimos 7 dias</Text>
        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {history.length === 0 ? (
              <Text style={styles.empty}>No hay registros recientes</Text>
            ) : history.map((day, index) => {
              const height = Math.max(18, (Number(day.total || 0) / maxTotal) * 120);
              return (
                <View key={`${day.fecha}-${index}`} style={styles.barCol}>
                  <View style={[styles.bar, { height }]} />
                  <Text style={styles.barLabel}>{String(day.fecha || '').slice(5) || `D${index + 1}`}</Text>
                </View>
              );
            })}
          </View>
          {history.map((day, index) => (
            <View key={`row-${index}`} style={[styles.historyRow, index < history.length - 1 && styles.historyDivider]}>
              <View style={styles.historyLeft}>
                <Calendar size={18} color={theme.colors.textSecondary} />
                <Text style={styles.historyDate}>{day.fecha}</Text>
              </View>
              <Text style={styles.historyMeta}>{day.entregas} entregas</Text>
              <Text style={styles.historyTotal}>{money(day.total)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loading: { color: theme.colors.textSecondary, fontWeight: '700' },
  content: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 118 },
  title: { color: theme.colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 21, marginBottom: 20 },
  balanceCard: { backgroundColor: theme.colors.backgroundDark, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: .18, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { color: '#D9E0EA', fontSize: 15, fontWeight: '800' },
  balanceAmount: { color: '#fff', fontSize: 48, fontWeight: '900', marginTop: 22 },
  balanceSub: { color: theme.colors.secondary, fontSize: 15, fontWeight: '800', marginTop: 4 },
  breakdown: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)', marginTop: 24, paddingTop: 18 },
  breakLabel: { color: '#98A2B3', fontSize: 12, fontWeight: '700' },
  breakValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 5 },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  summaryCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: theme.colors.border },
  summaryValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900', marginTop: 12 },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '700' },
  sectionTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginTop: 28, marginBottom: 14 },
  chartCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.border },
  chart: { minHeight: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 12, marginBottom: 8 },
  barCol: { alignItems: 'center', flex: 1, gap: 8 },
  bar: { width: 20, borderRadius: 10, backgroundColor: theme.colors.primary },
  barLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800' },
  empty: { color: theme.colors.textSecondary, textAlign: 'center', flex: 1, alignSelf: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 10 },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  historyLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  historyDate: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
  historyMeta: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  historyTotal: { color: theme.colors.text, fontSize: 15, fontWeight: '900', minWidth: 75, textAlign: 'right' },
});
