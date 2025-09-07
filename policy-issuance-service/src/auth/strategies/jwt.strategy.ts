import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Simplified validation - in a real scenario, this would call the User Manager Service
    // For now, we'll return a mock user based on the JWT payload
    const roleNames = {
      'admin': 'Admin User',
      'agent': 'Agent User',
      'customer': 'Customer User',
    };

    return {
      id: payload.sub,
      name: roleNames[payload.role] || 'User',
      email: payload.email,
      role: payload.role,
      status: 'active',
    };
  }
}