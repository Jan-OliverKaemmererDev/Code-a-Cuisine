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
  {
    path: 'loading',
    loadComponent: () =>
      import('./features/loading/loading.component').then(
        (m) => m.LoadingComponent
      ),
  },
  {
    path: 'recipe-results',
    loadComponent: () =>
      import('./features/recipe-results/recipe-results.component').then(
        (m) => m.RecipeResultsComponent
      ),
  },
  {
    path: 'recipe-view/:id',
    loadComponent: () =>
      import('./features/recipe-view/recipe-view.component').then(
        (m) => m.RecipeViewComponent
      ),
  },
  {
    path: 'cookbook',
    loadComponent: () =>
      import('./features/cookbook/cookbook.component').then(
        (m) => m.CookbookComponent
      ),
  },
  {
    path: 'list-of-all-recipes',
    loadComponent: () =>
      import('./features/list-of-all-recipes/list-of-all-recipes.component').then(
        (m) => m.ListOfAllRecipesComponent
      ),
  },
  {
    path: 'imprint',
    loadComponent: () =>
      import('./features/imprint/imprint.component').then(
        (m) => m.ImprintComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
