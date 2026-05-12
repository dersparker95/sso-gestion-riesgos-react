import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Riesgo } from '../types/riesgo';
import { obtenerRiesgos } from '../utils/storage';

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

function BotonFiltro({
  texto,
  activo,
  onPress,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filtroButton, activo && styles.filtroButtonActivo]}
      onPress={onPress}
    >
      <Text style={[styles.filtroButtonText, activo && styles.filtroButtonTextActivo]}>
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

function RiesgoCard({ riesgo }: { riesgo: Riesgo }) {
  const nombreReportante = riesgo.reportadoPor?.nombre ?? 'Sin registro';
  const correoReportante = riesgo.reportadoPor?.correo ?? 'Sin registro';
  const rolReportante = riesgo.reportadoPor?.rol ?? 'Sin registro';
  const faenaReportante = riesgo.reportadoPor?.faena ?? 'Sin registro';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/detalle-riesgo',
          params: {
            id: riesgo.id,
            titulo: riesgo.titulo,
            descripcion: riesgo.descripcion,
            categoria: riesgo.categoria,
            estado: riesgo.estado,
            fecha: riesgo.fecha,
            nivel: String(riesgo.nivel),
            evidencias: String(riesgo.evidencias.length),
            reportadoPorNombre: nombreReportante,
            reportadoPorCorreo: correoReportante,
            reportadoPorRol: rolReportante,
            reportadoPorFaena: faenaReportante,
          },
        })
      }
    >
      <Text style={styles.cardTitle}>{riesgo.titulo}</Text>
      <Text style={styles.cardSubtitle}>Estado: {riesgo.estado}</Text>
      <Text style={styles.cardSubtitle}>Categoría: {riesgo.categoria}</Text>
      <Text style={[styles.cardNivel, { color: colorNivel(riesgo.nivel) }]}>
        Nivel {riesgo.nivel} - {textoNivel(riesgo.nivel)}
      </Text>
      <Text style={styles.cardSubtitle}>Evidencias: {riesgo.evidencias.length}</Text>
      <Text style={styles.cardSubtitle}>Reportado por: {nombreReportante}</Text>
      <Text style={styles.cardFecha}>Fecha: {riesgo.fecha}</Text>
    </TouchableOpacity>
  );
}

export default function ListaRiesgosScreen() {
  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroNivel, setFiltroNivel] = useState('Todos');

  async function cargarRiesgos() {
    const data = await obtenerRiesgos();
    setRiesgos(data);
  }

  useFocusEffect(
    useCallback(() => {
      cargarRiesgos();
    }, [])
  );

  const categoriasDisponibles = useMemo(() => {
    const categorias = riesgos.map((item) => item.categoria);
    return ['Todos', ...Array.from(new Set(categorias))];
  }, [riesgos]);

  const riesgosFiltrados = useMemo(() => {
    return riesgos.filter((riesgo) => {
      const cumpleCategoria =
        filtroCategoria === 'Todos' || riesgo.categoria === filtroCategoria;

      const cumpleEstado =
        filtroEstado === 'Todos' || riesgo.estado === filtroEstado;

      const cumpleNivel =
        filtroNivel === 'Todos' || String(riesgo.nivel) === filtroNivel;

      return cumpleCategoria && cumpleEstado && cumpleNivel;
    });
  }, [riesgos, filtroCategoria, filtroEstado, filtroNivel]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lista de riesgos</Text>
      <Text style={styles.subtitle}>Ver reportes registrados</Text>

      <View style={styles.filtroBox}>
        <Text style={styles.filtroLabel}>Filtrar por categoría</Text>
        <View style={styles.filtroWrap}>
          {categoriasDisponibles.map((item) => (
            <BotonFiltro
              key={item}
              texto={item}
              activo={filtroCategoria === item}
              onPress={() => setFiltroCategoria(item)}
            />
          ))}
        </View>

        <Text style={styles.filtroLabel}>Filtrar por estado</Text>
        <View style={styles.filtroWrap}>
          {['Todos', 'Pendiente', 'En revisión', 'Cerrado'].map((item) => (
            <BotonFiltro
              key={item}
              texto={item}
              activo={filtroEstado === item}
              onPress={() => setFiltroEstado(item)}
            />
          ))}
        </View>

        <Text style={styles.filtroLabel}>Filtrar por nivel</Text>
        <View style={styles.filtroWrap}>
          {['Todos', '1', '2', '3', '4', '5'].map((item) => (
            <BotonFiltro
              key={item}
              texto={item}
              activo={filtroNivel === item}
              onPress={() => setFiltroNivel(item)}
            />
          ))}
        </View>
      </View>

      {riesgosFiltrados.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No hay riesgos para ese filtro</Text>
        </View>
      ) : (
        riesgosFiltrados.map((riesgo) => (
          <RiesgoCard key={riesgo.id} riesgo={riesgo} />
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
  filtroBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  filtroLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
  },
  filtroWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filtroButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filtroButtonActivo: {
    backgroundColor: '#F57C00',
    borderColor: '#F57C00',
  },
  filtroButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filtroButtonTextActivo: {
    color: '#FFFFFF',
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
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#CCCCCC',
    marginTop: 6,
  },
  cardNivel: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  cardFecha: {
    color: '#888888',
    marginTop: 8,
    fontSize: 12,
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