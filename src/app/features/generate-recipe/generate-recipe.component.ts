import { Component, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecipeStateService, IngredientItem } from '../../core/services/recipe-state.service';

/** Static list of ingredient auto-complete suggestions. */
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

/**
 * Provides the ingredient entry form where users can add, edit,
 * and remove ingredients before generating a recipe.
 */
@Component({
  selector: 'app-generate-recipe',
  imports: [FormsModule, RouterLink],
  templateUrl: './generate-recipe.component.html',
  styleUrl: './generate-recipe.component.scss',
})
export class GenerateRecipeComponent {
  private state = inject(RecipeStateService);
  private elementRef = inject(ElementRef);

  /** Current ingredient name typed by the user. */
  ingredientName = signal('');
  /** Serving amount for the ingredient being added. */
  servingAmount = signal<number | null>(null);
  /** Selected unit for the ingredient being added. */
  selectedUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  /** Whether the unit dropdown on the input card is open. */
  showInputDropdown = signal(false);
  /** Whether the suggestion list is visible. */
  showSuggestions = signal(false);

  /** Index of the ingredient currently being edited inline, or null. */
  editingListIndex = signal<number | null>(null);
  /** Name value while editing an existing ingredient. */
  editName = signal('');
  /** Amount value while editing an existing ingredient. */
  editAmount = signal(0);
  /** Unit value while editing an existing ingredient. */
  editUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  /** Whether the unit dropdown on the inline editor is open. */
  showListDropdown = signal(false);

  /** Reactive list of ingredients from shared state. */
  ingredients = this.state.ingredients;

  /** Filtered auto-complete suggestions based on the current input. */
  filteredSuggestions = computed(() => {
    const query = this.ingredientName().toLowerCase().trim();
    if (!query) return [];
    return SUGGESTIONS.filter((s) =>
      s.toLowerCase().startsWith(query)
    ).slice(0, 5);
  });

  /** Whether at least one ingredient has been added. */
  hasIngredients = computed(() => this.ingredients().length > 0);

  /**
   * Updates the ingredient name signal and toggles the suggestion list.
   * @param value - The current value of the ingredient input field.
   * @returns True if suggestion list is now shown, false otherwise.
   */
  onIngredientInput(value: string): boolean {
    this.ingredientName.set(value);
    const show = value.trim().length > 0;
    this.showSuggestions.set(show);
    return show;
  }

  /**
   * Selects an auto-complete suggestion and closes the suggestion list.
   * @param suggestion - The selected suggestion string.
   * @returns The selected suggestion.
   */
  selectSuggestion(suggestion: string): string {
    this.ingredientName.set(suggestion);
    this.showSuggestions.set(false);
    return suggestion;
  }

  /**
   * Toggles visibility of the unit dropdown on the input card.
   * @returns The new visibility state of the input card unit dropdown.
   */
  toggleInputDropdown(): boolean {
    this.showInputDropdown.update((v) => !v);
    return this.showInputDropdown();
  }

  /**
   * Sets the unit on the input card and closes its dropdown.
   * @param unit - The unit to select.
   * @returns The selected unit.
   */
  selectInputUnit(unit: 'gram' | 'ml' | 'piece'): 'gram' | 'ml' | 'piece' {
    this.selectedUnit.set(unit);
    this.showInputDropdown.set(false);
    return unit;
  }

  /**
   * Adds the current ingredient to the list and resets the input fields.
   * @returns The newly added IngredientItem, or null if validation failed.
   */
  addIngredient(): IngredientItem | null {
    const name = this.ingredientName().trim();
    const amount = this.servingAmount();
    if (!name || amount === null || amount <= 0) return null;
    const newItem: IngredientItem = {
      name,
      amount,
      unit: this.selectedUnit(),
    };
    this.ingredients.update((list) => [newItem, ...list]);
    this.resetInputFields();
    return newItem;
  }

  /**
   * Closes the suggestion dropdown.
   * @returns False representing the closed state.
   */
  closeSuggestions(): boolean {
    this.showSuggestions.set(false);
    return false;
  }

  /**
   * Closes the input card unit dropdown.
   * @returns False representing the closed state.
   */
  closeInputDropdown(): boolean {
    this.showInputDropdown.set(false);
    return false;
  }

  /**
   * Starts inline editing for the ingredient at the given index.
   * @param index - Index of the ingredient to edit.
   * @returns The IngredientItem selected for editing, or null if index is out of bounds.
   */
  startEdit(index: number): IngredientItem | null {
    const item = this.ingredients()[index];
    if (!item) return null;
    this.editingListIndex.set(index);
    this.editName.set(item.name);
    this.editAmount.set(item.amount);
    this.editUnit.set(item.unit);
    this.showListDropdown.set(false);
    return item;
  }

  /**
   * Saves the inline edits for the ingredient at the given index.
   * @param index - Index of the ingredient to save.
   * @returns The newly updated IngredientItem, or null if saving failed or index is out of bounds.
   */
  saveEdit(index: number): IngredientItem | null {
    const item = this.ingredients()[index];
    if (!item) return null;
    const updatedItem: IngredientItem = { ...item, name: this.editName().trim() || item.name, amount: this.editAmount(), unit: this.editUnit() };
    this.ingredients.update((list) =>
      list.map((it, i) => i === index ? updatedItem : it)
    );
    this.editingListIndex.set(null);
    this.showListDropdown.set(false);
    return updatedItem;
  }

  /**
   * Toggles visibility of the inline edit unit dropdown.
   * @returns The new visibility state of the inline edit unit dropdown.
   */
  toggleListDropdown(): boolean {
    this.showListDropdown.update((v) => !v);
    return this.showListDropdown();
  }

  /**
   * Sets the unit on the inline editor and closes its dropdown.
   * @param unit - The unit to select.
   * @returns The selected unit.
   */
  selectListUnit(unit: 'gram' | 'ml' | 'piece'): 'gram' | 'ml' | 'piece' {
    this.editUnit.set(unit);
    this.showListDropdown.set(false);
    return unit;
  }

  /**
   * Removes an ingredient from the list by index.
   * Clears the editing state if the deleted item was being edited.
   * @param index - Index of the ingredient to delete.
   * @returns The deleted IngredientItem, or null if index is out of bounds.
   */
  deleteIngredient(index: number): IngredientItem | null {
    const item = this.ingredients()[index];
    if (!item) return null;
    this.ingredients.update((list) => list.filter((_, i) => i !== index));
    if (this.editingListIndex() === index) {
      this.editingListIndex.set(null);
    }
    return item;
  }

  /**
   * Returns a human-readable string for the ingredient amount with unit suffix.
   * @param item - The ingredient item.
   * @returns Formatted amount string (e.g. "100g", "50ml", "2").
   */
  formatAmount(item: IngredientItem): string {
    if (item.unit === 'piece') return `${item.amount}`;
    if (item.unit === 'ml') return `${item.amount}ml`;
    return `${item.amount}g`;
  }

  /**
   * Resets all input card fields to their default values.
   */
  private resetInputFields(): void {
    this.ingredientName.set('');
    this.servingAmount.set(null);
    this.selectedUnit.set('gram');
    this.showSuggestions.set(false);
    this.showInputDropdown.set(false);
  }

  /**
   * Closes open dropdowns when the user clicks outside of them.
   * @param event - The global document click event.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.generate__unit-dropdown')) {
      this.showInputDropdown.set(false);
    }
    if (!target.closest('.generate__inline-unit-wrap')) {
      this.showListDropdown.set(false);
    }
  }
}
