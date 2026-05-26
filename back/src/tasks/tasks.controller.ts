import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getTasks(@Query('userId') userId: string) {
    return this.tasksService.getTasks(userId);
  }

  @Post()
  createTask(
    @Query('userId') userId: string,
    @Body() body: { title: string; due: string },
  ) {
    return this.tasksService.createTask(userId, body);
  }

  @Patch(':id/toggle')
  toggleTask(@Param('id') id: string) {
    return this.tasksService.toggleTask(id);
  }

  @Delete('completed')
  clearCompleted(@Query('userId') userId: string) {
    return this.tasksService.clearCompleted(userId);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }
}
