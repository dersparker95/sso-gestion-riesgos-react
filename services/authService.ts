import { Usuario } from '../data/usuarios';
import {
    cerrarSesion,
    iniciarSesion,
    obtenerUsuarioActual,
} from '../utils/auth';

export async function iniciarSesionService(
  correo: string,
  password: string
): Promise<Usuario | null> {
  return iniciarSesion(correo, password);
}

export async function obtenerUsuarioActualService(): Promise<Usuario | null> {
  return obtenerUsuarioActual();
}

export async function cerrarSesionService(): Promise<void> {
  await cerrarSesion();
}