import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private posService: PosService) {}

  @Get('products')
  getProducts(@Req() req: any) {
    return this.posService.getProducts(req.user.userId);
  }

  @Post('products')
  createProduct(@Req() req: any, @Body() body: { name: string; sku: string; price: number; unit?: string }) {
    return this.posService.createProduct(req.user.userId, body);
  }

  @Delete('products/:id')
  deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.posService.deleteProduct(id, req.user.userId);
  }

  @Get('receipts')
  getReceipts(@Req() req: any) {
    return this.posService.getReceipts(req.user.userId);
  }

  @Post('receipts')
  createReceipt(@Req() req: any, @Body() body: { lines: { productId: string; name: string; price: number; qty: number }[]; cashierId?: string }) {
    return this.posService.createReceipt(req.user.userId, body.cashierId ?? req.user.userId, body.lines);
  }

  @Post('receipts/:id/void')
  voidReceipt(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.posService.voidReceipt(id, req.user.userId, body.reason);
  }
}
