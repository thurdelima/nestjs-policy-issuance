export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
