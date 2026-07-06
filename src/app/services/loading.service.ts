import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly visible = signal<boolean>(false);
  readonly message = signal<string>('Loading Workspace Environment...');

  /**
   * Activates the global loading screen and blocks user interactions
   * @param displayMessage Custom text to present below the spinner
   */
  show(displayMessage: string = 'Loading Workspace Environment...'): void {
    this.message.set(displayMessage);
    this.visible.set(true);
  }

  /**
   * Hides the loading screen and restores input accessibility
   */
  hide(): void {
    this.visible.set(false);
  }
}
