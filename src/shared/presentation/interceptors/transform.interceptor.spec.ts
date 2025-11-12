import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();

    const mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should transform response with data, statusCode and timestamp', (done) => {
      const testData = { id: 1, name: 'Test' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result) => {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('statusCode');
        expect(result).toHaveProperty('timestamp');
        expect(result.data).toEqual(testData);
        expect(result.statusCode).toBe(200);
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        done();
      });
    });

    it('should preserve original data structure', (done) => {
      const testData = {
        users: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result) => {
        expect(result.data).toEqual(testData);
        done();
      });
    });

    it('should use correct status code from response', (done) => {
      const mockResponse = { statusCode: 201 };
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
        }),
      } as any;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ test: true }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result) => {
        expect(result.statusCode).toBe(201);
        done();
      });
    });

    it('should add current timestamp', (done) => {
      const beforeTimestamp = new Date().toISOString();
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result) => {
        expect(result.timestamp).toBeDefined();
        expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
          new Date(beforeTimestamp).getTime(),
        );
        done();
      });
    });

    it('should handle null data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result) => {
        expect(result.data).toBeNull();
        expect(result.statusCode).toBe(200);
        expect(result.timestamp).toBeDefined();
        done();
      });
    });

    it('should handle undefined data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result) => {
        expect(result.data).toBeUndefined();
        expect(result.statusCode).toBe(200);
        expect(result.timestamp).toBeDefined();
        done();
      });
    });
  });
});

