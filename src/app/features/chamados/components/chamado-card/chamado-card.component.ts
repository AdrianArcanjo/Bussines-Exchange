import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { CATEGORIA_ROTULO, Chamado } from '../../../../shared/models/chamado.model';
import { TempoRelativoPipe } from '../../../../shared/pipes/tempo-relativo.pipe';

/** Componente "burro": só recebe dados e emite eventos. Não conhece serviço nem rota. */
@Component({
  selector: 'app-chamado-card',
  imports: [CurrencyPipe, TempoRelativoPipe],
  templateUrl: './chamado-card.component.html',
  styleUrl: './chamado-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChamadoCardComponent {
  readonly chamado = input.required<Chamado>();
  readonly aceitando = input(false);
  readonly aceitar = output<string>();

  protected readonly rotulos = CATEGORIA_ROTULO;
}
