import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, collection, addDoc, collectionData, query, orderBy } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Recipe {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private recipesCollection = collection(this.firestore, 'recipes');

  constructor() {}

  /**
   * Sends ingredients to n8n to generate a recipe.
   */
  generateRecipe(ingredients: string[]): Observable<Recipe> {
    return this.http.post<Recipe>(environment.n8nWebhookUrl, { ingredients });
  }

  /**
   * Saves a generated recipe to Firestore.
   */
  saveRecipe(recipe: Recipe): Observable<any> {
    const recipeToSave = {
      ...recipe,
      createdAt: Date.now()
    };
    return from(addDoc(this.recipesCollection, recipeToSave));
  }

  /**
   * Fetches all recipes from Firestore, ordered by creation date.
   */
  getRecipes(): Observable<Recipe[]> {
    const recipesQuery = query(this.recipesCollection, orderBy('createdAt', 'desc'));
    return collectionData(recipesQuery, { idField: 'id' }) as Observable<Recipe[]>;
  }
}
