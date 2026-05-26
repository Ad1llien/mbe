import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  getAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { start: 'asc' },
    });
  }

  createAppointment(userId: string, data: {
    title: string;
    start: string;
    duration: number;
    color?: string;
    note?: string;
    clients?: any[];
    contacts?: any[];
    dealId?: string;
  }) {
    return this.prisma.appointment.create({
      data: {
        userId,
        title: data.title,
        start: new Date(data.start),
        duration: data.duration,
        color: data.color ?? 'stage-progress',
        note: data.note,
        clients: data.clients ?? [],
        contacts: data.contacts ?? [],
        dealId: data.dealId,
      },
    });
  }

  updateAppointment(id: string, data: Partial<{
    title: string;
    start: string;
    duration: number;
    color: string;
    note: string;
    clients: any[];
    contacts: any[];
  }>) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        start: data.start ? new Date(data.start) : undefined,
      },
    });
  }

  deleteAppointment(id: string) {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
