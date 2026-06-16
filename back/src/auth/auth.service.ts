import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  import { EmailService } from 'src/email/email.service';
  import { UsersService } from 'src/users/users.service';
  import { PrismaService } from 'src/prisma/prisma.service';
  import * as bcrypt from 'bcrypt';
  import { JwtService } from '@nestjs/jwt';
  import * as crypto from 'crypto';

  const RESEND_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

  @Injectable()
  export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
      private usersService: UsersService,
      private jwtService: JwtService,
      private emailService: EmailService,
      private prisma: PrismaService,
    ) {}
  
    async register(email: string, password: string, refCode?: string) {
      const candidate = await this.usersService.findByEmail(email);

      if (candidate) {
        throw new BadRequestException('User already exists');
      }

      // Validate refCode if provided
      let validRef: string | undefined;
      if (refCode) {
        const referrer = await this.usersService.findByReferralCode(refCode);
        if (referrer) validRef = refCode;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const user = await this.usersService.create(
        email,
        hashedPassword,
        verificationToken,
        validRef,
      );

      // Track when verification email was sent
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationSentAt: new Date() },
      });

      const frontendUrl = process.env.FRONTEND_URL?.split(',')[0].trim() ?? 'http://localhost:8080';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      await this.emailService.sendVerificationEmail(email, verificationLink);
      this.logger.log(`Verification email sent to ${email}`);

      return {
        message: 'User created',
        user,
        bonusApplied: !!validRef,
      };
    }
  
    async login(email: string, password: string) {
      const user = await this.usersService.findByEmail(email);
  
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const isValid = await bcrypt.compare(
        password,
        user.password,
      );
  
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const payload = {
        sub: user.id,
        email: user.email,
      };
  
      return {
        access_token: this.jwtService.sign(payload),
        user: { id: user.id, email: user.email, name: user.email, role: 'admin' },
      };
    }
    async verifyEmail(token: string) {
      const user = await this.usersService.findByVerificationToken(token);
    
      if (!user) {
        throw new BadRequestException('Invalid token');
      }
    
      await this.usersService.markAsVerified(user.id);
    
      return { message: 'Email verified' };
    }
    async checkVerified(email: string) {
      const user = await this.usersService.findByEmail(email);
      return { isVerified: user?.isVerified ?? false };
    }

    async resendVerification(email: string) {
      const user = await this.usersService.findByEmail(email);

      if (!user) throw new BadRequestException('User not found');
      if (user.isVerified) throw new BadRequestException('Email already verified');

      // Enforce 15-minute cooldown
      if (user.verificationSentAt) {
        const elapsed = Date.now() - new Date(user.verificationSentAt).getTime();
        const remaining = RESEND_COOLDOWN_MS - elapsed;

        if (remaining > 0) {
          const mm = Math.floor(remaining / 60000);
          const ss = Math.floor((remaining % 60000) / 1000);
          this.logger.warn(
            `Resend blocked for ${email} — wait ${mm}m ${ss}s more`
          );
          throw new BadRequestException(
            `Подождите ещё ${mm} мин ${ss} сек перед повторной отправкой`
          );
        }
      }

      // Generate new token and resend
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationToken, verificationSentAt: new Date() },
      });

      const frontendUrl = process.env.FRONTEND_URL?.split(',')[0].trim() ?? 'http://localhost:8080';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      await this.emailService.sendVerificationEmail(email, verificationLink);
      this.logger.log(`Verification email re-sent to ${email}`);

      return { message: 'Verification email sent' };
    }
  }