import { Type } from '@angular/core';

export interface WindowConfig {
  id: string;
  title: string;
  iconName: string;
  footer: string;
  isMaximized?: boolean;
  component: Type<any>;
  inputs?: Record<string, unknown>;
  zIndex: number;
}
