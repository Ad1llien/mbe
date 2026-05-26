import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PosModule } from './pos/pos.module';
import { LeadsModule } from './leads/leads.module';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { TasksModule } from './tasks/tasks.module';
import { AppointmentsModule } from './appointments/appointments.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    EmailModule,
    PosModule,
    LeadsModule,
    TasksModule,
    AppointmentsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}