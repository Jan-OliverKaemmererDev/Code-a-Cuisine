import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RecipeStateService, Preferences } from '../../core/services/recipe-state.service';
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
   * @returns The updated portions count.
   */
  incrementPortions(): number {
    this.portions.update((v) => v + 1);
    return this.portions();
  }

  /**
   * Decrements the portions counter, with a minimum of 1.
   * @returns The updated portions count.
   */
  decrementPortions(): number {
    this.portions.update((v) => Math.max(1, v - 1));
    return this.portions();
  }

  /**
   * Increments the persons counter by one.
   * @returns The updated persons count.
   */
  incrementPersons(): number {
    this.persons.update((v) => v + 1);
    return this.persons();
  }

  /**
   * Decrements the persons counter, with a minimum of 1.
   * @returns The updated persons count.
   */
  decrementPersons(): number {
    this.persons.update((v) => Math.max(1, v - 1));
    return this.persons();
  }

  /**
   * Toggles the selected cooking time. Deselects if already active.
   * @param time - The cooking time to toggle.
   * @returns The newly selected CookingTime, or null if deselected.
   */
  selectCookingTime(time: CookingTime): CookingTime | null {
    this.selectedCookingTime.set(
      this.selectedCookingTime() === time ? null : time
    );
    return this.selectedCookingTime();
  }

  /**
   * Toggles the selected cuisine. Deselects if already active.
   * @param cuisine - The cuisine to toggle.
   * @returns The newly selected Cuisine, or null if deselected.
   */
  selectCuisine(cuisine: Cuisine): Cuisine | null {
    this.selectedCuisine.set(
      this.selectedCuisine() === cuisine ? null : cuisine
    );
    return this.selectedCuisine();
  }

  /**
   * Toggles the selected diet preference. Deselects if already active.
   * @param diet - The diet preference to toggle.
   * @returns The newly selected DietPreference, or null if deselected.
   */
  selectDiet(diet: DietPreference): DietPreference | null {
    this.selectedDiet.set(this.selectedDiet() === diet ? null : diet);
    return this.selectedDiet();
  }

  /**
   * Validates ingredients, saves preferences to shared state,
   * and navigates to the loading page to start recipe generation.
   * @returns A Promise resolving to whether the navigation succeeded, or void if validation failed.
   */
  generateRecipe(): Promise<boolean> | void {
    if (!this.hasEnoughIngredients()) {
      this.showInsufficientPopup.set(true);
      return;
    }
    this.savePreferences();
    return this.router.navigate(['/loading']);
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
   * @returns The saved Preferences object.
   */
  private savePreferences(): Preferences {
    const saved: Preferences = {
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    };
    this.state.preferences.set(saved);
    return saved;
  }
}
