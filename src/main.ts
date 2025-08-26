import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Add the new method to the String.prototype
declare global {
  interface String {
    capitalize(): string;
  }
}

if (!String.prototype.capitalize) {
  String.prototype.capitalize = function (): string {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
}


bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
