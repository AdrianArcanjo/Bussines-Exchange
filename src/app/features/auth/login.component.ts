import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mensagemErro } from '../../shared/util';

@Component({
  selector: 'bx-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrls: ['./auth.css'],
  template: `
    <div class="tela">
      <section class="marca">
        <div>
          <h1>Business Exchange</h1>
          <p>Publique um problema técnico com valor fixo. O pagamento só é liberado depois que você valida a entrega.</p>
        </div>
        <div class="chamado" aria-hidden="true">
          <div class="cod">#BX-0001</div>
          <p class="tit">Preciso resolver um bug no checkout do meu site</p>
          <div class="valor">R$ 220,00</div>
          <div class="nota">Valor retido até a validação</div>
        </div>
      </section>

      <section class="painel">
        <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
          <h2>Entrar</h2>
          <p class="sub">Acesse sua conta para ver e gerenciar chamados.</p>

          @if (erro()) { <div class="alerta" role="alert">{{ erro() }}</div> }

          <label>E-mail
            <input type="email" formControlName="email" autocomplete="email"
                   [class.invalido]="invalido('email')" />
            @if (invalido('email')) { <span class="erro">Informe um e-mail válido.</span> }
          </label>

          <label>Senha
            <input type="password" formControlName="senha" autocomplete="current-password"
                   [class.invalido]="invalido('senha')" />
            @if (invalido('senha')) { <span class="erro">Informe a senha.</span> }
          </label>

          <button type="submit" [disabled]="carregando()">{{ carregando() ? 'Entrando…' : 'Entrar' }}</button>
          <p class="troca">Ainda não tem conta? <a routerLink="/cadastro">Criar conta</a></p>
        </form>
      </section>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });
  readonly erro = signal<string | null>(null);
  readonly carregando = signal(false);

  invalido(campo: 'email' | 'senha'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.destino()),
      error: (e: unknown) => {
        this.erro.set(mensagemErro(e, 'Não foi possível entrar. Tente novamente.'));
        this.carregando.set(false);
      },
    });
  }

  /** Só aceita caminhos internos (evita open redirect via ?returnUrl=https://...). */
  private destino(): string {
    const alvo = this.route.snapshot.queryParamMap.get('returnUrl');
    return alvo && alvo.startsWith('/') && !alvo.startsWith('//') ? alvo : '/chamados';
  }
}
