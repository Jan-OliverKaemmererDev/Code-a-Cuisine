import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { InsufficientIngredientsPopupComponent } from '../../shared/components/insufficient-ingredients-popup/insufficient-ingredients-popup.component';

type CookingTime = 'Quick' | 'Medium' | 'Complex';
type DietPreference = 'Vegetarian' | 'Vegan' | 'Keto' | 'No preferences';
type Cuisine = 'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [RouterLink, InsufficientIngredientsPopupComponent],
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

  showInsufficientPopup = signal(false);

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
    // Basic validation: check if total gram/ml is enough for portions
    // This is just a placeholder logic. You can adjust the threshold.
    const ingredients = this.state.ingredients();
    let totalScore = 0;
    
    for (const item of ingredients) {
      if (item.unit === 'gram' || item.unit === 'ml') {
        totalScore += item.amount;
      } else if (item.unit === 'piece') {
        totalScore += item.amount * 100; // Assume 1 piece = 100 score
      }
    }

    // Example threshold: 150 score per portion
    const requiredScore = this.portions() * 150;

    if (ingredients.length === 0 || totalScore < requiredScore) {
      this.showInsufficientPopup.set(true);
      return;
    }

    this.state.preferences.set({
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    });
    
    this.router.navigate(['/loading']);
  }
}
