import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/Theme';
import { Lock, Phone, User, Bike, Car, Truck } from 'lucide-react-native';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [vehiculo, setVehiculo] = useState('moto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!nombre || !telefono || !pin) {
      setError('Por favor llena todos los campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await signUp({
      nombre,
      telefono,
      pin,
      vehiculo
    });
    
    if (result.success) {
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      navigation.navigate('Login');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo Repartidor</Text>
          <Text style={styles.subtitle}>Únete a nuestro equipo</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputGroup}>
            <User size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre Completo"
              placeholderTextColor={theme.colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          <View style={styles.inputGroup}>
            <Phone size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Crea un PIN de 4 dígitos"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
          </View>

          <Text style={styles.label}>Tipo de Vehículo</Text>
          <View style={styles.vehicleSelector}>
            <TouchableOpacity 
              style={[styles.vehicleOption, vehiculo === 'moto' && styles.vehicleSelected]}
              onPress={() => setVehiculo('moto')}
            >
              <Bike size={24} color={vehiculo === 'moto' ? '#fff' : theme.colors.textSecondary} />
              <Text style={[styles.vehicleText, vehiculo === 'moto' && styles.vehicleTextSelected]}>Moto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.vehicleOption, vehiculo === 'bici' && styles.vehicleSelected]}
              onPress={() => setVehiculo('bici')}
            >
              <Bike size={24} color={vehiculo === 'bici' ? '#fff' : theme.colors.textSecondary} />
              <Text style={[styles.vehicleText, vehiculo === 'bici' && styles.vehicleTextSelected]}>Bici</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.vehicleOption, vehiculo === 'auto' && styles.vehicleSelected]}
              onPress={() => setVehiculo('auto')}
            >
              <Car size={24} color={vehiculo === 'auto' ? '#fff' : theme.colors.textSecondary} />
              <Text style={[styles.vehicleText, vehiculo === 'auto' && styles.vehicleTextSelected]}>Auto</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarme</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  label: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
  },
  vehicleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  vehicleOption: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vehicleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  vehicleText: {
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  vehicleTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  }
});
