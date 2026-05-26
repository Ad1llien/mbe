import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(
      body.email,
      body.password,
    );
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
