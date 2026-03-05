import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const region = configService.get<string>('AWS_REGION');
    const userPoolId = configService.get<string>('AWS_COGNITO_USER_POOL_ID');

    if (!region || !userPoolId) {
      throw new Error('AWS_REGION and AWS_COGNITO_USER_POOL_ID must be configured');
    }

    const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
    });
  }

  /**
   * Validates the JWT payload and attaches the user to the request
   * This method is called automatically by Passport after the JWT is verified
   */
  validate(payload: { sub?: string; token_use?: string; client_id?: string; aud?: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify token is from the correct client
    // Access tokens use 'client_id', ID tokens use 'aud'
    const clientId = this.configService.get<string>('AWS_COGNITO_CLIENT_ID');
    const tokenClientId = payload.client_id || payload.aud;

    if (clientId && tokenClientId !== clientId) {
      throw new UnauthorizedException('Token is not for this client');
    }

    // Verify token use (should be 'access' or 'id')
    if (payload.token_use && !['access', 'id'].includes(payload.token_use)) {
      throw new UnauthorizedException('Invalid token use');
    }

    // The returned object will be attached to request.user
    return {
      userId: payload.sub,
      tokenUse: payload.token_use,
    };
  }
}
