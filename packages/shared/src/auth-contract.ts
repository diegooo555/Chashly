import { z } from 'zod';

export const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

export interface PublicUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}
