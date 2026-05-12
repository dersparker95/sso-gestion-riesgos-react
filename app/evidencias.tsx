import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Riesgo } from '../types/riesgo';
import { obtenerRiesgos } from '../utils/storage';

type EvidenciaConContexto = {
  id: string;
  uri: string;
  tipo: 'foto';
  riesgoId: string;
  tituloRiesgo: string;
  categoria: string;
  fecha: string;
  reportadoPor: string;
};

function EvidenciaCard({ evidencia }: { evidencia: EvidenciaConContexto }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/detalle-riesgo',
          params: {
            id: evidencia.riesgoId,
          },
        })
      }
    >
      <View style={styles.cardTop}>
        <View style={styles.imageBox}>
          <Image source={{ uri: evidencia.uri }} style={styles.image} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.cardTitle}>{evidencia.tituloRiesgo}</Text>
          <Text style={styles.cardText}>Categoría: {evidencia.categoria}</Text>
          <Text style={styles.cardText}>Reportado por: {evidencia.reportadoPor}</Text>
          <Text style={styles.cardText}>Fecha: {evidencia.fecha}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EvidenciasScreen() {
  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);

  async function cargarRiesgos() {
    const data = await obtenerRiesgos();
    setRiesgos(data);
  }

  useFocusEffect(
    useCallback(() => {
      cargarRiesgos();
    }, [])
  );

  const evidencias = useMemo(() => {
    const lista: EvidenciaConContexto[] = [];

    riesgos.forEach((riesgo) => {
      riesgo.evidencias.forEach((evidencia) => {
        lista.push({
          id: evidencia.id,
          uri: evidencia.uri,
          tipo: evidencia.tipo,
          riesgoId: riesgo.id,
          tituloRiesgo: riesgo.titulo,
          categoria: riesgo.categoria,
          fecha: riesgo.fecha,
          reportadoPor: riesgo.reportadoPor?.nombre ?? 'Sin registro',
        });
      });
    });

    return lista;
  }, [riesgos]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Evidencias</Text>
      <Text style={styles.subtitle}>Respaldo fotográfico de los reportes registrados</Text>

      {evidencias.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aún no hay evidencias cargadas en los riesgos</Text>
        </View>
      ) : (
        evidencias.map((evidencia) => (
          <EvidenciaCard key={evidencia.id} evidencia={evidencia} />
        ))
      )}

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
  emptyBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  imageBox: {
    width: 140,
    height: 140,
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  infoBox: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: '#CCCCCC',
    marginTop: 4,
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