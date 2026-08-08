import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

const REASON_PHRASES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

const PRISMA_STATUS_MAP: Record<string, HttpStatus> = {
  P2025: HttpStatus.NOT_FOUND,
  P2002: HttpStatus.CONFLICT,
  P2003: HttpStatus.BAD_REQUEST,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolve(exception);

    if (statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return {
          statusCode: status,
          message: payload,
          error: REASON_PHRASES[status] ?? exception.name,
        };
      }

      const { message, error } = payload as { message?: string | string[]; error?: string };
      return {
        statusCode: status,
        message: message ?? exception.message,
        error: error ?? REASON_PHRASES[status] ?? exception.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status = PRISMA_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;
      return {
        statusCode: status,
        message: this.prismaMessage(exception),
        error: REASON_PHRASES[status] ?? 'Bad Request',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: REASON_PHRASES[HttpStatus.INTERNAL_SERVER_ERROR],
    };
  }

  private prismaMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    switch (exception.code) {
      case 'P2025':
        return 'Resource not found';
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(', ');
        return target
          ? `A record with this ${target} already exists`
          : 'Unique constraint violation';
      }
      case 'P2003':
        return 'Related resource does not exist';
      default:
        return exception.message;
    }
  }
}
