import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, CadastroRequest, LoginRequest, Sessao } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly api = `${environment.apiUrl}/auth`;
  private readonly STORAGE_KEY = 'bx.sessao';

  private readonly sessao = signal<Sessao | null>(this.carregar());
  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly autenticado = computed(() => this.sessao() !== null);

  /** Garante um único refresh em andamento, mesmo com várias requisições recebendo 401 juntas. */
  private refreshEmAndamento$: Observable<AuthResponse> | null = null;

  get accessToken(): string | null {
    return this.sessao()?.accessToken ?? null;
  }

  login(dados: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, dados).pipe(tap((r) => this.salvar(r)));
  }

  cadastrar(dados: CadastroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/cadastro`, dados).pipe(tap((r) => this.salvar(r)));
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.sessao()?.refreshToken;
    if (!refreshToken) return throwError(() => new Error('Sem sessão para renovar'));

    this.refreshEmAndamento$ ??= this.http
      .post<AuthResponse>(`${this.api}/refresh`, { refreshToken })
      .pipe(
        tap((r) => this.salvar(r)),
        finalize(() => (this.refreshEmAndamento$ = null)),
        shareReplay(1),
      );
    return this.refreshEmAndamento$;
  }

  /** Encerra a sessão local na hora e avisa a API em segundo plano (revoga o refresh token). */
  logout(): void {
    const refreshToken = this.sessao()?.refreshToken;
    this.limpar();
    if (refreshToken) {
      this.http.post(`${this.api}/logout`, { refreshToken }).pipe(catchError(() => of(null))).subscribe();
    }
    this.router.navigate(['/login']);
  }

  private salvar(r: AuthResponse): void {
    const sessao: Sessao = { usuario: r.usuario, accessToken: r.accessToken, refreshToken: r.refreshToken };
    this.sessao.set(sessao);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessao));
  }

  private limpar(): void {
    this.sessao.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private carregar(): Sessao | null {
    try {
      const bruto = localStorage.getItem(this.STORAGE_KEY);
      return bruto ? (JSON.parse(bruto) as Sessao) : null;
    } catch {
      return null;
    }
  }
}
