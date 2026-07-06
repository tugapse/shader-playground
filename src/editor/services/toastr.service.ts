import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public toasts = signal<ToastMessage[]>([]);
  private nextId = 0;

  public show(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration: number = 4000,
  ): void {
    const id = this.nextId++;
    this.toasts.update((current) => [...current, { id, message, type }]);

    setTimeout(() => {
      this.toasts.update((current) => current.filter((t) => t.id !== id));
    }, duration);
  }

  public success(msg: string): void {
    this.show(msg, 'success');
  }
  public error(msg: string): void {
    this.show(msg, 'error', 6000);
  }
  public info(msg: string): void {
    this.show(msg, 'info');
  }
}
