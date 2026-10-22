import { Routes } from '@angular/router';

export const CHAMADOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Mural de chamados · Business Exchange',
    loadComponent: () =>
      import('./pages/mural-chamados/mural-chamados.component').then(
        (m) => m.MuralChamadosComponent,
      ),
  },
  // Futuro (RF-02): { path: 'novo', loadComponent: ... NovoChamadoComponent }
  // Futuro: { path: ':id', loadComponent: ... DetalheChamadoComponent }
];
