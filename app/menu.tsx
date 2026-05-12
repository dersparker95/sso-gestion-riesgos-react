import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Usuario } from '../data/usuarios';
import { obtenerUsuarioActual } from '../utils/auth';

function Card({
  icon,
  title,
  subtitle,
  route,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(route as any)}>
      <View style={styles.cardLeft}>
        <Ionicons name={icon} size={22} color="#F57C00" />
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#888" />
    </TouchableOpacity>
  );
}

export default function MenuScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarUsuario() {
    setCargando(true);
    const actual = await obtenerUsuarioActual();
    setUsuario(actual);
    setCargando(false);
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
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <View style={styles.box}>
          <Text style={styles.small}>Sesión no encontrada</Text>
          <Text style={styles.big}>Debes iniciar sesión</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.buttonText}>Ir al login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const esTrabajador = usuario.rol === 'Trabajador';
  const esSupervisor = usuario.rol === 'Supervisor';
  const esPrevencionista = usuario.rol === 'Prevencionista';
  const esAdministrador = usuario.rol === 'Administrador';

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.small}>Bienvenido</Text>
        <Text style={styles.big}>{usuario.nombre}</Text>
        <Text style={styles.role}>Rol: {usuario.rol}</Text>
        <Text style={styles.role}>Faena: {usuario.faena}</Text>
      </View>

      {(esTrabajador || esSupervisor || esAdministrador) && (
        <Card
          icon="warning-outline"
          title="Registrar riesgo"
          subtitle="Ingresar una nueva observación preventiva"
          route="/registrar-riesgo"
        />
      )}

      {(esSupervisor || esPrevencionista || esAdministrador) && (
        <Card
          icon="list-outline"
          title="Lista de riesgos"
          subtitle="Ver reportes registrados"
          route="/lista-riesgos"
        />
      )}

      {(esSupervisor || esPrevencionista || esAdministrador) && (
        <Card
          icon="images-outline"
          title="Evidencias"
          subtitle="Revisar respaldo visual"
          route="/evidencias"
        />
      )}

      {esAdministrador && (
        <Card
          icon="people-outline"
          title="Usuarios"
          subtitle="Ver perfiles registrados en el sistema"
          route="/usuarios"
        />
      )}

      <Card
        icon="person-outline"
        title="Perfil"
        subtitle="Ver datos del usuario"
        route="/perfil"
      />

      {esAdministrador && (
        <View style={styles.adminBox}>
          <Text style={styles.adminTitle}>Acceso administrativo</Text>
          <Text style={styles.adminText}>
            Este perfil tiene visibilidad completa del sistema.
          </Text>
        </View>
      )}
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
  box: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#C62828',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  small: {
    color: '#CCCCCC',
    fontSize: 15,
  },
  big: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  role: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#CCCCCC',
    marginTop: 4,
  },
  adminBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F57C00',
  },
  adminTitle: {
    color: '#F57C00',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adminText: {
    color: '#CCCCCC',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});