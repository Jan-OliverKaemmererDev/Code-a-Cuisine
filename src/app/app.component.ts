import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DialogComponent } from './shared/components/dialog/dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, DialogComponent],
  template: `
    <app-dialog></app-dialog>
    <router-outlet></router-outlet>
    @if (showImprint) {
      <div class="global-footer" [class.recipe-results-footer]="isRecipeResults">
        <a routerLink="/imprint" class="global-imprint">Imprint</a>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .global-footer {
      margin-top: auto;
      padding: 24px 0;
      text-align: center;
      background-color: #FFFFFF;
      width: 100%;
    }

    .recipe-results-footer {
      background-color: #396039;
    }

    .global-imprint {
      font-family: 'Quicksand', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #1a3c1a;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .recipe-results-footer .global-imprint {
      color: white;
    }
    
    .global-imprint:hover {
      opacity: 0.7;
    }
  `]
})
export class App {
  private router = inject(Router);
  showImprint = false;
  isRecipeResults = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showImprint = event.urlAfterRedirects !== '/';
      this.isRecipeResults = event.urlAfterRedirects.startsWith('/recipe-results');
    });
  }
}
