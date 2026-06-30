import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private logger = new Logger('Optimizio');

  info(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, error?: Error, context?: string) {
    this.logger.error(message, error?.stack, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }
}
