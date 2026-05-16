import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface CuisineCategory {
  name: string;
  icon: string;
  image: string;
}

@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookbook.component.html',
  styleUrl: './cookbook.component.scss'
})
export class CookbookComponent {
  private recipeService = inject(RecipeService);
  private location = inject(Location);

  // Get most liked recipes (sort by likes descending)
  mostLikedRecipes$: Observable<Recipe[]> = this.recipeService.getRecipes().pipe(
    map(recipes => recipes.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5))
  );

  categories: CuisineCategory[] = [
    { name: 'Italian cuisine', icon: '🧀', image: 'assets/img/cookbook/italian.jpg' },
    { name: 'German cuisine', icon: '🥨', image: 'assets/img/cookbook/german.jpg' },
    { name: 'Japanese cuisine', icon: '🥢', image: 'assets/img/cookbook/japanese.jpg' },
    { name: 'Gourmet cuisine', icon: '✨', image: 'assets/img/cookbook/gourmet.jpg' },
    { name: 'Indian cuisine', icon: '🍛', image: 'assets/img/cookbook/indian.jpg' },
    { name: 'Fusion cuisine', icon: '🍢', image: 'assets/img/cookbook/fusion.jpg' }
  ];

  goBack() {
    this.location.back();
  }
}
