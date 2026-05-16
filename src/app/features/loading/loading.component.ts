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
      next: (response: any) => {
        console.log('Response from n8n:', response);
        try {
          // n8n returns an array with an object containing an 'output' property
          const data = Array.isArray(response) ? response[0] : response;
          let jsonString = data?.output || data;
          
          if (typeof jsonString === 'string') {
            // Extract everything between the first { or [ and the last } or ]
            const startObject = jsonString.indexOf('{');
            const startArray = jsonString.indexOf('[');
            const isArray = startArray !== -1 && (startObject === -1 || startArray < startObject);
            const startChar = isArray ? '[' : '{';
            const endChar = isArray ? ']' : '}';
            
            const startIdx = jsonString.indexOf(startChar);
            const endIdx = jsonString.lastIndexOf(endChar);
            
            if (startIdx !== -1 && endIdx !== -1) {
              jsonString = jsonString.substring(startIdx, endIdx + 1);
            }
          }
          
          let recipe;
          try {
            // Remove trailing commas from LLM output before parsing
            const safelyFormattedString = jsonString.replace(/,\s*([\]}])/g, '$1');
            
            // Parse the clean string into a Recipe object
            recipe = typeof safelyFormattedString === 'string' ? JSON.parse(safelyFormattedString) : safelyFormattedString;
          } catch (parseError) {
            console.error('Failed to parse this exact string:', jsonString);
            throw parseError; // Rethrow to let the outer catch handle it
          }

          // Save recipe to Firestore, then navigate
          this.recipeService.saveRecipe(recipe).subscribe({
            next: () => {
              this.router.navigate(['/recipe-results']);
            },
            error: (err) => {
              console.error('Error saving recipe to Firestore:', err);
              alert('Recipe generated but failed to save to Database. Check Firestore rules.');
              this.router.navigate(['/recipe-results']);
            }
          });
        } catch (e) {
          console.error('Error parsing recipe from n8n:', e);
          alert('Fehler beim Auslesen des Rezeptes. In der Konsole siehst du den genauen Text, der vom Server kam.');
          this.router.navigate(['/preferences']);
        }
      },
      error: (err) => {
        console.error('Error from n8n webhook:', err);
        alert('Error connecting to n8n. Please check browser console for CORS or network issues.');
        this.router.navigate(['/preferences']);
      }
    });
  }
}
