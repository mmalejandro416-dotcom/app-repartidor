import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme/Theme';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react-native';

export default function AlertsScreen() {
  const alerts = [
    { id: 1, type: 'info', title: 'Nueva zona de alta demanda', desc: 'Dirígete al Centro para recibir más pedidos.', time: 'hace 10 min' },
    { id: 2, type: 'warning', title: 'Lluvia en tu área', desc: 'Maneja con precaución, tiempos de entrega extendidos.', time: 'hace 1 hora' },
    { id: 3, type: 'success', title: 'Bono completado', desc: '¡Felicidades! Has completado 10 entregas hoy y ganado $50 extra.', time: 'hace 3 horas' },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle color={theme.colors.warning} size={24} />;
      case 'success': return <CheckCircle color={theme.colors.success} size={24} />;
      default: return <Info color={theme.colors.primary} size={24} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Alertas</Text>
        
        {alerts.map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.iconContainer}>
              {getIcon(alert.type)}
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDesc}>{alert.desc}</Text>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 24,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertDesc: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTime: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  }
});
