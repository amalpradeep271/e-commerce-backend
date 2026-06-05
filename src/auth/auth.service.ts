import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrizzleService } from '../db/db.service';
import { ageTable, userTable } from '../db/schema';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signupDto: SignupDto) {
    const { email, password, firstName, lastName } = signupDto;

    // 1. Check if email exists
    const [existingUser] = await this.drizzleService.db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .execute();

    if (existingUser) {
      throw new ConflictException('An account already exists with that email');
    }

    // 2. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Create user
    const [newUser] = await this.drizzleService.db
      .insert(userTable)
      .values({
        firstName,
        lastName,
        email,
        passwordHash,
      })
      .returning({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        image: userTable.image,
      })
      .execute();

    // 4. Generate JWT
    const accessToken = this.jwtService.sign(
      { userId: newUser.id, email: newUser.email, type: 'access' },
      { expiresIn: '1d' },
    );
    const refreshToken = this.jwtService.sign(
      { userId: newUser.id, email: newUser.email, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      message: 'Sign up was successful',
      accessToken,
      refreshToken,
      user: {
        userId: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        image: newUser.image ?? '',
      },
    };
  }

  async signIn(signinDto: SigninDto) {
    const { email, password } = signinDto;

    // 1. Find user
    const [user] = await this.drizzleService.db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .execute();

    if (!user) {
      throw new UnauthorizedException('No user found for that email');
    }

    // 2. Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Wrong password provided for that user');
    }

    // 3. Generate JWT
    const accessToken = this.jwtService.sign(
      { userId: user.id, email: user.email, type: 'access' },
      { expiresIn: '1d' },
    );
    const refreshToken = this.jwtService.sign(
      { userId: user.id, email: user.email, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      message: 'Sign in was successful',
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image ?? '',
      },
    };
  }

  async getAges() {
    const ages = await this.drizzleService.db.select().from(ageTable).execute();

    return ages.map((age) => ({
      id: age.id,
      value: age.value,
    }));
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const [user] = await this.drizzleService.db
        .select({
          id: userTable.id,
          email: userTable.email,
        })
        .from(userTable)
        .where(eq(userTable.id, payload.userId))
        .execute();

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = this.jwtService.sign(
        { userId: user.id, email: user.email, type: 'access' },
        { expiresIn: '1d' },
      );
      const newRefreshToken = this.jwtService.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        { expiresIn: '7d' },
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
