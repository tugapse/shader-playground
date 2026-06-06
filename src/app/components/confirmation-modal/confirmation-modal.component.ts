import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmationService, ConfirmationRequest } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  public request: ConfirmationRequest | null = null;
  private subscription: Subscription | null = null;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.subscription = this.confirmationService.confirmationRequest$.subscribe(request => {
      this.request = request;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  confirm(): void {
    this.confirmationService.respond(true);
    this.close();
  }

  cancel(): void {
    this.confirmationService.respond(false);
    this.close();
  }

  close(): void {
    this.request = null;
  }
}
