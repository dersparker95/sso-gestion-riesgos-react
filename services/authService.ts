import { Usuario } from '../data/usuarios';
import { apiPost } from './api';

const USUARIO_ACTUAL_KEY = 'USUARIO_ACTUAL';
const TOKEN_KEY = 'TOKEN_API';

type LoginResponse = {
  user: Usuario;
  access_token: string;
};

function guardarSesion(usuario: Usuario, token: string) {
  localStorage.setItem(USUARIO_ACTUAL_KEY, JSON.stringify(usuario));
  localStorage.setItem(TOKEN_KEY, token);
}

export async function iniciarSesionService(
  correo: string,
  password: string
): Promise<Usuario | null> {
  try {
    const respuesta = await apiPost<LoginResponse>('/auth/login', {
      correo,
      password,
    });

    guardarSesion(respuesta.user, respuesta.access_token);

    return respuesta.user;
  } catch (error) {
    console.log('Error al iniciar sesión con backend:', error);
    return null;
  }
}

export async function obtenerUsuarioActualService(): Promise<Usuario | null> {
  try {
    const data = localStorage.getItem(USUARIO_ACTUAL_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log('Error al obtener usuario actual:', error);
    return null;
  }
}

export async function obtenerTokenService(): Promise<string | null> {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.log('Error al obtener token:', error);
    return null;
  }
}

export async function cerrarSesionService(): Promise<void> {
  try {
    localStorage.removeItem(USUARIO_ACTUAL_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.log('Error al cerrar sesión:', error);
  }
}