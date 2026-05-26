import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  getTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { due: 'asc' },
    });
  }

  createTask(userId: string, data: { title: string; due: string }) {
    return this.prisma.task.create({
      data: { userId, title: data.title, due: new Date(data.due) },
    });
  }

  async toggleTask(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new Error('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: { done: !task.done },
    });
  }

  deleteTask(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  clearCompleted(userId: string) {
    return this.prisma.task.deleteMany({
      where: { userId, done: true },
    });
  }
}
