import { Type } from '@angular/core';

export interface WindowConfig {
  id: string;
  title: string;
  iconName: string;
  component: Type<any>;
  inputs?: Record<string, unknown>; 
}