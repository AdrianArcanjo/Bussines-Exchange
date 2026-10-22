import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CadastroRequest, TipoUsuario } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { mensagemErro } from '../../shared/util';

const senhasIguais = (g: AbstractControl): ValidationErrors | null =>
  g.get('senha')?.value === g.get('confirmarSenha')?.value ? null : { senhasDiferentes: true };

const opcional = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);

@Component({
  selector: 'bx-cadastro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrls: ['./auth.css'],
  template: `
    <div class="tela">
      <section class="marca">
        <div>
          <h1>Business Exchange</h1>
          <p>Contratantes publicam microtarefas técnicas. Executores resolvem e recebem com segurança.</p>
        </div>
      </section>

      <section class="painel">
        <form [formGroup]="form" (ngSubmit)="criar()" novalidate>
          <h2>Criar conta</h2>

          @if (erros().length) {
            <div class="alerta" role="alert">
              @for (e of erros(); track e) { <div>{{ e }}</div> }
            </div>
          }

          <fieldset class="perfis">
            <legend>Como você vai usar a plataforma?</legend>
            <label class="perfil"><input type="radio" formControlName="tipo" value="contratante" />
              <strong>Contratante</strong><span>Publico chamados e pago pela entrega</span></label>
            <label class="perfil"><input type="radio" formControlName="tipo" value="executor" />
              <strong>Executor</strong><span>Resolvo chamados e recebo a recompensa</span></label>
          </fieldset>

          <label>Nome
            <input formControlName="nome" autocomplete="name" [class.invalido]="invalido('nome')" />
            @if (invalido('nome')) { <span class="erro">Informe seu nome (mínimo 2 letras).</span> }
          </label>

          <label>E-mail
            <input type="email" formControlName="email" autocomplete="email" [class.invalido]="invalido('email')" />
            @if (invalido('email')) { <span class="erro">Informe um e-mail válido.</span> }
          </label>

          <label>Senha
            <input type="password" formControlName="senha" autocomplete="new-password" [class.invalido]="invalido('senha')" />
            @if (invalido('senha')) { <span class="erro">Mínimo de 8 caracteres, com letras e números.</span> }
          </label>

          <label>Confirmar senha
            <input type="password" formControlName="confirmarSenha" autocomplete="new-password"
                   [class.invalido]="form.hasError('senhasDiferentes') && form.controls.confirmarSenha.touched" />
            @if (form.hasError('senhasDiferentes') && form.controls.confirmarSenha.touched) {
              <span class="erro">As senhas não conferem.</span>
            }
          </label>

          <div class="linha">
            <label>Cidade <input formControlName="cidade" autocomplete="address-level2" /></label>
            <label>UF
              <input formControlName="uf" maxlength="2" autocomplete="address-level1" [class.invalido]="invalido('uf')" />
            </label>
          </div>

          <label>Telefone (opcional) <input type="tel" formControlName="telefone" autocomplete="tel" /></label>

          @if (form.controls.tipo.value === 'contratante') {
            <label>Empresa (opcional) <input formControlName="empresaNome" autocomplete="organization" /></label>
            <label>CPF ou CNPJ (opcional) <input formControlName="cpfCnpj" /></label>
          } @else {
            <label>Sobre você (opcional)
              <textarea rows="3" formControlName="bio" placeholder="Suas especialidades e experiência"></textarea>
            </label>
          }

          <button type="submit" [disabled]="carregando()">{{ carregando() ? 'Criando conta…' : 'Criar conta' }}</button>
          <p class="troca">Já tem conta? <a routerLink="/login">Entrar</a></p>
        </form>
      </section>
    </div>
  `,
})
export class CadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group(
    {
      tipo: ['contratante' as TipoUsuario, Validators.required],
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      senha: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
      ],
      confirmarSenha: ['', Validators.required],
      cidade: [''],
      uf: ['', Validators.pattern(/^([A-Za-z]{2})?$/)],
      telefone: [''],
      empresaNome: [''],
      cpfCnpj: [''],
      bio: [''],
    },
    { validators: senhasIguais },
  );

  readonly erros = signal<string[]>([]);
  readonly carregando = signal(false);

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  criar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    this.erros.set([]);

    this.auth.cadastrar(this.montar()).subscribe({
      next: () => this.router.navigateByUrl('/chamados'),
      error: (e: unknown) => {
        this.erros.set([mensagemErro(e, 'Não foi possível criar a conta.')]);
        this.carregando.set(false);
      },
    });
  }

  private montar(): CadastroRequest {
    const v = this.form.getRawValue();
    const base = {
      nome: v.nome.trim(),
      email: v.email.trim(),
      senha: v.senha,
      telefone: opcional(v.telefone),
      cidade: opcional(v.cidade),
      uf: opcional(v.uf)?.toUpperCase(),
    };
    return v.tipo === 'contratante'
      ? { ...base, tipo: 'contratante', empresaNome: opcional(v.empresaNome), cpfCnpj: opcional(v.cpfCnpj) }
      : { ...base, tipo: 'executor', bio: opcional(v.bio) };
  }
}
