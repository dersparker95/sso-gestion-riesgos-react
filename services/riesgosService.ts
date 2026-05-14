import { Riesgo } from '../types/riesgo';
import {
    actualizarEstadoRiesgo,
    agregarRiesgo,
    obtenerRiesgoPorId,
    obtenerRiesgos,
} from '../utils/storage';

export async function listarRiesgosService(): Promise<Riesgo[]> {
  return obtenerRiesgos();
}

export async function crearRiesgoService(riesgo: Riesgo): Promise<void> {
  await agregarRiesgo(riesgo);
}

export async function obtenerRiesgoPorIdService(id: string): Promise<Riesgo | null> {
  return obtenerRiesgoPorId(id);
}

export async function actualizarEstadoRiesgoService(
  id: string,
  nuevoEstado: 'Pendiente' | 'En revisión' | 'Cerrado'
): Promise<void> {
  await actualizarEstadoRiesgo(id, nuevoEstado);
}