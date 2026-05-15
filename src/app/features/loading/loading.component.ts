import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit {
  private router = inject(Router);
  private state = inject(RecipeStateService);
  private recipeService = inject(RecipeService);

  ngOnInit() {
    this.callN8n();
  }

  private callN8n() {
    const ingredients = this.state.ingredients();
    const preferences = this.state.preferences();
    
    // Map data to expected format for n8n
    const payload = {
      ingredients: ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`),
      preferences: {
        portions: preferences.portions,
        persons: preferences.persons,
        cookingTime: preferences.cookingTime,
        cuisine: preferences.cuisine,
        diet: preferences.diet
      }
    };

    this.recipeService.generateRecipe(payload).subscribe({
      next: (recipe) => {
        // Save recipe to Firestore, then navigate
        this.recipeService.saveRecipe(recipe).subscribe({
          next: () => {
            this.router.navigate(['/recipe-results']);
          },
          error: (err) => {
            console.error('Error saving recipe to Firestore:', err);
            alert('Recipe generated but failed to save to Database. Check Firestore rules.');
            this.router.navigate(['/recipe-results']); // Still navigate so user isn't stuck
          }
        });
      },
      error: (err) => {
        console.error('Error from n8n webhook:', err);
        alert('Error connecting to n8n. Please check browser console for CORS or network issues.');
        this.router.navigate(['/preferences']);
      }
    });
  }
}
