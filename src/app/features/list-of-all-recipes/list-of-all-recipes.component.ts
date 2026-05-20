import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Displays a paginated list of all recipes, optionally filtered by cuisine category.
 * Supports desktop and mobile banner images and ellipsis-based pagination.
 */
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

  /** Currently active cuisine category label. */
  cuisineCategory: string = 'All recipes';
  /** Path to the desktop banner image. */
  bannerImage: string = '';
  /** Observable stream of the current page's recipes. */
  recipes$!: Observable<Recipe[]>;

  private currentPageSubject = new BehaviorSubject<number>(1);
  /** Observable of the current page number. */
  currentPage$ = this.currentPageSubject.asObservable();

  /** Number of recipes displayed per page. */
  pageSize: number = 15;
  /** Total number of available pages. */
  totalPages: number = 1;
  /** Total number of recipes across all pages. */
  totalRecipesCount: number = 0;

  /** Gets the current page number. */
  get currentPage(): number {
    return this.currentPageSubject.value;
  }

  /** Sets the current page number. */
  set currentPage(val: number) {
    this.currentPageSubject.next(val);
  }

  /**
   * Subscribes to route query params and initialises the category
   * and recipe list on component load.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.applyCategory(params['cuisine']);
      this.currentPage = 1;
      this.fetchRecipes();
    });
  }

  /**
   * Sets the cuisine category and banner image from the route parameter.
   * @param cuisine - The cuisine query param value, or undefined.
   */
  private applyCategory(cuisine: string | undefined): void {
    if (cuisine) {
      this.cuisineCategory = cuisine;
      this.bannerImage = this.getBannerImage(cuisine);
    } else {
      this.cuisineCategory = 'All recipes';
      this.bannerImage = '';
    }
  }

  /**
   * Fetches recipes from the service, filters by cuisine if applicable,
   * and sets up the paginated observable pipeline.
   */
  fetchRecipes(): void {
    const rawRecipes$ = this.recipeService.getRecipes().pipe(
      map(recipes => this.filterByCuisine(recipes))
    );
    this.recipes$ = combineLatest([rawRecipes$, this.currentPage$]).pipe(
      map(([recipes, page]) => this.paginateRecipes(recipes, page))
    );
  }

  /**
   * Filters recipes by the active cuisine category.
   * Falls back to the full list if no matches are found.
   * @param recipes - The full recipe list.
   * @returns Filtered or unfiltered recipe list.
   */
  private filterByCuisine(recipes: Recipe[]): Recipe[] {
    if (this.cuisineCategory === 'All recipes') return recipes;
    const prefix = this.cuisineCategory.split(' ')[0].toLowerCase().substring(0, 3);
    const filtered = recipes.filter(r => r.cuisine?.toLowerCase().includes(prefix));
    return filtered.length > 0 ? filtered : recipes;
  }

  /**
   * Slices the recipe list for the requested page and updates pagination state.
   * @param recipes - The full (filtered) recipe list.
   * @param page - The requested page number.
   * @returns The recipes for the current page.
   */
  private paginateRecipes(recipes: Recipe[], page: number): Recipe[] {
    this.totalRecipesCount = recipes.length;
    this.totalPages = Math.ceil(recipes.length / this.pageSize) || 1;
    if (page > this.totalPages) {
      page = this.totalPages;
      this.currentPageSubject.next(page);
    }
    const start = (page - 1) * this.pageSize;
    return recipes.slice(start, start + this.pageSize).map(r => ({
      ...r,
      likes: r.likes || 0
    }));
  }

  /**
   * Returns the desktop banner image path for a cuisine category.
   * @param category - The cuisine category name.
   * @returns Asset path for the desktop banner.
   */
  getBannerImage(category: string): string {
    const prefix = category.split(' ')[0].toLowerCase();
    return `assets/icons/food-categories/${prefix}-food.png`;
  }

  /**
   * Returns the mobile banner image path for a cuisine category.
   * @param category - The cuisine category name.
   * @returns Asset path for the mobile banner.
   */
  getMobileBannerImage(category: string): string {
    const prefix = category.split(' ')[0].toLowerCase();
    return `assets/icons/food-categories-mobile/${prefix}.png`;
  }

  /**
   * Navigates back to the previous page in the browser history.
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Sets the current page to the given value if it is a number.
   * @param page - The page number or string identifier.
   */
  setPage(page: number | string): void {
    if (typeof page === 'number') {
      this.currentPage = page;
    }
  }

  /**
   * Navigates to the previous page if not already on the first page.
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Navigates to the next page if not already on the last page.
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Handles clicks on pagination ellipsis elements.
   * Jumps to page 4 for forward ellipsis or page 3 for backward ellipsis.
   * @param pageType - The ellipsis identifier string.
   */
  onEllipsisClick(pageType: string | number): void {
    if (pageType === 'ellipsis' || pageType === 'ellipsis-next') {
      this.currentPage = 4;
    } else if (pageType === 'ellipsis-prev') {
      this.currentPage = 3;
    }
  }

  /**
   * Computes the array of visible page numbers and ellipsis markers
   * for the pagination controls.
   * @returns An array of page numbers and ellipsis string identifiers.
   */
  getVisiblePages(): (number | string)[] {
    if (this.totalPages <= 5) {
      return this.buildSimplePages();
    }
    if (this.currentPage <= 3) {
      return this.buildStartPages();
    }
    if (this.currentPage >= 4 && this.currentPage <= 6) {
      return this.buildMiddlePages();
    }
    return this.buildEndPages();
  }

  /**
   * Builds page numbers when the total is 5 or fewer (no ellipsis needed).
   * @returns Sequential page number array.
   */
  private buildSimplePages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Builds page numbers when the current page is near the start.
   * @returns Pages array with trailing ellipsis and last page.
   */
  private buildStartPages(): (number | string)[] {
    return [1, 2, 3, 'ellipsis', this.totalPages];
  }

  /**
   * Builds page numbers when the current page is in the middle range (4–6).
   * @returns Pages array with leading/trailing ellipsis as needed.
   */
  private buildMiddlePages(): (number | string)[] {
    const pages: (number | string)[] = ['ellipsis-prev'];
    for (let i = 4; i <= Math.min(6, this.totalPages); i++) {
      pages.push(i);
    }
    if (this.totalPages > 6) {
      if (this.totalPages > 7) {
        pages.push('ellipsis-next');
      }
      pages.push(this.totalPages);
    }
    return pages;
  }

  /**
   * Builds page numbers when the current page is near the end.
   * @returns Pages array with leading ellipsis and last few pages.
   */
  private buildEndPages(): (number | string)[] {
    const pages: (number | string)[] = ['ellipsis-prev'];
    const endStart = Math.max(this.totalPages - 2, 4);
    for (let i = endStart; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
