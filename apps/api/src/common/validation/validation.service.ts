import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ValidationService {
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      throw new HttpException('Invalid URL format', HttpStatus.BAD_REQUEST);
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): boolean {
    return password.length >= 8;
  }
}
