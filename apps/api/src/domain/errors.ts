/** Error de dominio con código HTTP asociado. Los errores no controlados se tratan como 500. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(message = 'No autorizado') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
}
