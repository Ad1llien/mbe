import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { EmailService } from 'src/email/email.service';
  import { UsersService } from 'src/users/users.service';
  import * as bcrypt from 'bcrypt';
  import { JwtService } from '@nestjs/jwt';
  import * as crypto from 'crypto';
  @Injectable()
  export class AuthService {
    

    constructor(
      private usersService: UsersService,
      private jwtService: JwtService,
      private emailService: EmailService,

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

      const frontendUrl = process.env.FRONTEND_URL?.split(',')[0].trim() ?? 'http://localhost:8080';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      await this.emailService.sendVerificationEmail(email, verificationLink);

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
  }