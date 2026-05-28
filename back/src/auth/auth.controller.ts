import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.refCode);
  }

  @Get('check-ref')
  async checkRef(@Query('code') code: string) {
    const user = await this.usersService.findByReferralCode(code);
    return { valid: !!user };
  }

  @Get('referral')
  getReferral(@Query('userId') userId: string) {
    return this.usersService.getReferrals(userId);
  }

  @Post('referral/use-bonus')
  useBonus(@Body() body: { userId: string; amount: number }) {
    return this.usersService.useBonus(body.userId, body.amount);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }
  @Post('verify-email')
verifyEmail(@Body() body: { token: string }) {
  return this.authService.verifyEmail(body.token);
}

@Get('check-verified')
checkVerified(@Query('email') email: string) {
  return this.authService.checkVerified(email);
}

}
