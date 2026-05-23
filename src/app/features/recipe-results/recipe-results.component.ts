import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { DialogService } from '../../core/services/dialog.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Displays the most recently generated recipes along with
 * fallback dummy recipes for layout preview when the database is empty.
 */
@Component({
  selector: 'app-recipe-results',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './recipe-results.component.html',
  styleUrl: './recipe-results.component.scss'
})
export class RecipeResultsComponent {
  private recipeService = inject(RecipeService);
  private state = inject(RecipeStateService);
  private dialogService = inject(DialogService);

  /** Cuisine preference used as a display tag, defaults to 'Italian'. */
  selectedCuisine = this.state.preferences().cuisine || 'Italian';
  /** Cooking time preference used as a display tag, defaults to 'Quick'. */
  selectedCookingTime = this.state.preferences().cookingTime || 'Quick';

  /** Observable of the latest 3 recipes from the database. */
  recipes$: Observable<Recipe[]> = this.recipeService.getRecipes().pipe(
    map(recipes => {
      const latest = this.state.latestRecipes();
      let list = [...recipes];
      if (latest && latest.length > 0) {
        // Unshift in reverse order to maintain the original sequence of the generated recipes
        [...latest].reverse().forEach(lr => {
          const alreadyExists = list.some(r => r.title === lr.title || (r.id && lr.id && r.id === lr.id));
          if (!alreadyExists) {
            list.unshift(lr);
          }
        });
      }
      return list.slice(0, 3);
    }),
    catchError(err => {
      this.dialogService.showError('Error fetching recipes from Firebase. Please check your connection.');
      const latest = this.state.latestRecipes();
      return of(latest.length > 0 ? latest : []);
    })
  );

  /** Fallback recipes shown when no real data is available. */
  dummyRecipes: Recipe[] = [
    {
      title: 'Pasta with spinach and cherry tomatoes',
      cookingTime: '20min',
      cuisine: 'Italian',
      persons: 2,
      portions: 2,
      dietPreferences: 'Vegetarian',
      ingredients: [],
      instructions: [],
      nutrition: { energy: '', protein: '', fat: '', carbs: '' },
      likes: 0,
      createdAt: 0
    },
    {
      title: 'Creamy garlic shrimp pasta',
      cookingTime: '22min',
      cuisine: 'Italian',
      persons: 2,
      portions: 2,
      dietPreferences: 'Pescatarian',
      ingredients: [],
      instructions: [],
      nutrition: { energy: '', protein: '', fat: '', carbs: '' },
      likes: 0,
      createdAt: 0
    },
    {
      title: 'Pasta alla Trapanese (Sicilian Tomato Pesto)',
      cookingTime: '20min',
      cuisine: 'Italian',
      persons: 2,
      portions: 2,
      dietPreferences: 'Vegetarian',
      ingredients: [],
      instructions: [],
      nutrition: { energy: '', protein: '', fat: '', carbs: '' },
      likes: 0,
      createdAt: 0
    }
  ];
}
