export type Evidencia = {
  id: string;
  uri: string;
  tipo: 'foto';
};

export type ReportadoPor = {
  nombre: string;
  correo: string;
  rol: string;
  faena: string;
};

export type Riesgo = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  nivel: 1 | 2 | 3 | 4 | 5;
  estado: 'Pendiente' | 'En revisión' | 'Cerrado';
  fecha: string;
  evidencias: Evidencia[];
  reportadoPor: ReportadoPor;
};