import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Usuario } from '../data/usuarios';
import { Riesgo } from '../types/riesgo';
import { obtenerUsuarioActual } from '../utils/auth';
import { actualizarEstadoRiesgo, obtenerRiesgoPorId } from '../utils/storage';

function colorNivel(nivel: number) {
  if (nivel === 5) return '#D32F2F';
  if (nivel === 4) return '#F57C00';
  if (nivel === 3) return '#FBC02D';
  if (nivel === 2) return '#689F38';
  return '#388E3C';
}

function textoNivel(nivel: number) {
  if (nivel === 5) return 'Crítico';
  if (nivel === 4) return 'Alto';
  if (nivel === 3) return 'Medio';
  if (nivel === 2) return 'Bajo';
  return 'Muy bajo';
}

function BotonEstado({
  texto,
  activo,
  onPress,
}: {
  texto: 'Pendiente' | 'En revisión' | 'Cerrado';
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.estadoButton, activo && styles.estadoButtonActivo]}
      onPress={onPress}
    >
      <Text style={[styles.estadoButtonText, activo && styles.estadoButtonTextActivo]}>
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

export default function DetalleRiesgoScreen() {
  const params = useLocalSearchParams();
  const id = String(params.id ?? '');

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [riesgo, setRiesgo] = useState<Riesgo | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarDatos() {
    setCargando(true);

    const actual = await obtenerUsuarioActual();
    setUsuario(actual);

    if (id) {
      const riesgoEncontrado = await obtenerRiesgoPorId(id);
      setRiesgo(riesgoEncontrado);
    }

    setCargando(false);
  }

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [id])
  );

  async function cambiarEstado(nuevoEstado: 'Pendiente' | 'En revisión' | 'Cerrado') {
    if (!riesgo) return;

    await actualizarEstadoRiesgo(riesgo.id, nuevoEstado);
    Alert.alert('Estado actualizado', `El riesgo ahora está en "${nuevoEstado}"`);
    cargarDatos();
  }

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F57C00" />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!riesgo) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Detalle de riesgo</Text>
        <Text style={styles.subtitle}>No se encontró el riesgo seleccionado</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/lista-riesgos')}
        >
          <Text style={styles.buttonText}>Volver a la lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const puedeCambiarEstado =
    usuario?.rol === 'Prevencionista' || usuario?.rol === 'Administrador';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Detalle de riesgo</Text>
      <Text style={styles.subtitle}>Información completa del reporte</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Título</Text>
        <Text style={styles.value}>{riesgo.titulo}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Descripción</Text>
        <Text style={styles.value}>{riesgo.descripcion}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Categoría</Text>
        <Text style={styles.value}>{riesgo.categoria}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estado</Text>
        <Text style={styles.value}>{riesgo.estado}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nivel de riesgo</Text>
        <Text style={[styles.value, { color: colorNivel(riesgo.nivel) }]}>
          {riesgo.nivel} - {textoNivel(riesgo.nivel)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Fecha</Text>
        <Text style={styles.value}>{riesgo.fecha}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Evidencias adjuntas</Text>
        <Text style={styles.value}>
          {riesgo.evidencias.length === 0
            ? 'Sin evidencias'
            : `${riesgo.evidencias.length} archivo(s)`}
        </Text>
      </View>

      {riesgo.evidencias.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>Fotografías del reporte</Text>

          {riesgo.evidencias.map((evidencia) => (
            <View key={evidencia.id} style={styles.imageBox}>
              <Image source={{ uri: evidencia.uri }} style={styles.image} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Reportado por</Text>
        <Text style={styles.value}>{riesgo.reportadoPor?.nombre ?? 'Sin información'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Correo del reportante</Text>
        <Text style={styles.value}>{riesgo.reportadoPor?.correo ?? 'Sin información'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Rol del reportante</Text>
        <Text style={styles.value}>{riesgo.reportadoPor?.rol ?? 'Sin información'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Faena del reportante</Text>
        <Text style={styles.value}>{riesgo.reportadoPor?.faena ?? 'Sin información'}</Text>
      </View>

      {puedeCambiarEstado && (
        <View style={styles.card}>
          <Text style={styles.label}>Cambiar estado</Text>

          <View style={styles.estadoRow}>
            <BotonEstado
              texto="Pendiente"
              activo={riesgo.estado === 'Pendiente'}
              onPress={() => cambiarEstado('Pendiente')}
            />
            <BotonEstado
              texto="En revisión"
              activo={riesgo.estado === 'En revisión'}
              onPress={() => cambiarEstado('En revisión')}
            />
            <BotonEstado
              texto="Cerrado"
              activo={riesgo.estado === 'Cerrado'}
              onPress={() => cambiarEstado('Cerrado')}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => router.push('/lista-riesgos')}
      >
        <Text style={styles.buttonText}>Volver a la lista</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/menu')}
      >
        <Text style={styles.buttonText}>Volver al menú principal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
  imageBox: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 8,
    marginTop: 12,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    resizeMode: 'contain',
    backgroundColor: '#121212',
  },
  estadoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  estadoButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  estadoButtonActivo: {
    backgroundColor: '#F57C00',
    borderColor: '#F57C00',
  },
  estadoButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  estadoButtonTextActivo: {
    color: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: '#F57C00',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});