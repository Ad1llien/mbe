import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  getProducts() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createProduct(data: { name: string; sku: string; price: number; unit?: string }) {
    return this.prisma.product.create({ data });
  }

  deleteProduct(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  getReceipts() {
    return this.prisma.receipt.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReceipt(lines: { productId: string; name: string; price: number; qty: number }[]) {
    const count = await this.prisma.receipt.count();
    const number = `Z-${1001 + count}`;
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    return this.prisma.receipt.create({
      data: {
        number,
        total,
        cashierId: 'cashier-1',
        items: { create: lines.map(l => ({ ...l })) },
      },
      include: { items: true },
    });
  }

  voidReceipt(id: string, reason: string) {
    return this.prisma.receipt.update({
      where: { id },
      data: { voided: true, voidReason: reason },
    });
  }
}