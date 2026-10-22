import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shared/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/cadastro.component').then((m) => m.CadastroComponent),
  },
  {
    // Área logada: tudo aqui dentro exige token (TS-03) e usa o layout com menu
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'chamados',
        loadComponent: () => import('./features/chamados/chamados.component').then((m) => m.ChamadosComponent),
      },
      // rotas fixas ANTES de ':id'
      {
        path: 'chamados/novo',
        canActivate: [roleGuard('contratante')],
        loadComponent: () => import('./features/chamados/novo-chamado.component').then((m) => m.NovoChamadoComponent),
      },
      {
        path: 'chamados/meus',
        loadComponent: () => import('./features/chamados/meus-chamados.component').then((m) => m.MeusChamadosComponent),
      },
      {
        path: 'chamados/:id',
        loadComponent: () => import('./features/chamados/chamado-detalhe.component').then((m) => m.ChamadoDetalheComponent),
      },
      {
        path: 'usuarios/:id',
        loadComponent: () => import('./features/chamados/perfil.component').then((m) => m.PerfilComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'chamados' },
    ],
  },
  { path: '**', redirectTo: 'chamados' },
];
