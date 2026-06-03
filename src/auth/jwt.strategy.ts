import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../db/db.service';
import { userTable } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly drizzleService: DrizzleService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { userId: string; email: string }) {
    const userId = payload.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const [user] = await this.drizzleService.db
      .select({
        id: userTable.id,
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .execute();

    if (!user) {
      throw new UnauthorizedException('User not found or session expired');
    }

    return user;
  }
}
