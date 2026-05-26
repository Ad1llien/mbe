import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  getAppointments(@Query('userId') userId: string) {
    return this.appointmentsService.getAppointments(userId);
  }

  @Post()
  createAppointment(
    @Query('userId') userId: string,
    @Body() body: any,
  ) {
    return this.appointmentsService.createAppointment(userId, body);
  }

  @Patch(':id')
  updateAppointment(@Param('id') id: string, @Body() body: any) {
    return this.appointmentsService.updateAppointment(id, body);
  }

  @Delete(':id')
  deleteAppointment(@Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(id);
  }
}
