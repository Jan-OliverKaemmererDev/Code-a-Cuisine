import { Injectable, signal } from '@angular/core';
import { Recipe } from './recipe.service';

export interface IngredientItem {
  name: string;
  amount: number;
  unit: 'gram' | 'ml' | 'piece';
}

export interface Preferences {
  portions: number;
  persons: number;
  cookingTime: 'Quick' | 'Medium' | 'Complex' | null;
  cuisine: string | null;
  diet: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class RecipeStateService {
  ingredients = signal<IngredientItem[]>([]);
  preferences = signal<Preferences>({
    portions: 2,
    persons: 1,
    cookingTime: null,
    cuisine: null,
    diet: null,
  });
  latestRecipes = signal<Recipe[]>([]);
}

