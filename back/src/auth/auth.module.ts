import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // Добавь это
import { JwtStrategy } from './jwt.strategy';     // И это
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [
    UsersModule,
    PassportModule, // Обязательно для работы стратегий
    JwtModule.register({
      secret: 'SUPER_SECRET', // Убедись, что в JwtStrategy такой же ключ!
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService, PrismaService],
})
export class AuthModule {}