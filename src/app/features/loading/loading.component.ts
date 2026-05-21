import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { RecipeService } from '../../core/services/recipe.service';
import { Subscription } from 'rxjs';

/**
 * Displays a loading animation while the recipe is being generated
 * via the n8n webhook. Parses the response and saves the recipe
 * to Firestore before navigating to the results page.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit {
  private router = inject(Router);
  private state = inject(RecipeStateService);
  private recipeService = inject(RecipeService);

  /**
   * Triggers the recipe generation call on component initialisation.
   */
  ngOnInit(): void {
    this.callN8n();
  }

  /**
   * Builds the payload from the current state and sends it to the
   * n8n webhook for recipe generation.
   * @returns The RxJS subscription for the webhook request.
   */
  private callN8n(): Subscription {
    const payload = this.buildPayload();
    return this.recipeService.generateRecipe(payload).subscribe({
      next: (response: any) => this.handleResponse(response),
      error: (err) => this.handleRequestError(err)
    });
  }

  /**
   * Constructs the webhook payload from ingredient and preference state.
   * @returns The payload object for the n8n webhook.
   */
  private buildPayload(): object {
    const ingredients = this.state.ingredients();
    const preferences = this.state.preferences();
    return {
      ingredients: ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`),
      preferences: {
        portions: preferences.portions,
        persons: preferences.persons,
        cookingTime: preferences.cookingTime,
        cuisine: preferences.cuisine,
        diet: preferences.diet
      }
    };
  }

  /**
   * Handles the successful response from the n8n webhook.
   * Parses the recipe JSON and persists it to Firestore.
   * @param response - The raw response from the webhook.
   * @returns The parsed recipe object.
   */
  private handleResponse(response: any): any {
    console.log('Response from n8n:', response);
    try {
      const jsonString = this.extractJsonString(response);
      const recipe = this.parseRecipeJson(jsonString);
      this.saveAndNavigate(recipe);
      return recipe;
    } catch (e) {
      console.error('Error parsing recipe from n8n:', e);
      alert('Fehler beim Auslesen des Rezeptes. In der Konsole siehst du den genauen Text, der vom Server kam.');
      this.router.navigate(['/preferences']);
      throw e;
    }
  }

  /**
   * Extracts the JSON string from the n8n response wrapper.
   * Handles both array and object response formats.
   * @param response - The raw webhook response.
   * @returns The extracted JSON string or object.
   */
  private extractJsonString(response: any): any {
    const data = Array.isArray(response) ? response[0] : response;
    let jsonString = data?.output || data;
    if (typeof jsonString === 'string') {
      jsonString = this.trimToJsonBoundaries(jsonString);
    }
    return jsonString;
  }

  /**
   * Trims a raw string to the outermost JSON boundaries ({ } or [ ]).
   * @param raw - The raw string potentially containing surrounding text.
   * @returns The trimmed JSON string.
   */
  private trimToJsonBoundaries(raw: string): string {
    const startObject = raw.indexOf('{');
    const startArray = raw.indexOf('[');
    const isArray = startArray !== -1 && (startObject === -1 || startArray < startObject);
    const startChar = isArray ? '[' : '{';
    const endChar = isArray ? ']' : '}';
    const startIdx = raw.indexOf(startChar);
    const endIdx = raw.lastIndexOf(endChar);
    if (startIdx !== -1 && endIdx !== -1) {
      return raw.substring(startIdx, endIdx + 1);
    }
    return raw;
  }

  /**
   * Parses a JSON string into a recipe object.
   * Removes trailing commas that LLM output may produce.
   * @param jsonString - The JSON string to parse.
   * @returns The parsed recipe object.
   */
  private parseRecipeJson(jsonString: any): any {
    try {
      const safeString = typeof jsonString === 'string'
        ? jsonString.replace(/,\s*([\]}])/g, '$1')
        : jsonString;
      return typeof safeString === 'string' ? JSON.parse(safeString) : safeString;
    } catch (parseError) {
      console.error('Failed to parse this exact string:', jsonString);
      throw parseError;
    }
  }

  /**
   * Saves the parsed recipe to Firestore and navigates to the results page.
   * Falls back to the results page even if saving fails.
   * @param recipe - The parsed recipe object.
   * @returns The RxJS subscription for saving the recipe.
   */
  private saveAndNavigate(recipe: any): Subscription {
    return this.recipeService.saveRecipe(recipe).subscribe({
      next: () => {
        this.router.navigate(['/recipe-results']);
      },
      error: (err) => {
        console.error('Error saving recipe to Firestore:', err);
        alert('Recipe generated but failed to save to Database. Check Firestore rules.');
        this.router.navigate(['/recipe-results']);
      }
    });
  }

  /**
   * Handles network or webhook errors by logging, alerting, and
   * navigating back to the preferences page.
   * @param err - The HTTP error object.
   * @returns A Promise resolving to whether the navigation succeeded.
   */
  private handleRequestError(err: any): Promise<boolean> {
    console.error('Error from n8n webhook:', err);
    alert('Error connecting to n8n. Please check browser console for CORS or network issues.');
    return this.router.navigate(['/preferences']);
  }
}
