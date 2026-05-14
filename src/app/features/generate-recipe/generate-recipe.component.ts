import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecipeStateService, IngredientItem } from '../../core/services/recipe-state.service';

const SUGGESTIONS: string[] = [
  'Pasta', 'Pastrami', 'Passionfruit', 'Parsley', 'Parmesan',
  'Baby spinach', 'Bacon', 'Basil', 'Banana', 'Butter',
  'Cherry tomatoes', 'Chicken', 'Cheese', 'Chili', 'Cream',
  'Egg', 'Eggplant', 'Edamame',
  'Fish', 'Flour', 'Feta',
  'Garlic', 'Ginger', 'Green beans',
  'Honey', 'Ham',
  'Lemon', 'Lettuce', 'Lime',
  'Milk', 'Mushroom', 'Mozzarella', 'Mango',
  'Onion', 'Olive oil', 'Orange',
  'Pepper', 'Potato', 'Pork', 'Pumpkin',
  'Rice', 'Rosemary',
  'Salmon', 'Salt', 'Shrimp', 'Soy sauce', 'Sugar', 'Spinach',
  'Tomato', 'Tofu', 'Thyme', 'Tuna',
  'Vinegar', 'Vanilla',
  'Zucchini',
];

@Component({
  selector: 'app-generate-recipe',
  imports: [FormsModule, RouterLink],
  templateUrl: './generate-recipe.component.html',
  styleUrl: './generate-recipe.component.scss',
})
export class GenerateRecipeComponent {
  private state = inject(RecipeStateService);

  // ── Top input card signals ──────────────────────────────────
  ingredientName = signal('');
  servingAmount = signal(100);
  selectedUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  showInputDropdown = signal(false);
  showSuggestions = signal(false);

  // ── Inline list-edit signals ────────────────────────────────
  editingListIndex = signal<number | null>(null);
  editAmount = signal(0);
  editUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  showListDropdown = signal(false);

  ingredients = this.state.ingredients;

  filteredSuggestions = computed(() => {
    const query = this.ingredientName().toLowerCase().trim();
    if (!query) return [];
    return SUGGESTIONS.filter((s) =>
      s.toLowerCase().startsWith(query)
    ).slice(0, 5);
  });

  hasIngredients = computed(() => this.ingredients().length > 0);

  // ── Top input card methods ──────────────────────────────────

  onIngredientInput(value: string): void {
    this.ingredientName.set(value);
    this.showSuggestions.set(value.trim().length > 0);
  }

  selectSuggestion(suggestion: string): void {
    this.ingredientName.set(suggestion);
    this.showSuggestions.set(false);
  }

  toggleInputDropdown(): void {
    this.showInputDropdown.update((v) => !v);
  }

  selectInputUnit(unit: 'gram' | 'ml' | 'piece'): void {
    this.selectedUnit.set(unit);
    this.showInputDropdown.set(false);
  }

  addIngredient(): void {
    const name = this.ingredientName().trim();
    if (!name) return;
    const newItem: IngredientItem = {
      name,
      amount: this.servingAmount(),
      unit: this.selectedUnit(),
    };
    this.ingredients.update((list) => [newItem, ...list]);
    this.resetInputFields();
  }

  closeSuggestions(): void {
    this.showSuggestions.set(false);
  }

  closeInputDropdown(): void {
    this.showInputDropdown.set(false);
  }

  // ── Inline list-edit methods ────────────────────────────────

  startEdit(index: number): void {
    const item = this.ingredients()[index];
    this.editingListIndex.set(index);
    this.editAmount.set(item.amount);
    this.editUnit.set(item.unit);
    this.showListDropdown.set(false);
  }

  saveEdit(index: number): void {
    this.ingredients.update((list) =>
      list.map((item, i) =>
        i === index
          ? { ...item, amount: this.editAmount(), unit: this.editUnit() }
          : item
      )
    );
    this.editingListIndex.set(null);
    this.showListDropdown.set(false);
  }

  toggleListDropdown(): void {
    this.showListDropdown.update((v) => !v);
  }

  selectListUnit(unit: 'gram' | 'ml' | 'piece'): void {
    this.editUnit.set(unit);
    this.showListDropdown.set(false);
  }

  deleteIngredient(index: number): void {
    this.ingredients.update((list) => list.filter((_, i) => i !== index));
    if (this.editingListIndex() === index) {
      this.editingListIndex.set(null);
    }
  }

  formatAmount(item: IngredientItem): string {
    if (item.unit === 'piece') return `${item.amount}`;
    if (item.unit === 'ml') return `${item.amount}ml`;
    return `${item.amount}g`;
  }

  private resetInputFields(): void {
    this.ingredientName.set('');
    this.servingAmount.set(100);
    this.selectedUnit.set('gram');
    this.showSuggestions.set(false);
    this.showInputDropdown.set(false);
  }
}
