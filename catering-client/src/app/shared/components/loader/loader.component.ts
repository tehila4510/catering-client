import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    <div class="loader-wrap">
      <div class="loader"></div>
    </div>
  `,
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {}
