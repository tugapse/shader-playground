import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationRequestSubject = new Subject<ConfirmationRequest>();
  private currentResultSubject: Subject<boolean> | null = null;

  public confirmationRequest$ = this.confirmationRequestSubject.asObservable();

  public confirm(request: ConfirmationRequest): Observable<boolean> {
    if (this.currentResultSubject) {
      this.currentResultSubject.complete();
    }
    this.currentResultSubject = new Subject<boolean>();
    
    this.confirmationRequestSubject.next({
      title: request.title,
      message: request.message,
      confirmText: request.confirmText || 'Confirm',
      cancelText: request.cancelText || 'Cancel'
    });
    return this.currentResultSubject.asObservable();
  }

  public respond(result: boolean): void {
    if (this.currentResultSubject) {
      this.currentResultSubject.next(result);
      this.currentResultSubject.complete();
      this.currentResultSubject = null;
    }
  }
}
