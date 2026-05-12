import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Riesgo } from '../types/riesgo';

const RIESGOS_KEY = 'RIESGOS_APP';

export async function obtenerRiesgos(): Promise<Riesgo[]> {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(RIESGOS_KEY);
      return data ? JSON.parse(data) : [];
    }

    const data = await AsyncStorage.getItem(RIESGOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error al obtener riesgos:', error);
    return [];
  }
}

export async function guardarRiesgos(riesgos: Riesgo[]) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(RIESGOS_KEY, JSON.stringify(riesgos));
      return;
    }

    await AsyncStorage.setItem(RIESGOS_KEY, JSON.stringify(riesgos));
  } catch (error) {
    console.log('Error al guardar riesgos:', error);
  }
}

export async function agregarRiesgo(riesgo: Riesgo) {
  const actuales = await obtenerRiesgos();
  const nuevos = [riesgo, ...actuales];
  await guardarRiesgos(nuevos);
}

export async function actualizarEstadoRiesgo(
  id: string,
  nuevoEstado: 'Pendiente' | 'En revisión' | 'Cerrado'
) {
  const riesgos = await obtenerRiesgos();

  const actualizados = riesgos.map((riesgo) =>
    riesgo.id === id
      ? {
          ...riesgo,
          estado: nuevoEstado,
        }
      : riesgo
  );

  await guardarRiesgos(actualizados);
}

export async function obtenerRiesgoPorId(id: string): Promise<Riesgo | null> {
  const riesgos = await obtenerRiesgos();
  return riesgos.find((riesgo) => riesgo.id === id) ?? null;
}