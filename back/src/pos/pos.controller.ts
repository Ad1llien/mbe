import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PosService } from './pos.service';

@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Get('products')
  getProducts(@Query('ownerId') ownerId: string) {
    return this.posService.getProducts(ownerId);
  }

  @Post('products')
  createProduct(@Query('ownerId') ownerId: string, @Body() body: { name: string; sku: string; price: number; unit?: string }) {
    return this.posService.createProduct(ownerId, body);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Query('ownerId') ownerId: string) {
    return this.posService.deleteProduct(id, ownerId);
  }

  @Get('receipts')
  getReceipts(@Query('ownerId') ownerId: string) {
    return this.posService.getReceipts(ownerId);
  }

  @Post('receipts')
  createReceipt(@Query('ownerId') ownerId: string, @Body() body: { lines: { productId: string; name: string; price: number; qty: number }[]; cashierId?: string }) {
    return this.posService.createReceipt(ownerId, body.cashierId ?? ownerId, body.lines);
  }

  @Post('receipts/:id/void')
  voidReceipt(@Param('id') id: string, @Query('ownerId') ownerId: string, @Body() body: { reason: string }) {
    return this.posService.voidReceipt(id, ownerId, body.reason);
  }
}
