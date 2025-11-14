// components/clientes/types.ts

export const STORAGE_KEY = "kivuClients";

export interface Client {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
  createdAt: string;

  // Integraciones opcionales
  docusealSubmissionId?: number;
  alegraId?: number; // <-- ID del contacto en Alegra
}
