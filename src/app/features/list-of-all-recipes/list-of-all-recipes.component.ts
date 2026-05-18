import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
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

  private currentPageSubject = new BehaviorSubject<number>(1);
  currentPage$ = this.currentPageSubject.asObservable();

  pageSize: number = 15;
  totalPages: number = 1;
  totalRecipesCount: number = 0;

  get currentPage(): number {
    return this.currentPageSubject.value;
  }

  set currentPage(val: number) {
    this.currentPageSubject.next(val);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['cuisine']) {
        this.cuisineCategory = params['cuisine'];
        this.bannerImage = this.getBannerImage(this.cuisineCategory);
      } else {
        this.cuisineCategory = 'All recipes';
        this.bannerImage = ''; 
      }
      this.currentPage = 1; // Reset to page 1 when category changes
      this.fetchRecipes();
    });
  }

  fetchRecipes() {
    const rawRecipes$ = this.recipeService.getRecipes().pipe(
      map(recipes => {
        if (this.cuisineCategory !== 'All recipes') {
          const prefix = this.cuisineCategory.split(' ')[0].toLowerCase().substring(0, 3);
          const filtered = recipes.filter(r => r.cuisine?.toLowerCase().includes(prefix));
          return filtered.length > 0 ? filtered : recipes;
        }
        return recipes;
      })
    );

    this.recipes$ = combineLatest([rawRecipes$, this.currentPage$]).pipe(
      map(([recipes, page]) => {
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
      })
    );
  }

  getBannerImage(category: string): string {
    const prefix = category.split(' ')[0].toLowerCase();
    return `assets/icons/food-categories/${prefix}-food.png`;
  }

  goBack() {
    this.location.back();
  }

  setPage(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage = page;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onEllipsisClick(pageType: string | number) {
    if (pageType === 'ellipsis' || pageType === 'ellipsis-next') {
      this.currentPage = 4;
    } else if (pageType === 'ellipsis-prev') {
      this.currentPage = 3;
    }
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (this.currentPage <= 3) {
      pages.push(1, 2, 3);
      pages.push('ellipsis');
      pages.push(this.totalPages);
    } else if (this.currentPage >= 4 && this.currentPage <= 6) {
      pages.push('ellipsis-prev');
      for (let i = 4; i <= Math.min(6, this.totalPages); i++) {
        pages.push(i);
      }
      if (this.totalPages > 6) {
        if (this.totalPages > 7) {
          pages.push('ellipsis-next');
        }
        pages.push(this.totalPages);
      }
    } else {
      pages.push('ellipsis-prev');
      const endStart = Math.max(this.totalPages - 2, 4);
      for (let i = endStart; i <= this.totalPages; i++) {
        pages.push(i);
      }
    }
    return pages;
  }
}
