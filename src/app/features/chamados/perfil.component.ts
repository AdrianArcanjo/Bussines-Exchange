import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvaliacaoRecebida, Pagina, PerfilPublico } from '../../core/models/chamado.models';
import { ChamadosService } from '../../core/services/chamados.service';
import { EstrelasComponent } from '../../shared/estrelas.component';
import { DataBrPipe, mensagemErro } from '../../shared/util';

@Component({
  selector: 'bx-perfil',
  standalone: true,
  imports: [RouterLink, EstrelasComponent, DataBrPipe],
  styleUrls: ['./chamados.css'],
  template: `
    <a class="voltar" routerLink="/chamados">Voltar ao mural</a>

    @if (carregando()) {
      <p class="vazio">Carregando…</p>
    } @else if (erro()) {
      <div class="alerta" role="alert">{{ erro() }}</div>
    } @else {
      @if (perfil(); as p) {
        <div class="perfil-cab">
          <div>
            <h1>{{ p.nome }}</h1>
            <p class="sub">
              {{ p.tipo === 'executor' ? 'Executor' : 'Contratante' }}
              @if (p.cidade) { · {{ p.cidade }}@if (p.uf) {/{{ p.uf }}} }
              · membro desde {{ p.membroDesde | dataBr }}
            </p>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="num">
              @if (p.totalAvaliacoes > 0) { {{ p.notaMedia.toFixed(1).replace('.', ',') }} <bx-estrelas [nota]="p.notaMedia" /> }
              @else { Sem nota }
            </div>
            <div class="rot">Nota média</div>
          </div>
          <div class="stat"><div class="num">{{ p.totalAvaliacoes }}</div><div class="rot">Avaliações recebidas</div></div>
          <div class="stat"><div class="num">{{ p.chamadosConcluidos }}</div><div class="rot">Chamados concluídos</div></div>
        </div>

        @if (p.bio || p.empresa || p.categorias.length) {
          <section class="bloco">
            @if (p.empresa) { <p><strong>Empresa:</strong> {{ p.empresa }}</p> }
            @if (p.bio) { <p class="desc">{{ p.bio }}</p> }
            @if (p.categorias.length) {
              <div class="chips">@for (c of p.categorias; track c) { <span class="chip">{{ c }}</span> }</div>
            }
          </section>
        }

        <section class="bloco">
          <h2>Avaliações recebidas</h2>
          @if (avaliacoes() && avaliacoes()!.itens.length === 0) {
            <p>Ainda não há avaliações.</p>
          }
          @for (a of avaliacoes()?.itens; track a.id) {
            <div class="avaliacao">
              <div class="quem">
                <bx-estrelas [nota]="a.nota" />
                <span>{{ a.avaliadorNome }} · {{ a.criadoEm | dataBr }}</span>
              </div>
              @if (a.comentario) { <p>{{ a.comentario }}</p> }
            </div>
          }
          @if (totalPaginas() > 1) {
            <div class="paginacao">
              <button class="btn sec" type="button" [disabled]="pagina() <= 1" (click)="irPara(pagina() - 1)">Anterior</button>
              <span>Página {{ pagina() }} de {{ totalPaginas() }}</span>
              <button class="btn sec" type="button" [disabled]="pagina() >= totalPaginas()" (click)="irPara(pagina() + 1)">Próxima</button>
            </div>
          }
        </section>
      }
    }
  `,
})
export class PerfilComponent {
  private readonly api = inject(ChamadosService);
  private readonly route = inject(ActivatedRoute);

  readonly perfil = signal<PerfilPublico | null>(null);
  readonly avaliacoes = signal<Pagina<AvaliacaoRecebida> | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly pagina = signal(1);
  private id = '';

  totalPaginas = () => {
    const d = this.avaliacoes();
    return d ? Math.max(1, Math.ceil(d.total / d.limite)) : 1;
  };

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      this.id = p.get('id') ?? '';
      this.pagina.set(1);
      this.carregando.set(true);
      this.erro.set(null);
      this.api.perfil(this.id).subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.carregarAvaliacoes();
          this.carregando.set(false);
        },
        error: (e) => {
          this.erro.set(mensagemErro(e, 'Não foi possível carregar o perfil.'));
          this.carregando.set(false);
        },
      });
    });
  }

  irPara(p: number): void {
    this.pagina.set(p);
    this.carregarAvaliacoes();
  }

  private carregarAvaliacoes(): void {
    this.api.avaliacoesRecebidas(this.id, this.pagina()).subscribe({
      next: (a) => this.avaliacoes.set(a),
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }
}
