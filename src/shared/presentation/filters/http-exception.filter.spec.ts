import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-endpoint',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException correctly', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          path: '/test-endpoint',
          message: 'Test error',
          error: 'HttpException',
        }),
      );
    });

    it('should handle HttpException with object message', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
        }),
      );
    });

    it('should handle non-HTTP exceptions as internal server error', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'InternalServerError',
        }),
      );
    });

    it('should include timestamp in response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      const beforeTimestamp = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTimestamp).getTime(),
      );
    });

    it('should include request path in response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      mockRequest.url = '/custom/path';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/custom/path',
        }),
      );
    });

    it('should log internal server errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const exception = new Error('Critical error');

      filter.catch(exception, mockArgumentsHost);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Internal Server Error:',
        'Critical error',
        expect.any(String),
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

