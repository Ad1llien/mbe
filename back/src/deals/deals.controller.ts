import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get()
  getDeals(@Query('ownerId') ownerId: string) {
    return this.dealsService.getDeals(ownerId);
  }

  @Post()
  createDeal(
    @Query('ownerId') ownerId: string,
    @Body() body: { client: string; title: string; amount: number; stageId: string },
  ) {
    return this.dealsService.createDeal(ownerId, body);
  }

  @Patch(':id/stage')
  updateStage(
    @Param('id') id: string,
    @Query('ownerId') ownerId: string,
    @Body() body: { stageId: string },
  ) {
    return this.dealsService.updateStage(id, ownerId, body.stageId);
  }

  @Delete(':id')
  deleteDeal(
    @Param('id') id: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.dealsService.deleteDeal(id, ownerId);
  }
}
