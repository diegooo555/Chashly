import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthResponse, Credentials } from '@chashly/shared';
import { AppError } from '../domain/errors.js';
import type { UserRepository } from '../repositories/types.js';

const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfig,
  ) {}

  async register({ email, password }: Credentials): Promise<AuthResponse> {
    if (await this.users.findByEmail(email)) {
      throw AppError.conflict('Ya existe una cuenta con ese correo');
    }
    const user = {
      id: randomUUID(),
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      createdAt: new Date().toISOString(),
    };
    await this.users.create(user);
    return this.issue(user.id, user.email);
  }

  async login({ email, password }: Credentials): Promise<AuthResponse> {
    const user = await this.users.findByEmail(email);
    // Mismo mensaje en ambos casos para no revelar qué correos existen.
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) throw AppError.unauthorized('Correo o contraseña incorrectos');
    return this.issue(user.id, user.email);
  }

  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.config.jwtSecret) as TokenPayload;
    } catch {
      throw AppError.unauthorized('Sesión inválida o expirada');
    }
  }

  private issue(id: string, email: string): AuthResponse {
    const payload: TokenPayload = { sub: id, email };
    const token = jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
    return { token, user: { id, email } };
  }
}
