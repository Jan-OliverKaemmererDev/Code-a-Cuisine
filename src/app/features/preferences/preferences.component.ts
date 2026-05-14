import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';

type CookingTime = 'Quick' | 'Medium' | 'Complex';
type DietPreference = 'Vegetarian' | 'Vegan' | 'Keto' | 'No preferences';
type Cuisine = 'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion';

@Component({
  selector: 'app-preferences',
  imports: [RouterLink],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
})
export class PreferencesComponent {
  private state = inject(RecipeStateService);
  private router = inject(Router);

  portions = signal(2);
  persons = signal(1);
  selectedCookingTime = signal<CookingTime | null>(null);
  selectedCuisine = signal<Cuisine | null>(null);
  selectedDiet = signal<DietPreference | null>(null);

  cookingTimes: { label: CookingTime; sub: string }[] = [
    { label: 'Quick', sub: 'ab to 20min' },
    { label: 'Medium', sub: '25-40min' },
    { label: 'Complex', sub: 'over 45min' },
  ];

  cuisines: Cuisine[] = ['German', 'Italian', 'Indian', 'Japanese', 'Gourmet', 'Fusion'];
  diets: DietPreference[] = ['Vegetarian', 'Vegan', 'Keto', 'No preferences'];

  incrementPortions(): void {
    this.portions.update((v) => v + 1);
  }

  decrementPortions(): void {
    this.portions.update((v) => Math.max(1, v - 1));
  }

  incrementPersons(): void {
    this.persons.update((v) => v + 1);
  }

  decrementPersons(): void {
    this.persons.update((v) => Math.max(1, v - 1));
  }

  selectCookingTime(time: CookingTime): void {
    this.selectedCookingTime.set(
      this.selectedCookingTime() === time ? null : time
    );
  }

  selectCuisine(cuisine: Cuisine): void {
    this.selectedCuisine.set(
      this.selectedCuisine() === cuisine ? null : cuisine
    );
  }

  selectDiet(diet: DietPreference): void {
    this.selectedDiet.set(this.selectedDiet() === diet ? null : diet);
  }

  generateRecipe(): void {
    this.state.preferences.set({
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    });
    // TODO: trigger n8n call
  }
}
