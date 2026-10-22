import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TipoUsuario } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

/** Bloqueia rotas privadas e redireciona para o login (TS-03). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Quem já entrou não precisa ver login/cadastro. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? router.createUrlTree(['/chamados']) : true;
};

/** Restringe por perfil: canActivate: [authGuard, roleGuard('contratante')] */
export const roleGuard =
  (...tipos: TipoUsuario[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const tipo = auth.usuario()?.tipo;
    return tipo && tipos.includes(tipo) ? true : router.createUrlTree(['/chamados']);
  };
