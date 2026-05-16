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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipe$ = this.recipeService.getRecipeById(id);
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
}
