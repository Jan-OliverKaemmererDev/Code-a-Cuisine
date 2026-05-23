import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Firestore,
  doc,
  getDoc,
  updateDoc
} from '@angular/fire/firestore';
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
  difficulty?: string;
  ingredients: string[];
  instructions: { step: number; description: string }[];
  nutrition?: {
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
  private db: Firestore = inject(Firestore);

  constructor() {}

  /**
   * Sends ingredients and preferences to n8n to generate a recipe.
   */
  generateRecipe(payload: any): Observable<any> {
    return this.http.post<any>(environment.n8nWebhookUrl, payload);
  }

  /**
   * Retrieves the current quota for the user's IP and system-wide from n8n.
   */
  getQuota(): Observable<any> {
    const quotaUrl = environment.n8nWebhookUrl + '-quota';
    return this.http.get<any>(quotaUrl);
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
          const recipes = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Recipe))
            .filter(r => r.title); // filter out broken/old recipes
          
          observer.next(recipes);
        },
        (error) => {
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }

  /**
   * Fetches a single recipe by its ID.
   */
  getRecipeById(id: string): Observable<Recipe | undefined> {
    return from(
      getDoc(doc(this.db, 'recipes', id)).then(snapshot => {
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Recipe;
        }
        return undefined;
      })
    );
  }

  /**
   * Updates an existing recipe in Firestore.
   */
  updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
    const docRef = doc(this.db, 'recipes', id);
    return updateDoc(docRef, updates as any);
  }
}
