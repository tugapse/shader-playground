import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { Editor } from '../editor/editor';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { CodeWorkspaceComponent } from 'src/code-editor/editor/code-editor.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'home/:project', component: HomeComponent, canActivate: [authGuard] },
  {
    path: 'code/:project',
    component: CodeWorkspaceComponent,
    canActivate: [authGuard],
  },

  {
    path: 'editor/:project/:scene',
    component: Editor,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];
