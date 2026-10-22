import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Categoria } from '../../core/models/chamado.models';
import { ChamadosService } from '../../core/services/chamados.service';
import { mensagemErro } from '../../shared/util';

@Component({
  selector: 'bx-novo-chamado',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrls: ['./chamados.css'],
  template: `
    <h1>Novo chamado</h1>
    <p class="sub">Descreva o problema e defina a recompensa. Não há negociação: o valor é fixo.</p>

    <form class="form" [formGroup]="form" (ngSubmit)="publicar()" novalidate>
      @if (erro()) { <div class="alerta" role="alert">{{ erro() }}</div> }

      <label>Título
        <input formControlName="titulo" maxlength="150" placeholder="Ex.: Bug no checkout do meu site" [class.invalido]="invalido('titulo')" />
        @if (invalido('titulo')) { <span class="erro">Informe um título (mínimo 5 caracteres).</span> }
      </label>

      <label>Descrição
        <textarea rows="6" formControlName="descricao" placeholder="O que acontece, onde acontece e o que você espera que funcione." [class.invalido]="invalido('descricao')"></textarea>
        @if (invalido('descricao')) { <span class="erro">Descreva o problema com ao menos 20 caracteres.</span> }
      </label>

      <div class="linha2">
        <label>Categoria
          <select formControlName="categoriaId" [class.invalido]="invalido('categoriaId')">
            <option [ngValue]="null">Selecione</option>
            @for (c of categorias(); track c.id) { <option [ngValue]="c.id">{{ c.nome }}</option> }
          </select>
          @if (invalido('categoriaId')) { <span class="erro">Escolha uma categoria.</span> }
        </label>

        <label>Recompensa fixa (R$)
          <input type="number" step="0.01" min="0.01" formControlName="valorFixo" [class.invalido]="invalido('valorFixo')" />
          @if (invalido('valorFixo')) { <span class="erro">Informe um valor maior que zero.</span> }
        </label>
      </div>

      <label>Prazo de entrega (opcional)
        <input type="date" formControlName="prazo" [min]="hoje" />
      </label>

      <p class="aviso">Ao publicar, o valor fica retido em escrow. Ele só é liberado ao executor depois que você validar a entrega, e é estornado se você cancelar antes de alguém aceitar.</p>

      <div class="acoes-form">
        <button class="btn ouro" type="submit" [disabled]="enviando()">{{ enviando() ? 'Publicando…' : 'Publicar e reter valor' }}</button>
        <a class="btn sec" routerLink="/chamados">Cancelar</a>
      </div>
    </form>
  `,
})
export class NovoChamadoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ChamadosService);
  private readonly router = inject(Router);

  readonly hoje = new Date().toISOString().slice(0, 10);
  readonly categorias = signal<Categoria[]>([]);
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
    descricao: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]],
    categoriaId: [null as number | null, Validators.required],
    valorFixo: [null as number | null, [Validators.required, Validators.min(0.01)]],
    prazo: [''],
  });

  ngOnInit(): void {
    this.api.categorias().subscribe({
      next: (c) => this.categorias.set(c),
      error: () => this.erro.set('Não foi possível carregar as categorias.'),
    });
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  publicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set(null);

    this.api
      .publicar({
        titulo: v.titulo!.trim(),
        descricao: v.descricao!.trim(),
        categoriaId: v.categoriaId!,
        valorFixo: v.valorFixo!,
        prazoEntrega: v.prazo ? new Date(`${v.prazo}T23:59:59`).toISOString() : undefined,
      })
      .subscribe({
        next: (r) => this.router.navigate(['/chamados', r.chamado.id]),
        error: (e) => {
          this.erro.set(mensagemErro(e, 'Não foi possível publicar o chamado.'));
          this.enviando.set(false);
        },
      });
  }
}
