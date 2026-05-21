import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { Observable, of } from 'rxjs';

/**
 * Displays the full detail view of a single recipe including
 * ingredients, step-by-step instructions, nutrition info, and like functionality.
 */
@Component({
  selector: 'app-recipe-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-view.component.html',
  styleUrl: './recipe-view.component.scss'
})
export class RecipeViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private state = inject(RecipeStateService);

  /** Observable of the recipe being displayed. */
  recipe$!: Observable<Recipe | undefined>;
  /** Route to navigate back to. */
  backUrl = '/recipe-results';
  /** Display text for the back navigation link. */
  backText = 'Recipe results';

  /** Whether the current user has liked this recipe. */
  isLiked = false;
  /** Whether the ingredients section is expanded. */
  ingredientsVisible = true;
  /** Whether the directions section is expanded. */
  directionsVisible = true;

  /**
   * Loads the recipe by ID from the route and restores the like state
   * from localStorage. Adjusts back navigation if coming from the cookbook.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'latest') {
      const latest = this.state.latestRecipes()[0];
      this.recipe$ = of(latest || undefined);
      this.isLiked = false;
    } else if (id) {
      this.recipe$ = this.recipeService.getRecipeById(id);
      this.isLiked = localStorage.getItem(`liked_recipe_${id}`) === 'true';
    }
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'cookbook') {
      this.backUrl = '/cookbook';
      this.backText = 'Cookbook';
    }
  }

  /**
   * Splits an ingredient list into two halves for two-column display.
   * @param ingredients - The full ingredients array.
   * @param part - Which half to return (1 = first, 2 = second).
   * @returns The requested half of the ingredients array.
   */
  getHalf(ingredients: string[], part: 1 | 2): string[] {
    if (!ingredients) return [];
    const half = Math.ceil(ingredients.length / 2);
    return part === 1 ? ingredients.slice(0, half) : ingredients.slice(half);
  }

  /**
   * Splits a step description into a title and body text.
   * Expects the format "Title: description text".
   * @param description - The raw instruction step string.
   * @returns An object with separate title and desc properties.
   */
  getStepTitleAndDesc(description: string): { title: string, desc: string } {
    if (!description) return { title: 'Step', desc: '' };
    const splitIndex = description.indexOf(':');
    if (splitIndex !== -1 && splitIndex < 50) {
      return {
        title: description.substring(0, splitIndex).trim(),
        desc: description.substring(splitIndex + 1).trim()
      };
    }
    return { title: 'Instructions', desc: description };
  }

  /**
   * Creates an array of chef icon indices for the persons indicator.
   * @param personsCount - Number of persons, capped at 4.
   * @returns Array of 1-based indices for rendering chef icons.
   */
  getChefArray(personsCount: number | undefined): number[] {
    const numChefs = Math.max(1, Math.min(personsCount || 1, 4));
    return Array.from({ length: numChefs }, (_, i) => i + 1);
  }

  /**
   * Determines which chef icon to show for a given instruction step.
   * Cycles through the available chef icons.
   * @param stepIndex - The zero-based index of the instruction step.
   * @param personsCount - Total number of persons / chef icons.
   * @returns The 1-based chef icon index to display.
   */
  getChefIndex(stepIndex: number, personsCount: number | undefined): number {
    const numChefs = Math.max(1, Math.min(personsCount || 1, 4));
    return (stepIndex % numChefs) + 1;
  }

  /**
   * Toggles the visibility of the ingredients section.
   * @returns The new visibility state of the ingredients section.
   */
  toggleIngredients(): boolean {
    this.ingredientsVisible = !this.ingredientsVisible;
    return this.ingredientsVisible;
  }

  /**
   * Toggles the visibility of the directions section.
   * @returns The new visibility state of the directions section.
   */
  toggleDirections(): boolean {
    this.directionsVisible = !this.directionsVisible;
    return this.directionsVisible;
  }

  /**
   * Toggles the like state for the given recipe and persists
   * the updated count to Firestore and localStorage.
   * Reverts on error.
   * @param recipe - The recipe to like or unlike.
   * @returns A Promise resolving to the final like status of the recipe.
   */
  async toggleLike(recipe: Recipe): Promise<boolean> {
    if (!recipe.id) return this.isLiked;
    this.isLiked = !this.isLiked;
    const currentLikes = recipe.likes || 0;
    this.applyLikeChange(recipe, currentLikes);
    try {
      await this.recipeService.updateRecipe(recipe.id, { likes: recipe.likes });
    } catch (err) {
      console.error('Failed to update likes', err);
      this.revertLikeChange(recipe, currentLikes);
    }
    return this.isLiked;
  }

  /**
   * Applies the optimistic like/unlike change to the recipe object
   * and updates localStorage.
   * @param recipe - The recipe being modified.
   * @param previousLikes - The like count before the change.
   * @returns The updated Recipe object.
   */
  private applyLikeChange(recipe: Recipe, previousLikes: number): Recipe {
    if (this.isLiked) {
      recipe.likes = previousLikes + 1;
      localStorage.setItem(`liked_recipe_${recipe.id}`, 'true');
    } else {
      recipe.likes = Math.max(0, previousLikes - 1);
      localStorage.removeItem(`liked_recipe_${recipe.id}`);
    }
    return recipe;
  }

  /**
   * Reverts the like state and count when the Firestore update fails.
   * @param recipe - The recipe to revert.
   * @param originalLikes - The original like count to restore.
   * @returns The reverted Recipe object.
   */
  private revertLikeChange(recipe: Recipe, originalLikes: number): Recipe {
    this.isLiked = !this.isLiked;
    recipe.likes = originalLikes;
    return recipe;
  }
}
