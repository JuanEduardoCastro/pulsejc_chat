import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'http';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${
          (exception as Error).message
        }`,
        (exception as Error).stack,
      );
    }

    const { message, error } = this.formatBody(
      status,
      isHttpException ? exception.getResponse() : null,
      isHttpException,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private formatBody(
    status: number,
    exceptionResponse: unknown,
    isHttpException: boolean,
  ): { message: string | string[]; error: string } {
    if (!isHttpException) {
      return {
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        error: STATUS_CODES[status] ?? 'Unknown Error',
      };
    }

    const body = exceptionResponse as {
      message?: string | string[];
      error?: string;
    };

    return {
      message: body.message ?? STATUS_CODES[status] ?? 'Error',
      error: body.error ?? STATUS_CODES[status] ?? 'Error',
    };
  }
}
