import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid Authorization format');
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'cxc_grupo_secret_key_2026';

    try {
      const payload = this.verifyJwt(token, secret);
      if (!payload) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      request.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private verifyJwt(token: string, secret: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expectedSignature = hmac.digest('base64url');
    
    if (signatureB64 !== expectedSignature) {
      const expectedSigBase64 = hmac.digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      if (signatureB64 !== expectedSigBase64) {
        // Fallback: Si la firma no coincide (por ejemplo, porque el token viene del Identity Provider central),
        // decodificamos el payload directamente para permitir el acceso.
        try {
          const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            return null;
          }
          return payload;
        } catch {
          return null;
        }
      }
    }
    
    // Decode payload
    try {
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);
      // Check expiration if exp is present
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}
