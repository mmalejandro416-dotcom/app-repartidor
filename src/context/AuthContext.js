import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

// CAMBIA ESTO POR TU IP LOCAL PARA PRUEBAS EN DISPOSITIVO FÃSICO
const BASE_URL = 'https://mitienda-production-11f1.up.railway.app/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const authDataSerialized = await AsyncStorage.getItem('@AuthData');
      if (authDataSerialized) {
        const authData = JSON.parse(authDataSerialized);
        setToken(authData.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        const repartidorEnPausa = { ...authData.repartidor, estado: 'desconectado' };
        setUser(repartidorEnPausa);
        await AsyncStorage.setItem('@AuthData', JSON.stringify({ token: authData.token, repartidor: repartidorEnPausa }));
      }
    } catch (error) {
      console.log('Error loading storage data', error);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (telefono, pin) => {
    try {
      const response = await axios.post(`${BASE_URL}/repartidores/login.php`, {
        telefono,
        pin,
      });

      const { token, repartidor } = response.data.data;
      
      const repartidorEnPausa = { ...repartidor, estado: 'desconectado' };
      try {
        await axios.patch(`${BASE_URL}/repartidores/estado.php`, { estado: 'desconectado' });
      } catch (statusError) {
        console.log('Error pausing shift on sign in', statusError);
      }

      setUser(repartidorEnPausa);
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await AsyncStorage.setItem('@AuthData', JSON.stringify({ token, repartidor: repartidorEnPausa }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexiÃ³n' 
      };
    }
  };

  const signUp = async (userData) => {
    try {
      const response = await axios.post(`${BASE_URL}/repartidores/registro.php`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al registrar' 
      };
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await axios.patch(`${BASE_URL}/repartidores/estado.php`, { estado: 'desconectado' });
      }
    } catch (error) {
      console.log('Error updating status on sign out', error);
    }
    await AsyncStorage.removeItem('@AuthData');
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, BASE_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

