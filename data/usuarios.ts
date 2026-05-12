export type RolUsuario =
  | 'Trabajador'
  | 'Supervisor'
  | 'Prevencionista'
  | 'Administrador';

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: RolUsuario;
  empresa: string;
  faena: string;
  activo: boolean;
};

export const usuarios: Usuario[] = [
  {
    id: '1',
    nombre: 'Juan Pérez',
    correo: 'juan.perez@empresa.cl',
    password: '1234',
    rol: 'Trabajador',
    empresa: 'Empresa Demo',
    faena: 'Faena Norte',
    activo: true,
  },
  {
    id: '2',
    nombre: 'María González',
    correo: 'maria.gonzalez@empresa.cl',
    password: '1234',
    rol: 'Supervisor',
    empresa: 'Empresa Demo',
    faena: 'Faena Norte',
    activo: true,
  },
  {
    id: '3',
    nombre: 'Carlos Muñoz',
    correo: 'carlos.munoz@empresa.cl',
    password: '1234',
    rol: 'Prevencionista',
    empresa: 'Empresa Demo',
    faena: 'Faena Sur',
    activo: true,
  },
  {
    id: '4',
    nombre: 'Ana Rojas',
    correo: 'ana.rojas@empresa.cl',
    password: '1234',
    rol: 'Administrador',
    empresa: 'Empresa Demo',
    faena: 'Casa Matriz',
    activo: true,
  },
];