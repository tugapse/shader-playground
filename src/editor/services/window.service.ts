import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface WindowConfig {
  id: string;
  title: string;
  iconName: string;
  component: Type<any>;
  inputs?: Record<string, unknown>;
  zIndex: number; // <-- Add zIndex
}

@Injectable({ providedIn: 'root' })
export class WindowService {
  private windowsSubject = new BehaviorSubject<WindowConfig[]>([]);
  public windows$ = this.windowsSubject.asObservable();

  // Track the active window ID
  private activeWindowIdSubject = new BehaviorSubject<string | null>(null);
  public activeWindowId$ = this.activeWindowIdSubject.asObservable();

  // Start z-index at a base number
  private zIndexCounter = 100; 

  open(config: Omit<WindowConfig, 'id' | 'zIndex'>) {
    const newWindow: WindowConfig = { 
      ...config, 
      id: crypto.randomUUID(),
      zIndex: ++this.zIndexCounter // Assign top-most z-index
    };
    
    this.windowsSubject.next([...this.windowsSubject.value, newWindow]);
    this.activeWindowIdSubject.next(newWindow.id); // Focus on open
  }

  focus(id: string) {
    // Prevent unnecessary updates if already focused
    if (this.activeWindowIdSubject.value === id) return; 

    // Find the window and give it the newest, highest z-index
    const updatedWindows = this.windowsSubject.value.map(win => 
      win.id === id ? { ...win, zIndex: ++this.zIndexCounter } : win
    );

    this.windowsSubject.next(updatedWindows);
    this.activeWindowIdSubject.next(id);
  }

  close(id: string) {
    const remainingWindows = this.windowsSubject.value.filter(w => w.id !== id);
    this.windowsSubject.next(remainingWindows);

    // If we closed the active window, focus the most recent one (highest z-index)
    if (this.activeWindowIdSubject.value === id && remainingWindows.length > 0) {
      const topWindow = remainingWindows.reduce((prev, current) => 
        (prev.zIndex > current.zIndex) ? prev : current
      );
      this.activeWindowIdSubject.next(topWindow.id);
    } else if (remainingWindows.length === 0) {
      this.activeWindowIdSubject.next(null);
    }
  }
}