import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  // Cada nova feature entra aqui com uma linha.
  protected readonly menu = [{ rota: '/chamados', rotulo: 'Mural de chamados' }];
}
