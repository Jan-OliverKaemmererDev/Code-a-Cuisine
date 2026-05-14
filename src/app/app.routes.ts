import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  {
    path: 'generate-recipe',
    loadComponent: () =>
      import('./features/generate-recipe/generate-recipe.component').then(
        (m) => m.GenerateRecipeComponent
      ),
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('./features/preferences/preferences.component').then(
        (m) => m.PreferencesComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
