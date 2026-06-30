import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hash,
        emailVerifyToken: emailConfigured ? token : null,
        emailVerifyExpires: emailConfigured ? expires : null,
        emailVerified: !emailConfigured, // auto-verify when no email configured
        credits: 150,
      },
    });

    if (emailConfigured) {
      await this.emailService.sendVerificationEmail(user.email, user.name, token);
      return {
        message: 'נשלח מייל אימות לכתובת שלך. אמתי את המייל כדי להתחבר.',
        email: user.email,
        requiresVerification: true,
      };
    }

    // No email configured — auto-login
    const jwtToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      message: 'נרשמת בהצלחה!',
      email: user.email,
      requiresVerification: false,
      token: jwtToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('קישור האימות אינו תקף או פג תוקפו.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name);

    const jwtToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits },
      token: jwtToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (emailConfigured && !user.emailVerified) {
      throw new UnauthorizedException('יש לאמת את כתובת המייל תחילה. בדקי את תיבת הדואר שלך.');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits },
      token,
    };
  }

  async loginOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
    photo?: string;
  }) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          emailVerified: true,
          credits: 150,
        },
      });
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, emailVerified: true },
      });
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits },
      token,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits,
      },
    };
  }

  async updateProfile(userId: string, body: { name?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...(body.name ? { name: body.name } : {}) },
    });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits },
    };
  }
}
