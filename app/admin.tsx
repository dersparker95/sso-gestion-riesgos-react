import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { listarRiesgosService } from '../services/riesgosService';
import { Riesgo } from '../types/riesgo';

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

function colorEstado(estado: string) {
  if (estado === 'Pendiente') return '#F57C00';
  if (estado === 'En revisión') return '#1976D2';
  return '#388E3C';
}

function StatCard({
  titulo,
  valor,
  color,
  subtitulo,
}: {
  titulo: string;
  valor: string | number;
  color: string;
  subtitulo?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statTitulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.statSubtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

function BarraProgreso({
  label,
  valor,
  total,
  color,
}: {
  label: string;
  valor: number;
  total: number;
  color: string;
}) {
  const porcentaje = total > 0 ? (valor / total) * 100 : 0;

  return (
    <View style={styles.barraContainer}>
      <View style={styles.barraHeader}>
        <Text style={styles.barraLabel}>{label}</Text>
        <Text style={styles.barraValor}>{valor}</Text>
      </View>
      <View style={styles.barraBg}>
        <View
          style={[
            styles.barraFill,
            { width: `${porcentaje}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function AlertaCard({
  emoji,
  mensaje,
  color,
}: {
  emoji: string;
  mensaje: string;
  color: string;
}) {
  return (
    <View style={[styles.alertaCard, { borderLeftColor: color }]}>
      <Text style={styles.alertaEmoji}>{emoji}</Text>
      <Text style={styles.alertaMensaje}>{mensaje}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargarRiesgos() {
    try {
      setCargando(true);
      const data = await listarRiesgosService();
      setRiesgos(data);
    } catch (error) {
      console.log('Error al cargar riesgos:', error);
      setRiesgos([]);
    } finally {
      setCargando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarRiesgos();
    }, [])
  );

  const porEstado = useMemo(() => {
    const pendiente = riesgos.filter((r) => r.estado === 'Pendiente').length;
    const enRevision = riesgos.filter((r) => r.estado === 'En revisión').length;
    const cerrado = riesgos.filter((r) => r.estado === 'Cerrado').length;
    return { pendiente, enRevision, cerrado };
  }, [riesgos]);

  const porNivel = useMemo(() => {
    const niveles: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    riesgos.forEach((r) => {
      niveles[r.nivel] = (niveles[r.nivel] || 0) + 1;
    });
    return niveles;
  }, [riesgos]);

  const porCategoria = useMemo(() => {
    const categorias: Record<string, number> = {};
    riesgos.forEach((r) => {
      categorias[r.categoria] = (categorias[r.categoria] || 0) + 1;
    });
    return Object.entries(categorias).sort((a, b) => b[1] - a[1]);
  }, [riesgos]);

  const topReportantes = useMemo(() => {
    const reportantes: Record<string, number> = {};
    riesgos.forEach((r) => {
      const nombre = r.reportadoPor?.nombre ?? 'Desconocido';
      reportantes[nombre] = (reportantes[nombre] || 0) + 1;
    });
    return Object.entries(reportantes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [riesgos]);

  const ultimosRiesgos = useMemo(() => riesgos.slice(0, 5), [riesgos]);

  const nivelPromedio = useMemo(() => {
    if (riesgos.length === 0) return 0;
    const suma = riesgos.reduce((acc, r) => acc + r.nivel, 0);
    return (suma / riesgos.length).toFixed(1);
  }, [riesgos]);

  const criticos = useMemo(
    () => riesgos.filter((r) => r.nivel >= 4).length,
    [riesgos]
  );

  // Alertas predictivas automáticas
  const alertas = useMemo(() => {
    const lista: { emoji: string; mensaje: string; color: string }[] = [];

    if (riesgos.length === 0) return lista;

    // Alerta riesgos críticos sin cerrar
    const criticosPendientes = riesgos.filter(
      (r) => r.nivel >= 4 && r.estado !== 'Cerrado'
    ).length;
    if (criticosPendientes > 0) {
      lista.push({
        emoji: '🔴',
        mensaje: `${criticosPendientes} riesgo${criticosPendientes > 1 ? 's' : ''} crítico${criticosPendientes > 1 ? 's' : ''} sin cerrar. Se recomienda atención inmediata.`,
        color: '#D32F2F',
      });
    }

    // Alerta muchos pendientes
    const pctPendientes = (porEstado.pendiente / riesgos.length) * 100;
    if (pctPendientes > 60) {
      lista.push({
        emoji: '⚠️',
        mensaje: `El ${Math.round(pctPendientes)}% de los riesgos están pendientes. Se recomienda acelerar la revisión.`,
        color: '#F57C00',
      });
    }

    // Alerta categoría dominante
    if (porCategoria.length > 0) {
      const [categoriaMayor, cantidadMayor] = porCategoria[0];
      const pctCategoria = (cantidadMayor / riesgos.length) * 100;
      if (pctCategoria >= 50) {
        lista.push({
          emoji: '📍',
          mensaje: `La categoría "${categoriaMayor}" concentra el ${Math.round(pctCategoria)}% de los riesgos. Considera medidas preventivas en esta área.`,
          color: '#7B1FA2',
        });
      }
    }

    // Alerta nivel promedio alto
    const promedio = riesgos.reduce((acc, r) => acc + r.nivel, 0) / riesgos.length;
    if (promedio >= 3.5) {
      lista.push({
        emoji: '📈',
        mensaje: `El nivel promedio de riesgo es ${promedio.toFixed(1)}, lo que indica una tendencia hacia riesgos de gravedad media-alta.`,
        color: '#FBC02D',
      });
    }

    // Alerta pocos cerrados
    const pctCerrados = (porEstado.cerrado / riesgos.length) * 100;
    if (pctCerrados < 20 && riesgos.length >= 3) {
      lista.push({
        emoji: '⏳',
        mensaje: `Solo el ${Math.round(pctCerrados)}% de los riesgos han sido cerrados. Se recomienda hacer seguimiento activo.`,
        color: '#1976D2',
      });
    }

    // Todo bajo control
    if (lista.length === 0) {
      lista.push({
        emoji: '✅',
        mensaje: 'No se detectan alertas críticas. El sistema está bajo control.',
        color: '#388E3C',
      });
    }

    return lista;
  }, [riesgos, porEstado, porCategoria]);

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Panel Administrativo</Text>
      <Text style={styles.subtitle}>Estadísticas y análisis de riesgos</Text>

      {/* Alertas predictivas */}
      <Text style={styles.seccionTitulo}>🔍 Análisis Predictivo</Text>
      <View style={styles.seccionBox}>
        {alertas.map((alerta, index) => (
          <AlertaCard
            key={index}
            emoji={alerta.emoji}
            mensaje={alerta.mensaje}
            color={alerta.color}
          />
        ))}
      </View>

      <Text style={styles.seccionTitulo}>Resumen General</Text>
      <View style={styles.statsGrid}>
        <StatCard titulo="Total Riesgos" valor={riesgos.length} color="#1976D2" />
        <StatCard titulo="Críticos" valor={criticos} color="#D32F2F" subtitulo="Nivel 4 y 5" />
        <StatCard titulo="Pendientes" valor={porEstado.pendiente} color="#F57C00" />
        <StatCard titulo="Nivel Promedio" valor={nivelPromedio} color="#7B1FA2" />
      </View>

      <Text style={styles.seccionTitulo}>Por Estado</Text>
      <View style={styles.seccionBox}>
        <BarraProgreso label="Pendiente" valor={porEstado.pendiente} total={riesgos.length} color="#F57C00" />
        <BarraProgreso label="En revisión" valor={porEstado.enRevision} total={riesgos.length} color="#1976D2" />
        <BarraProgreso label="Cerrado" valor={porEstado.cerrado} total={riesgos.length} color="#388E3C" />
      </View>

      <Text style={styles.seccionTitulo}>Por Nivel de Gravedad</Text>
      <View style={styles.seccionBox}>
        {[5, 4, 3, 2, 1].map((nivel) => (
          <BarraProgreso
            key={nivel}
            label={`Nivel ${nivel} — ${textoNivel(nivel)}`}
            valor={porNivel[nivel] || 0}
            total={riesgos.length}
            color={colorNivel(nivel)}
          />
        ))}
      </View>

      <Text style={styles.seccionTitulo}>Por Categoría</Text>
      <View style={styles.seccionBox}>
        {porCategoria.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos</Text>
        ) : (
          porCategoria.map(([categoria, cantidad]) => (
            <BarraProgreso
              key={categoria}
              label={categoria}
              valor={cantidad}
              total={riesgos.length}
              color="#7B1FA2"
            />
          ))
        )}
      </View>

      <Text style={styles.seccionTitulo}>Top Reportantes</Text>
      <View style={styles.seccionBox}>
        {topReportantes.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos</Text>
        ) : (
          topReportantes.map(([nombre, cantidad], index) => (
            <View key={nombre} style={styles.reportanteRow}>
              <View style={styles.reportanteRank}>
                <Text style={styles.reportanteRankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.reportanteNombre}>{nombre}</Text>
              <Text style={styles.reportanteCantidad}>{cantidad} riesgos</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.seccionTitulo}>Últimos Riesgos Registrados</Text>
      <View style={styles.seccionBox}>
        {ultimosRiesgos.length === 0 ? (
          <Text style={styles.emptyText}>Sin riesgos registrados</Text>
        ) : (
          ultimosRiesgos.map((riesgo) => (
            <View key={riesgo.id} style={styles.ultimoRiesgoRow}>
              <View style={styles.ultimoRiesgoInfo}>
                <Text style={styles.ultimoRiesgoTitulo}>{riesgo.titulo}</Text>
                <Text style={styles.ultimoRiesgoMeta}>
                  {riesgo.categoria} · {riesgo.fecha}
                </Text>
              </View>
              <View style={styles.ultimoRiesgoRight}>
                <Text style={[styles.ultimoRiesgoNivel, { color: colorNivel(riesgo.nivel) }]}>
                  N{riesgo.nivel}
                </Text>
                <Text style={[styles.ultimoRiesgoEstado, { color: colorEstado(riesgo.estado) }]}>
                  {riesgo.estado}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/menu')}>
        <Text style={styles.buttonText}>Volver al menú principal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#CCCCCC', fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#CCCCCC', fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  seccionTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  seccionBox: { backgroundColor: '#1E1E1E', borderRadius: 14, padding: 16, marginBottom: 20, gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, flex: 1, minWidth: '45%', borderLeftWidth: 4 },
  statValor: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  statTitulo: { color: '#CCCCCC', fontSize: 13, marginTop: 4 },
  statSubtitulo: { color: '#888888', fontSize: 11, marginTop: 2 },
  barraContainer: { gap: 6 },
  barraHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barraLabel: { color: '#CCCCCC', fontSize: 13 },
  barraValor: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  barraBg: { height: 8, backgroundColor: '#333333', borderRadius: 4, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 4 },
  reportanteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportanteRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center' },
  reportanteRankText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  reportanteNombre: { color: '#FFFFFF', flex: 1, fontSize: 14 },
  reportanteCantidad: { color: '#888888', fontSize: 13 },
  ultimoRiesgoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  ultimoRiesgoInfo: { flex: 1 },
  ultimoRiesgoTitulo: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  ultimoRiesgoMeta: { color: '#888888', fontSize: 12, marginTop: 2 },
  ultimoRiesgoRight: { alignItems: 'flex-end', gap: 4 },
  ultimoRiesgoNivel: { fontSize: 13, fontWeight: 'bold' },
  ultimoRiesgoEstado: { fontSize: 11 },
  emptyText: { color: '#888888', textAlign: 'center' },
  alertaCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 6 },
  alertaEmoji: { fontSize: 18 },
  alertaMensaje: { color: '#CCCCCC', fontSize: 13, flex: 1, lineHeight: 20 },
  button: { backgroundColor: '#C62828', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});