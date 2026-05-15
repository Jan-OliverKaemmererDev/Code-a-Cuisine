import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Recipe {
  id?: string;
  title: string;
  cookingTime: string;
  cuisine: string;
  persons: number;
  portions: number;
  dietPreferences: string;
  ingredients: string[];
  instructions: { step: number; description: string }[];
  nutrition: {
    energy: string;
    protein: string;
    fat: string;
    carbs: string;
  };
  likes: number;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private db: Firestore;

  constructor() {
    // Holt sich die Standard-Instanz, die von provideFirestore() 
    // in der app.config initialisiert wurde.
    this.db = getFirestore();
  }

  /**
   * Sends ingredients and preferences to n8n to generate a recipe.
   */
  generateRecipe(payload: any): Observable<Recipe> {
    return this.http.post<Recipe>(environment.n8nWebhookUrl, payload);
  }

  /**
   * Saves a generated recipe to Firestore.
   */
  saveRecipe(recipe: Recipe): Observable<any> {
    const recipeToSave = {
      ...recipe,
      createdAt: Date.now()
    };
    return from(addDoc(collection(this.db, 'recipes'), recipeToSave));
  }

  /**
   * Fetches all recipes from Firestore, ordered by creation date.
   */
  getRecipes(): Observable<Recipe[]> {
    return new Observable<Recipe[]>(observer => {
      const recipesCollection = collection(this.db, 'recipes');
      const recipesQuery = query(recipesCollection, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(recipesQuery, 
        (snapshot) => {
          const recipes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Recipe));
          observer.next(recipes);
        },
        (error) => {
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }
}
