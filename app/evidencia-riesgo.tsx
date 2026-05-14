import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerUsuarioActualService } from '../services/authService';
import { crearRiesgoService } from '../services/riesgosService';
import { Evidencia, Riesgo } from '../types/riesgo';

export default function EvidenciaRiesgoScreen() {
  const params = useLocalSearchParams();

  const titulo = String(params.titulo ?? '');
  const descripcion = String(params.descripcion ?? '');
  const categoria = String(params.categoria ?? '');
  const nivel = Number(params.nivel ?? 3) as 1 | 2 | 3 | 4 | 5;

  const [imagenes, setImagenes] = useState<Evidencia[]>([]);
  const [guardando, setGuardando] = useState(false);

  async function seleccionarImagen() {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a la galería para subir imágenes');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.4,
      });

      if (!resultado.canceled) {
        const asset = resultado.assets[0];

        const uriFinal = asset.uri;

        const nuevaImagen: Evidencia = {
          id: Date.now().toString(),
          uri: uriFinal,
          tipo: 'foto',
        };

        setImagenes((prev) => [nuevaImagen, ...prev]);
      }
    } catch (error) {
      console.log('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }

  async function handleGuardarRiesgo() {
    if (guardando) return;

    setGuardando(true);

    console.log('Presionaste Guardar riesgo');

    const usuarioActual = await obtenerUsuarioActualService();

    if (!usuarioActual) {
      console.log('No hay usuario actual');

      if (Platform.OS === 'web') {
        window.alert('Sesión no válida. Debes iniciar sesión nuevamente');
      } else {
        Alert.alert('Sesión no válida', 'Debes iniciar sesión nuevamente');
      }

      setGuardando(false);
      router.replace('/login');
      return;
    }

    const nuevoRiesgo: Riesgo = {
      id: Date.now().toString(),
      titulo,
      descripcion,
      categoria,
      nivel,
      estado: 'Pendiente',
      fecha: new Date().toLocaleDateString(),
      evidencias: imagenes,
      reportadoPor: {
        nombre: usuarioActual.nombre,
        correo: usuarioActual.correo,
        rol: usuarioActual.rol,
        faena: usuarioActual.faena,
      },
    };

    try {
      console.log('Guardando riesgo:', nuevoRiesgo);

      await crearRiesgoService(nuevoRiesgo);

      console.log('Riesgo guardado correctamente');

      if (Platform.OS === 'web') {
        window.alert('Riesgo reportado correctamente');
      } else {
        Alert.alert('Riesgo guardado', 'El riesgo fue reportado correctamente');
      }

      router.replace('/lista-riesgos');
    } catch (error) {
      console.log('Error al guardar riesgo:', error);

      if (Platform.OS === 'web') {
        window.alert('No se pudo guardar el riesgo');
      } else {
        Alert.alert('Error', 'No se pudo guardar el riesgo');
      }

      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Evidencia del riesgo</Text>
      <Text style={styles.subtitle}>
        Paso 2: Adjunta respaldo fotográfico antes de guardar
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Título</Text>
        <Text style={styles.infoValue}>{titulo}</Text>

        <Text style={styles.infoLabel}>Categoría</Text>
        <Text style={styles.infoValue}>{categoria}</Text>

        <Text style={styles.infoLabel}>Nivel</Text>
        <Text style={styles.infoValue}>{nivel}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={seleccionarImagen}>
        <Text style={styles.buttonText}>Subir foto</Text>
      </TouchableOpacity>

      {imagenes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aún no hay evidencias cargadas</Text>
        </View>
      ) : (
        imagenes.map((imagen) => (
          <View key={imagen.id} style={styles.card}>
            <Image source={{ uri: imagen.uri }} style={styles.image} />
            <Text style={styles.cardText}>Evidencia cargada</Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Volver al paso anterior</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonSave, guardando && styles.buttonDisabled]}
        onPress={handleGuardarRiesgo}
        disabled={guardando}
      >
        <Text style={styles.buttonText}>
          {guardando ? 'Guardando...' : 'Guardar riesgo'}
        </Text>
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
  infoBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  infoLabel: {
    color: '#CCCCCC',
    fontSize: 13,
    marginTop: 8,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#F57C00',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonSecondary: {
    backgroundColor: '#444444',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonSave: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 20,
  },
  emptyText: {
    color: '#CCCCCC',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  cardText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontWeight: 'bold',
  },
});