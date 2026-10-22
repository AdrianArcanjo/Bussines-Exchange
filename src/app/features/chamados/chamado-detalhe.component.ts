import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChamadoDetalhe } from '../../core/models/chamado.models';
import { ChamadosService } from '../../core/services/chamados.service';
import { EstrelasComponent } from '../../shared/estrelas.component';
import { BrlPipe, DataBrPipe, mensagemErro, StatusLabelPipe } from '../../shared/util';

@Component({
  selector: 'bx-chamado-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BrlPipe, DataBrPipe, StatusLabelPipe, EstrelasComponent],
  styleUrls: ['./chamados.css'],
  template: `
    <a class="voltar" routerLink="/chamados">Voltar ao mural</a>

    @if (carregando()) {
      <p class="vazio">Carregando…</p>
    } @else if (erroCarga()) {
      <div class="alerta" role="alert">{{ erroCarga() }}</div>
    } @else {
    @if (d(); as det) {
      <div class="titulo">
        <h1>{{ det.chamado.titulo }}</h1>
        <span class="selo" [attr.data-status]="det.chamado.status">{{ det.chamado.status | statusLabel }}</span>
      </div>
      <p class="sub">#{{ det.chamado.codigo }} · {{ det.chamado.categoria }} · publicado em {{ det.chamado.criadoEm | dataBr }}</p>

      @if (erroAcao()) { <div class="alerta" role="alert">{{ erroAcao() }}</div> }

      <div class="detalhe">
        <div>
          <section class="bloco">
            <h2>Descrição</h2>
            <p class="desc">{{ det.chamado.descricao }}</p>
          </section>

          @if (det.acoes.podeEntregar) {
            <section class="bloco">
              <h2>Enviar entrega</h2>
              <form class="stack" [formGroup]="entregaForm" (ngSubmit)="entregar()" novalidate>
                <label>O que foi feito
                  <textarea rows="4" formControlName="descricao" [class.invalido]="entregaInvalido('descricao')"></textarea>
                  @if (entregaInvalido('descricao')) { <span class="erro">Descreva a entrega (mínimo 10 caracteres).</span> }
                </label>
                <label>Link (repositório, pull request, demonstração)
                  <input type="url" formControlName="linkUrl" placeholder="https://" [class.invalido]="entregaInvalido('linkUrl')" />
                  @if (entregaInvalido('linkUrl')) { <span class="erro">O link deve começar com http:// ou https://</span> }
                </label>
                <button class="btn" type="submit" [disabled]="processando()">Enviar para validação</button>
              </form>
            </section>
          }

          @if (det.entregas.length) {
            <section class="bloco">
              <h2>Entregas</h2>
              @for (e of det.entregas; track e.id) {
                <div class="entrega">
                  <p class="desc">{{ e.descricao }}</p>
                  @if (e.linkUrl) { <p><a [href]="e.linkUrl" target="_blank" rel="noopener noreferrer">{{ e.linkUrl }}</a></p> }
                  <div class="meta">
                    <span>Enviada em {{ e.enviadaEm | dataBr: 'hora' }}</span>
                    <span>
                      @switch (e.status) {
                        @case ('pendente') { Aguardando validação }
                        @case ('aprovada') { Aprovada }
                        @case ('rejeitada') { Recusada }
                      }
                    </span>
                  </div>
                  @if (e.motivoRejeicao) { <p class="motivo">Motivo da recusa: {{ e.motivoRejeicao }}</p> }
                </div>
              }
            </section>
          }

          @if (det.acoes.podeAvaliar) {
            <section class="bloco">
              <h2>Avaliar {{ nomeDaOutraParte(det) }}</h2>
              <form class="stack" [formGroup]="avaliacaoForm" (ngSubmit)="avaliar()" novalidate>
                <fieldset class="notas">
                  <legend>Nota de 1 a 5</legend>
                  @for (n of notas; track n) {
                    <label class="nota-op"><input type="radio" formControlName="nota" [value]="n" /><span>{{ n }}</span></label>
                  }
                </fieldset>
                @if (avaliacaoForm.controls.nota.invalid && avaliacaoForm.controls.nota.touched) { <span class="erro">Escolha uma nota.</span> }
                <label>Comentário (opcional)
                  <textarea rows="3" maxlength="1000" formControlName="comentario" placeholder="Como foi trabalhar com essa pessoa?"></textarea>
                </label>
                <button class="btn ouro" type="submit" [disabled]="processando()">Enviar avaliação</button>
              </form>
            </section>
          }

          @if (det.avaliacoes.length) {
            <section class="bloco">
              <h2>Avaliações deste chamado</h2>
              @for (a of det.avaliacoes; track a.id) {
                <div class="avaliacao">
                  <div class="quem">
                    <bx-estrelas [nota]="a.nota" />
                    <span>{{ a.avaliadorNome }} · {{ a.criadoEm | dataBr }}</span>
                  </div>
                  @if (a.comentario) { <p>{{ a.comentario }}</p> }
                </div>
              }
            </section>
          }

          @if (det.historico.length) {
            <section class="bloco">
              <h2>Histórico</h2>
              <ol class="linha-tempo">
                @for (h of det.historico; track $index) {
                  <li>
                    {{ h.para | statusLabel }}
                    <small>{{ h.em | dataBr: 'hora' }}@if (h.porNome) { · por {{ h.porNome }} }</small>
                  </li>
                }
              </ol>
            </section>
          }
        </div>

        <aside>
          <section class="bloco">
            <div class="valor">{{ det.chamado.valorFixo | brl }}</div>
            <div class="rotulo">Recompensa fixa, sem negociação</div>
            <dl class="dl" style="margin-top: 1rem">
              <dt>Contratante</dt><dd><a class="link-perfil" [routerLink]="['/usuarios', det.chamado.contratante.id]">{{ det.chamado.contratante.nome }}</a> ({{ det.chamado.contratante.nota }})</dd>
              <dt>Executor</dt>
              <dd>
                @if (det.chamado.executor; as ex) { <a class="link-perfil" [routerLink]="['/usuarios', ex.id]">{{ ex.nome }}</a> ({{ ex.nota }}) }
                @else { Ainda sem executor }
              </dd>
              @if (det.chamado.prazoEntrega) { <dt>Prazo</dt><dd>{{ det.chamado.prazoEntrega | dataBr }}</dd> }
            </dl>
          </section>

          <section class="bloco escrow" [class.ok]="det.transacao?.status === 'liberado'" [class.neutro]="det.transacao?.status === 'estornado'">
            <h2>Pagamento (escrow)</h2>
            @if (det.transacao; as t) {
              @switch (t.status) {
                @case ('retido') { <p>{{ t.valor | brl }} retido desde {{ t.retidoEm | dataBr: 'hora' }}. Só é liberado ao executor quando o contratante validar a entrega.</p> }
                @case ('liberado') { <p>{{ t.valor | brl }} liberado ao executor em {{ t.liberadoEm | dataBr: 'hora' }}.</p> }
                @case ('estornado') { <p>{{ t.valor | brl }} estornado ao contratante em {{ t.estornadoEm | dataBr: 'hora' }}.</p> }
                @default { <p>Aguardando retenção do valor.</p> }
              }
            } @else {
              <p>O contratante já reservou o valor. Ele será liberado a você quando sua entrega for validada.</p>
            }
          </section>

          @if (det.acoes.podeAceitar || det.acoes.podeValidar || det.acoes.podeCancelar) {
            <section class="bloco stack">
              <h2>Ações</h2>
              @if (det.acoes.podeAceitar) {
                <button class="btn ouro" type="button" [disabled]="processando()" (click)="aceitar()">Aceitar chamado</button>
              }
              @if (det.acoes.podeValidar) {
                <button class="btn" type="button" [disabled]="processando()" (click)="validar()">Validar entrega e liberar pagamento</button>
              }
              @if (det.acoes.podeRejeitar) {
                @if (!recusando()) {
                  <button class="btn sec" type="button" (click)="recusando.set(true)">Recusar entrega</button>
                } @else {
                  <form class="stack" [formGroup]="rejeicaoForm" (ngSubmit)="rejeitar()" novalidate>
                    <label>Motivo da recusa
                      <textarea rows="3" formControlName="motivo" [class.invalido]="rejeicaoForm.controls.motivo.invalid && rejeicaoForm.controls.motivo.touched"></textarea>
                      @if (rejeicaoForm.controls.motivo.invalid && rejeicaoForm.controls.motivo.touched) { <span class="erro">Explique o motivo (mínimo 10 caracteres).</span> }
                    </label>
                    <button class="btn perigo" type="submit" [disabled]="processando()">Confirmar recusa</button>
                    <button class="btn sec" type="button" (click)="recusando.set(false)">Voltar</button>
                  </form>
                }
              }
              @if (det.acoes.podeCancelar) {
                <button class="btn perigo" type="button" [disabled]="processando()" (click)="cancelar()">Cancelar e estornar valor</button>
              }
            </section>
          }
        </aside>
      </div>
    }
    }
  `,
})
export class ChamadoDetalheComponent {
  private readonly api = inject(ChamadosService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly d = signal<ChamadoDetalhe | null>(null);
  readonly carregando = signal(true);
  readonly erroCarga = signal<string | null>(null);
  readonly erroAcao = signal<string | null>(null);
  readonly processando = signal(false);
  readonly recusando = signal(false);

  readonly entregaForm = this.fb.nonNullable.group({
    descricao: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]],
    linkUrl: ['', Validators.pattern(/^(https?:\/\/\S+)?$/i)],
  });
  readonly rejeicaoForm = this.fb.nonNullable.group({
    motivo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  readonly notas = [1, 2, 3, 4, 5];
  readonly avaliacaoForm = this.fb.group({
    nota: [null as number | null, Validators.required],
    comentario: [''],
  });

  private id = '';

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      this.id = p.get('id') ?? '';
      this.carregar();
    });
  }

  entregaInvalido(campo: 'descricao' | 'linkUrl'): boolean {
    const c = this.entregaForm.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  nomeDaOutraParte(det: ChamadoDetalhe): string {
    const eu = this.auth.usuario()?.id;
    return eu === det.chamado.contratante.id ? (det.chamado.executor?.nome ?? 'o executor') : det.chamado.contratante.nome;
  }

  avaliar(): void {
    if (this.avaliacaoForm.invalid) {
      this.avaliacaoForm.markAllAsTouched();
      return;
    }
    const v = this.avaliacaoForm.getRawValue();
    this.rodar(() => this.api.avaliar(this.id, v.nota!, v.comentario?.trim() || undefined), () => this.avaliacaoForm.reset());
  }

  aceitar(): void {
    this.rodar(() => this.api.aceitar(this.id));
  }

  validar(): void {
    this.rodar(() => this.api.validar(this.id));
  }

  cancelar(): void {
    if (confirm('Cancelar este chamado? O valor retido será estornado para você.')) {
      this.rodar(() => this.api.cancelar(this.id));
    }
  }

  entregar(): void {
    if (this.entregaForm.invalid) {
      this.entregaForm.markAllAsTouched();
      return;
    }
    const v = this.entregaForm.getRawValue();
    this.rodar(() => this.api.entregar(this.id, { descricao: v.descricao.trim(), linkUrl: v.linkUrl.trim() || undefined }), () =>
      this.entregaForm.reset(),
    );
  }

  rejeitar(): void {
    if (this.rejeicaoForm.invalid) {
      this.rejeicaoForm.markAllAsTouched();
      return;
    }
    this.rodar(() => this.api.rejeitar(this.id, this.rejeicaoForm.getRawValue().motivo.trim()), () => {
      this.rejeicaoForm.reset();
      this.recusando.set(false);
    });
  }

  /** Executa uma ação da API; todas devolvem o detalhe atualizado, que substitui a tela. */
  private rodar(acao: () => Observable<ChamadoDetalhe>, aoConcluir?: () => void): void {
    this.processando.set(true);
    this.erroAcao.set(null);
    acao().subscribe({
      next: (det) => {
        this.d.set(det);
        this.processando.set(false);
        aoConcluir?.();
      },
      error: (e) => {
        this.erroAcao.set(mensagemErro(e));
        this.processando.set(false);
        this.carregar(false); // a tela pode estar desatualizada (ex.: outro executor aceitou antes)
      },
    });
  }

  private carregar(mostrarCarregando = true): void {
    if (mostrarCarregando) this.carregando.set(true);
    this.erroCarga.set(null);
    this.api.detalhe(this.id).subscribe({
      next: (det) => {
        this.d.set(det);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erroCarga.set(mensagemErro(e, 'Não foi possível carregar o chamado.'));
        this.carregando.set(false);
      },
    });
  }
}
