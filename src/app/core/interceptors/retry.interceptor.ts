import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

/** Retries transient network/server errors with exponential backoff (max 2 retries). */
export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: 2,
      delay: (error: unknown, retryCount: number) => {
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        const transient = status === 0 || status === 429 || status >= 500;
        if (!transient) throw error;
        return timer(300 * 2 ** (retryCount - 1));
      },
    }),
  );
