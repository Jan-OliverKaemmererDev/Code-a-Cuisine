import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-list-of-all-recipes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './list-of-all-recipes.component.html',
  styleUrl: './list-of-all-recipes.component.scss'
})
export class ListOfAllRecipesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private location = inject(Location);

  cuisineCategory: string = 'All recipes';
  bannerImage: string = '';
  recipes$!: Observable<Recipe[]>;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['cuisine']) {
        this.cuisineCategory = params['cuisine'];
        this.bannerImage = this.getBannerImage(this.cuisineCategory);
      } else {
        this.cuisineCategory = 'All recipes';
        this.bannerImage = ''; 
      }

      this.fetchRecipes();
    });
  }

  fetchRecipes() {
    this.recipes$ = this.recipeService.getRecipes().pipe(
      map(recipes => {
        if (this.cuisineCategory !== 'All recipes') {
          // Attempt a loose filter. E.g., 'Italian' -> 'ita'
          const prefix = this.cuisineCategory.split(' ')[0].toLowerCase().substring(0, 3);
          const filtered = recipes.filter(r => r.cuisine?.toLowerCase().includes(prefix));
          // Fallback to all recipes if none match exactly, so the page isn't empty
          return filtered.length > 0 ? filtered : recipes;
        }
        return recipes;
      })
    );
  }

  getBannerImage(category: string): string {
    // e.g., "Italian cuisine" -> "italian-food.png"
    const prefix = category.split(' ')[0].toLowerCase();
    return `assets/icons/food-categories/${prefix}-food.png`;
  }

  goBack() {
    this.location.back();
  }
}
