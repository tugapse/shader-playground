import { Routes } from '@angular/router';
import { authGuard } from '../editor/guards/auth.guard';
import { Editor } from '../editor/editor';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'editor', component: Editor, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];
