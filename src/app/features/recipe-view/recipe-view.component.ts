import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';

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

  recipe$!: Observable<Recipe | undefined>;
  backUrl = '/recipe-results';
  backText = 'Recipe results';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipe$ = this.recipeService.getRecipeById(id);
      this.isLiked = localStorage.getItem(`liked_recipe_${id}`) === 'true';
    }

    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'cookbook') {
      this.backUrl = '/cookbook';
      this.backText = 'Cookbook';
    }
  }

  getHalf(ingredients: string[], part: 1 | 2): string[] {
    if (!ingredients) return [];
    const half = Math.ceil(ingredients.length / 2);
    return part === 1 ? ingredients.slice(0, half) : ingredients.slice(half);
  }

  getStepTitleAndDesc(description: string): { title: string, desc: string } {
    if (!description) return { title: 'Step', desc: '' };
    // Usually AI output has "Step title: description"
    const splitIndex = description.indexOf(':');
    if (splitIndex !== -1 && splitIndex < 50) {
      return {
        title: description.substring(0, splitIndex).trim(),
        desc: description.substring(splitIndex + 1).trim()
      };
    }
    return { title: 'Instructions', desc: description };
  }

  getChefArray(personsCount: number | undefined): number[] {
    // If not specified, default to 1. Cap to a maximum of 4 icons.
    const numChefs = Math.max(1, Math.min(personsCount || 1, 4));
    return Array.from({ length: numChefs }, (_, i) => i + 1);
  }

  getChefIndex(stepIndex: number, personsCount: number | undefined): number {
    const numChefs = Math.max(1, Math.min(personsCount || 1, 4));
    return (stepIndex % numChefs) + 1;
  }

  isLiked = false;
  ingredientsVisible = true;
  directionsVisible = true;

  toggleIngredients() {
    this.ingredientsVisible = !this.ingredientsVisible;
  }

  toggleDirections() {
    this.directionsVisible = !this.directionsVisible;
  }

  async toggleLike(recipe: Recipe) {
    if (!recipe.id) return;
    
    this.isLiked = !this.isLiked;
    
    // Fallback if likes is undefined
    const currentLikes = recipe.likes || 0;
    
    if (this.isLiked) {
      recipe.likes = currentLikes + 1;
      localStorage.setItem(`liked_recipe_${recipe.id}`, 'true');
    } else {
      recipe.likes = Math.max(0, currentLikes - 1);
      localStorage.removeItem(`liked_recipe_${recipe.id}`);
    }

    try {
      await this.recipeService.updateRecipe(recipe.id, { likes: recipe.likes });
    } catch (err) {
      console.error('Failed to update likes', err);
      // Revert if error
      this.isLiked = !this.isLiked;
      recipe.likes = currentLikes;
    }
  }
}
