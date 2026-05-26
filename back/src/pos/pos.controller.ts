import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PosService } from './pos.service';

@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Get('products')
  getProducts() {
    return this.posService.getProducts();
  }

  @Post('products')
  createProduct(@Body() body: { name: string; sku: string; price: number; unit?: string }) {
    return this.posService.createProduct(body);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.posService.deleteProduct(id);
  }

  @Get('receipts')
  getReceipts() {
    return this.posService.getReceipts();
  }

  @Post('receipts')
  createReceipt(@Body() body: { lines: { productId: string; name: string; price: number; qty: number }[] }) {
    return this.posService.createReceipt(body.lines);
  }

  @Post('receipts/:id/void')
  voidReceipt(@Param('id') id: string, @Body() body: { reason: string }) {
  return this.posService.voidReceipt(id, body.reason);
}
}