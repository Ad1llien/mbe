import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const STAFF_SELECT = {
  id: true, ownerId: true, name: true, email: true,
  role: true, phone: true, pin: true, kpiTarget: true,
  status: true, verified: true, hiredAt: true, permissions: true,
};

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  getStaff(ownerId: string) {
    return this.prisma.staffMember.findMany({
      where: { ownerId },
      orderBy: { hiredAt: 'desc' },
      select: STAFF_SELECT,
    });
  }

  async createStaff(ownerId: string, data: {
    name: string;
    email: string;
    role: string;
    phone: string;
    kpiTarget?: number;
    pin?: string;
    password?: string;
    permissions?: string[];
  }) {
    // Check for duplicate email before hitting the DB unique constraint
    const existing = await this.prisma.staffMember.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException(`A staff member with email "${data.email}" already exists`);
    }

    const pin = data.pin || String(Math.floor(10000000 + Math.random() * 90000000));
    const password = data.password || randomUUID().slice(0, 12);
    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = randomUUID();

    const member = await this.prisma.staffMember.create({
      data: {
        ownerId,
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        phone: data.phone,
        kpiTarget: data.kpiTarget ?? 0,
        pin,
        verifyToken,
        permissions: data.permissions ?? [],
      },
      select: STAFF_SELECT,
    });

    // Send invite email — non-blocking: don't fail the request if email service is down
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/staff/verify?token=${verifyToken}`;
    this.email.sendStaffInviteEmail(data.email, data.name, verifyLink, password)
      .catch(err => console.warn('[Staff] Invite email failed (non-fatal):', err?.message ?? err));

    return { ...member, tempPassword: password };
  }

  async verifyStaff(token: string) {
    const member = await this.prisma.staffMember.findUnique({ where: { verifyToken: token } });
    if (!member) return { success: false, message: 'Invalid or expired token' };

    await this.prisma.staffMember.update({
      where: { id: member.id },
      data: { verified: true, verifyToken: null },
    });

    await this.prisma.staffActivity.create({
      data: { staffId: member.id, type: 'verified', note: 'Email verified' },
    });

    return { success: true };
  }

  async updateStaff(id: string, data: { name?: string; role?: string; phone?: string; kpiTarget?: number; status?: string; permissions?: string[] }) {
    return this.prisma.staffMember.update({
      where: { id },
      data: {
        ...(data.name        !== undefined && { name: data.name }),
        ...(data.role        !== undefined && { role: data.role }),
        ...(data.phone       !== undefined && { phone: data.phone }),
        ...(data.kpiTarget   !== undefined && { kpiTarget: data.kpiTarget }),
        ...(data.status      !== undefined && { status: data.status }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      },
      select: STAFF_SELECT,
    });
  }

  async resetPin(id: string) {
    const pin = String(Math.floor(10000000 + Math.random() * 90000000));
    await this.prisma.staffMember.update({ where: { id }, data: { pin } });
    return { pin };
  }

  deleteStaff(id: string) {
    return this.prisma.staffMember.delete({ where: { id } });
  }

  async getActivity(staffId: string, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.staffActivity.findMany({
        where: { staffId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.staffActivity.count({ where: { staffId } }),
    ]);
    return { items, total, hasMore: skip + take < total };
  }

  /* ── Shifts / Time tracking ── */

  async clockIn(staffId: string) {
    // Prevent double clock-in
    const active = await this.prisma.staffShift.findFirst({
      where: { staffId, clockOut: null },
    });
    if (active) return { error: 'Already clocked in', shift: active };

    const shift = await this.prisma.staffShift.create({
      data: { staffId, clockIn: new Date() },
    });
    await this.prisma.staffActivity.create({
      data: { staffId, type: 'shift_start', note: 'Clocked in' },
    });
    return shift;
  }

  async clockOut(staffId: string) {
    const active = await this.prisma.staffShift.findFirst({
      where: { staffId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });
    if (!active) return { error: 'Not clocked in' };

    const shift = await this.prisma.staffShift.update({
      where: { id: active.id },
      data: { clockOut: new Date() },
    });
    await this.prisma.staffActivity.create({
      data: { staffId, type: 'shift_end', note: 'Clocked out' },
    });
    return shift;
  }

  async getShifts(staffId: string, from?: string, to?: string) {
    const where: any = { staffId };
    if (from || to) {
      where.clockIn = {};
      if (from) where.clockIn.gte = new Date(from);
      if (to)   where.clockIn.lte = new Date(to);
    }
    const shifts = await this.prisma.staffShift.findMany({
      where,
      orderBy: { clockIn: 'desc' },
    });

    // Compute total minutes for the returned range
    const totalMinutes = shifts.reduce((sum, s) => {
      if (!s.clockOut) return sum;
      return sum + Math.round((s.clockOut.getTime() - s.clockIn.getTime()) / 60000);
    }, 0);

    // Active shift (no clockOut)
    const activeShift = shifts.find(s => !s.clockOut) ?? null;

    return { shifts, totalMinutes, activeShift };
  }

  async updateShift(shiftId: string, data: { clockIn?: string; clockOut?: string; note?: string; editedBy?: string }) {
    return this.prisma.staffShift.update({
      where: { id: shiftId },
      data: {
        ...(data.clockIn  ? { clockIn:  new Date(data.clockIn)  } : {}),
        ...(data.clockOut ? { clockOut: new Date(data.clockOut) } : {}),
        ...(data.note     !== undefined ? { note: data.note }    : {}),
        ...(data.editedBy !== undefined ? { editedBy: data.editedBy } : {}),
      },
    });
  }

  async deleteShift(shiftId: string) {
    return this.prisma.staffShift.delete({ where: { id: shiftId } });
  }
}
