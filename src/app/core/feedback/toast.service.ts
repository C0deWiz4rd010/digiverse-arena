import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'reward';

export interface Toast {
  id: number;
  icon: string;
  title: string;
  message?: string;
  tone: ToastTone;
}

/**
 * Lightweight global toast queue. Any service or component can push a toast;
 * the {@link ToastHost} rendered in the app shell displays and auto-dismisses them.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<Toast[]>([]);
  private seq = 0;

  readonly toasts = this.items.asReadonly();

  push(toast: Omit<Toast, 'id'>, ttlMs = 4200): void {
    const id = ++this.seq;
    this.items.update((list) => [...list, { ...toast, id }].slice(-4));
    if (ttlMs > 0) {
      setTimeout(() => this.dismiss(id), ttlMs);
    }
  }

  success(title: string, message?: string, icon = '✅'): void {
    this.push({ title, message, icon, tone: 'success' });
  }

  reward(title: string, message?: string, icon = '🏅'): void {
    this.push({ title, message, icon, tone: 'reward' });
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }
}
