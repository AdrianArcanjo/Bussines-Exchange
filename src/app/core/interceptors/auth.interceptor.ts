import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const ROTAS_PUBLICAS = ['/auth/login', '/auth/cadastro', '/auth/refresh', '/auth/logout'];

/**
 * 1) Anexa "Authorization: Bearer <token>" nas chamadas à API.
 * 2) Se a API responder 401 TOKEN_EXPIRED, renova o token uma vez e repete a requisição.
 * 3) Se a sessão não puder ser recuperada, encerra e manda para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const paraApi = req.url.startsWith(environment.apiUrl);
  if (!paraApi || ROTAS_PUBLICAS.some((r) => req.url.endsWith(r))) return next(req);

  const comToken = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(comToken(auth.accessToken)).pipe(
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse) || erro.status !== 401) return throwError(() => erro);

      if (erro.error?.code === 'TOKEN_EXPIRED') {
        return auth.refresh().pipe(
          catchError((e) => {
            auth.logout();
            return throwError(() => e);
          }),
          switchMap((r) => next(comToken(r.accessToken))),
        );
      }

      // TOKEN_INVALID / TOKEN_AUSENTE com sessão local: ela não vale mais
      if (auth.autenticado()) auth.logout();
      return throwError(() => erro);
    }),
  );
};
