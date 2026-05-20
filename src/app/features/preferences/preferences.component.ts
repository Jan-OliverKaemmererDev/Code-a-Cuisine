import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { InsufficientIngredientsPopupComponent } from '../../shared/components/insufficient-ingredients-popup/insufficient-ingredients-popup.component';

/** Available cooking time options. */
type CookingTime = 'Quick' | 'Medium' | 'Complex';
/** Available diet preference options. */
type DietPreference = 'Vegetarian' | 'Vegan' | 'Keto' | 'No preferences';
/** Available cuisine options. */
type Cuisine = 'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion';

/**
 * Allows the user to configure recipe preferences such as portions,
 * persons, cooking time, cuisine, and diet before generating a recipe.
 */
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

  /** Number of portions to generate. */
  portions = signal(2);
  /** Number of persons to serve. */
  persons = signal(1);
  /** Selected cooking time category. */
  selectedCookingTime = signal<CookingTime | null>(null);
  /** Selected cuisine category. */
  selectedCuisine = signal<Cuisine | null>(null);
  /** Selected diet preference. */
  selectedDiet = signal<DietPreference | null>(null);

  /** Whether the insufficient ingredients popup is visible. */
  showInsufficientPopup = signal(false);

  /** Cooking time options with display labels and sub-descriptions. */
  cookingTimes: { label: CookingTime; sub: string }[] = [
    { label: 'Quick', sub: 'ab to 20min' },
    { label: 'Medium', sub: '25-40min' },
    { label: 'Complex', sub: 'over 45min' },
  ];

  /** Available cuisine options. */
  cuisines: Cuisine[] = ['German', 'Italian', 'Indian', 'Japanese', 'Gourmet', 'Fusion'];
  /** Available diet preference options. */
  diets: DietPreference[] = ['Vegetarian', 'Vegan', 'Keto', 'No preferences'];

  /**
   * Increments the portions counter by one.
   */
  incrementPortions(): void {
    this.portions.update((v) => v + 1);
  }

  /**
   * Decrements the portions counter, with a minimum of 1.
   */
  decrementPortions(): void {
    this.portions.update((v) => Math.max(1, v - 1));
  }

  /**
   * Increments the persons counter by one.
   */
  incrementPersons(): void {
    this.persons.update((v) => v + 1);
  }

  /**
   * Decrements the persons counter, with a minimum of 1.
   */
  decrementPersons(): void {
    this.persons.update((v) => Math.max(1, v - 1));
  }

  /**
   * Toggles the selected cooking time. Deselects if already active.
   * @param time - The cooking time to toggle.
   */
  selectCookingTime(time: CookingTime): void {
    this.selectedCookingTime.set(
      this.selectedCookingTime() === time ? null : time
    );
  }

  /**
   * Toggles the selected cuisine. Deselects if already active.
   * @param cuisine - The cuisine to toggle.
   */
  selectCuisine(cuisine: Cuisine): void {
    this.selectedCuisine.set(
      this.selectedCuisine() === cuisine ? null : cuisine
    );
  }

  /**
   * Toggles the selected diet preference. Deselects if already active.
   * @param diet - The diet preference to toggle.
   */
  selectDiet(diet: DietPreference): void {
    this.selectedDiet.set(this.selectedDiet() === diet ? null : diet);
  }

  /**
   * Validates ingredients, saves preferences to shared state,
   * and navigates to the loading page to start recipe generation.
   */
  generateRecipe(): void {
    if (!this.hasEnoughIngredients()) {
      this.showInsufficientPopup.set(true);
      return;
    }
    this.savePreferences();
    this.router.navigate(['/loading']);
  }

  /**
   * Checks whether the user has added enough ingredients for the
   * requested number of portions.
   * @returns True if the ingredient score meets the threshold.
   */
  private hasEnoughIngredients(): boolean {
    const ingredients = this.state.ingredients();
    let totalScore = 0;
    for (const item of ingredients) {
      if (item.unit === 'gram' || item.unit === 'ml') {
        totalScore += item.amount;
      } else if (item.unit === 'piece') {
        totalScore += item.amount * 100;
      }
    }
    const requiredScore = this.portions() * 150;
    return ingredients.length > 0 && totalScore >= requiredScore;
  }

  /**
   * Persists the current preference selections into the shared state service.
   */
  private savePreferences(): void {
    this.state.preferences.set({
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    });
  }
}
