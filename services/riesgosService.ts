import { Riesgo } from '../types/riesgo';
import { apiGet, apiPatch, apiPost } from './api';
import { obtenerTokenService } from './authService';

type EstadoRiesgo = 'Pendiente' | 'En revisión' | 'Cerrado';

async function obtenerTokenSeguro(): Promise<string> {
  const token = await obtenerTokenService();

  if (!token) {
    console.log('TOKEN VACIO');

    throw new Error('No existe token de autenticación');
  }

  return token;
}

export async function listarRiesgosService(): Promise<Riesgo[]> {
  const token = await obtenerTokenSeguro();

  return apiGet<Riesgo[]>('/incidents', token);
}

export async function crearRiesgoService(riesgo: Riesgo): Promise<void> {
  const token = await obtenerTokenSeguro();

  console.log('TOKEN EN CREAR RIESGO:', token);

  await apiPost<Riesgo>(
    '/incidents',
    riesgo,
    token
  );
}

export async function obtenerRiesgoPorIdService(
  id: string
): Promise<Riesgo | null> {
  try {
    const token = await obtenerTokenSeguro();

    return await apiGet<Riesgo>(
      `/incidents/${id}`,
      token
    );
  } catch (error) {
    console.log(
      'Error al obtener riesgo por id desde backend:',
      error
    );

    return null;
  }
}

export async function actualizarEstadoRiesgoService(
  id: string,
  nuevoEstado: EstadoRiesgo
): Promise<void> {
  const token = await obtenerTokenSeguro();

  await apiPatch<Riesgo>(
    `/incidents/${id}`,
    {
      estado: nuevoEstado,
    },
    token
  );
}