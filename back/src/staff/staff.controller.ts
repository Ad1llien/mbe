import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  getStaff(@Query('ownerId') ownerId: string) {
    return this.staffService.getStaff(ownerId);
  }

  @Post()
  createStaff(
    @Query('ownerId') ownerId: string,
    @Body() body: { name: string; email: string; role: string; phone: string; kpiTarget?: number; pin?: string },
  ) {
    return this.staffService.createStaff(ownerId, body);
  }

  @Get('verify')
  verifyStaff(@Query('token') token: string) {
    return this.staffService.verifyStaff(token);
  }

  @Get(':id/activity')
  getActivity(
    @Param('id') id: string,
    @Query('skip') skip = '0',
    @Query('take') take = '10',
  ) {
    return this.staffService.getActivity(id, Number(skip), Number(take));
  }

  @Patch(':id')
  updateStaff(
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; phone?: string; kpiTarget?: number; status?: string },
  ) {
    return this.staffService.updateStaff(id, body);
  }

  @Patch(':id/pin')
  resetPin(@Param('id') id: string) {
    return this.staffService.resetPin(id);
  }

  @Delete(':id')
  deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }

  /* ── Shifts ── */

  @Post(':id/clock-in')
  clockIn(@Param('id') id: string) {
    return this.staffService.clockIn(id);
  }

  @Patch(':id/clock-out')
  clockOut(@Param('id') id: string) {
    return this.staffService.clockOut(id);
  }

  @Get(':id/shifts')
  getShifts(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to')   to?:   string,
  ) {
    return this.staffService.getShifts(id, from, to);
  }

  @Patch('shifts/:shiftId')
  updateShift(
    @Param('shiftId') shiftId: string,
    @Body() body: { clockIn?: string; clockOut?: string; note?: string; editedBy?: string },
  ) {
    return this.staffService.updateShift(shiftId, body);
  }

  @Delete('shifts/:shiftId')
  deleteShift(@Param('shiftId') shiftId: string) {
    return this.staffService.deleteShift(shiftId);
  }
}
