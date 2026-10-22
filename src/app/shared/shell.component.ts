import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

/** Layout das áreas logadas: barra superior + conteúdo da rota filha. */
@Component({
  selector: 'bx-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: block; min-height: 100vh; background: #f3f5f8; }
    .topo { display: flex; align-items: center; gap: 1.5rem; padding: 0.75rem 1.5rem; background: #12263f; color: #f4f7fa; flex-wrap: wrap; }
    .marca { font-weight: 700; font-size: 1.1rem; color: #fff; text-decoration: none; letter-spacing: -0.01em; }
    nav { display: flex; gap: 0.25rem; flex: 1; flex-wrap: wrap; }
    nav a { color: #c9d4e2; text-decoration: none; padding: 0.4rem 0.75rem; border-radius: 6px; }
    nav a.ativo { background: rgba(255,255,255,0.14); color: #fff; }
    nav a.novo { background: #e0a526; color: #12263f; font-weight: 600; }
    a:focus-visible, button:focus-visible { outline: 3px solid #8ab4ff; outline-offset: 2px; }
    .usuario { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
    .usuario small { color: #9fb0c6; }
    .usuario button { font: inherit; background: transparent; color: #fff; border: 1px solid #5a6f8b; border-radius: 6px; padding: 0.3rem 0.7rem; cursor: pointer; }
    main { max-width: 1040px; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }
  `],
  template: `
    <header class="topo">
      <a class="marca" routerLink="/chamados">Business Exchange</a>
      <nav aria-label="Principal">
        <a routerLink="/chamados" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }">Mural</a>
        <a routerLink="/chamados/meus" routerLinkActive="ativo">Meus chamados</a>
        @if (auth.usuario()?.tipo === 'contratante') {
          <a class="novo" routerLink="/chamados/novo">Novo chamado</a>
        }
      </nav>
      <div class="usuario">
        <span>{{ auth.usuario()?.nome }}</span>
        <small>{{ auth.usuario()?.tipo }}</small>
        <button type="button" (click)="auth.logout()">Sair</button>
      </div>
    </header>
    <main><router-outlet /></main>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
}
