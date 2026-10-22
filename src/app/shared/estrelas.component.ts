import { Component, Input } from '@angular/core';

/** Estrelas somente leitura. O rótulo acessível diz a nota; as estrelas em si são decorativas. */
@Component({
  selector: 'bx-estrelas',
  standalone: true,
  styles: [`
    .estrelas { letter-spacing: 0.08em; color: #c9d0da; white-space: nowrap; }
    .cheia { color: #e0a526; }
  `],
  template: `
    <span class="estrelas" role="img" [attr.aria-label]="rotulo">
      @for (i of posicoes; track i) { <span aria-hidden="true" [class.cheia]="i <= cheias">★</span> }
    </span>
  `,
})
export class EstrelasComponent {
  @Input() nota = 0;
  readonly posicoes = [1, 2, 3, 4, 5];

  get cheias(): number {
    return Math.round(this.nota);
  }

  get rotulo(): string {
    return `Nota ${this.nota.toFixed(1).replace('.', ',')} de 5`;
  }
}
