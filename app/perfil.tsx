import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Usuario } from '../data/usuarios';
import { cerrarSesion, obtenerUsuarioActual } from '../utils/auth';

function DatoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarUsuario() {
    setCargando(true);
    const actual = await obtenerUsuarioActual();
    setUsuario(actual);
    setCargando(false);
  }

  async function handleCerrarSesion() {
    await cerrarSesion();
    router.replace('/login');
  }

  useFocusEffect(
    useCallback(() => {
      cargarUsuario();
    }, [])
  );

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F57C00" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>No hay usuario con sesión iniciada</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.buttonText}>Ir al login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Ver datos del usuario</Text>

      <DatoCard label="Nombre" value={usuario.nombre} />
      <DatoCard label="Correo" value={usuario.correo} />
      <DatoCard label="Rol" value={usuario.rol} />
      <DatoCard label="Empresa" value={usuario.empresa} />
      <DatoCard label="Faena" value={usuario.faena} />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCerrarSesion}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 12,
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  label: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 6,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});