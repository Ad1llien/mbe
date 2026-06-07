import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  getTransactions(@Query('ownerId') ownerId: string) {
    return this.transactionsService.getTransactions(ownerId);
  }

  @Post()
  createTransaction(
    @Query('ownerId') ownerId: string,
    @Body()
    body: {
      label: string;
      amount: number;
      type: string;
      date?: string;
      fromDealId?: string;
      receipt?: string;
      category?: string;
    },
  ) {
    return this.transactionsService.createTransaction(ownerId, body);
  }

  @Delete(':id')
  deleteTransaction(
    @Param('id') id: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.transactionsService.deleteTransaction(id, ownerId);
  }
}
