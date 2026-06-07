import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // публичный вебхук — сюда летят заявки из рекламы
  @Post('webhook')
webhook(
  @Query('businessId') businessId: string,
  @Query('secret') secret: string,
  @Body() body: { name?: string; phone?: string; email?: string; source?: string },
) {
  return this.leadsService.createLead(businessId, secret, body);
}

  // получить все лиды бизнеса
  @Get()
  getLeads(@Query('businessId') businessId: string) {
    return this.leadsService.getLeads(businessId);
  }

  // изменить статус лида
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.leadsService.updateStatus(id, body.status);
  }

  @Post('business')
  createBusiness(@Body() body: { userId: string; name: string }) {
    return this.leadsService.createBusiness(body.userId, body.name);
  }

  @Post('business/ensure')
  ensureBusiness(@Body() body: { userId: string; name: string }) {
    return this.leadsService.ensureBusiness(body.userId, body.name);
  }
  @Get('business')
  getAllBusinesses() {
  return this.leadsService.getAllBusinesses();
  }

  @Get('business/my')
  async getMyBusiness(@Query('userId') userId: string) {
    const business = await this.leadsService.getMyBusiness(userId);
    return business ?? {};
  }
  @Post('business/regenerate-secret')
regenerateSecret(@Query('userId') userId: string) {
  return this.leadsService.regenerateSecret(userId);
}
}