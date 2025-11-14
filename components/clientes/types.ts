// components/clientes/types.ts

export const STORAGE_KEY = "kivuClients";

export interface Client {
  id: string; // id interno del backoffice (para React / localStorage)
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
  createdAt: string;

  // ID del submission creado en DocuSeal (si existe)
  docusealSubmissionId?: number;

  // ID real del contacto en Alegra
  alegraId?: number;
}
