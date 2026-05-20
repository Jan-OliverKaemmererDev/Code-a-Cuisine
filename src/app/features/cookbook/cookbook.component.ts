import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Represents a cuisine category with display metadata.
 */
interface CuisineCategory {
  name: string;
  icon: string;
  image: string;
}

/**
 * Displays the cookbook page with cuisine categories and the most-liked recipes
 * in a horizontally-draggable carousel with momentum scrolling.
 */
@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookbook.component.html',
  styleUrl: './cookbook.component.scss'
})
export class CookbookComponent {
  private recipeService = inject(RecipeService);
  private location = inject(Location);
  private router = inject(Router);

  /** Observable of the top 5 recipes sorted by likes descending. */
  mostLikedRecipes$: Observable<Recipe[]> = this.recipeService.getRecipes().pipe(
    map(recipes => recipes.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5))
  );

  /** Available cuisine categories for navigation. */
  categories: CuisineCategory[] = [
    { name: 'Italian cuisine', icon: '🤌', image: 'assets/img/cookbook/italian.jpg' },
    { name: 'German cuisine', icon: '🥨', image: 'assets/img/cookbook/german.jpg' },
    { name: 'Japanese cuisine', icon: '🥢', image: 'assets/img/cookbook/japanese.jpg' },
    { name: 'Gourmet cuisine', icon: '✨', image: 'assets/img/cookbook/gourmet.jpg' },
    { name: 'Indian cuisine', icon: '🍛', image: 'assets/img/cookbook/indian.jpg' },
    { name: 'Fusion cuisine', icon: '🍢', image: 'assets/img/cookbook/fusion.jpg' }
  ];

  /** Whether the mouse button is currently held down on the carousel. */
  isDown = false;
  /** Starting X position when the drag began. */
  startX = 0;
  /** Scroll position when the drag began. */
  scrollLeft = 0;
  /** Whether the user has dragged far enough to count as a drag (not a click). */
  hasDragged = false;

  /** Last recorded X position for velocity calculation. */
  lastX = 0;
  /** Timestamp of the last recorded mouse position. */
  lastTime = 0;
  /** Current scroll velocity in pixels per millisecond. */
  velocity = 0;
  /** ID of the currently running momentum animation frame. */
  animationId: any;

  /**
   * Handles mouse-down on the carousel container.
   * Initialises drag tracking and velocity measurement.
   * @param e - The mouse event from the container.
   */
  onMouseDown(e: MouseEvent): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.isDown = true;
    const container = e.currentTarget as HTMLElement;
    container.classList.add('active');
    this.startX = e.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
    this.hasDragged = false;
    this.lastX = e.pageX;
    this.lastTime = Date.now();
    this.velocity = 0;
  }

  /**
   * Handles mouse-leave on the carousel container.
   * Ends drag and triggers momentum scrolling.
   * @param e - The mouse event from the container.
   */
  onMouseLeave(e: MouseEvent): void {
    if (!this.isDown) return;
    this.isDown = false;
    const container = e.currentTarget as HTMLElement;
    container.classList.remove('active');
    this.startMomentumScroll(container);
  }

  /**
   * Handles mouse-up on the carousel container.
   * Ends drag and triggers momentum scrolling.
   * @param e - The mouse event from the container.
   */
  onMouseUp(e: MouseEvent): void {
    if (!this.isDown) return;
    this.isDown = false;
    const container = e.currentTarget as HTMLElement;
    container.classList.remove('active');
    this.startMomentumScroll(container);
  }

  /**
   * Handles mouse-move on the carousel container.
   * Updates scroll position and tracks velocity for momentum.
   * @param e - The mouse event from the container.
   */
  onMouseMove(e: MouseEvent): void {
    if (!this.isDown) return;
    e.preventDefault();
    const container = e.currentTarget as HTMLElement;
    this.updateVelocity(e.pageX);
    const x = e.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 1.5;
    if (Math.abs(walk) > 5) {
      this.hasDragged = true;
    }
    container.scrollLeft = this.scrollLeft - walk;
  }

  /**
   * Updates the scroll velocity based on the current mouse X position.
   * @param currentX - The current horizontal mouse position.
   */
  private updateVelocity(currentX: number): void {
    const currentTime = Date.now();
    const elapsed = currentTime - this.lastTime;
    if (elapsed > 0) {
      const deltaX = currentX - this.lastX;
      this.velocity = -deltaX / elapsed;
      this.lastX = currentX;
      this.lastTime = currentTime;
    }
  }

  /**
   * Starts a momentum-based scroll animation after the user releases the drag.
   * Applies friction each frame until the velocity drops below a threshold.
   * @param container - The scrollable carousel element.
   */
  private startMomentumScroll(container: HTMLElement): void {
    this.clampInitialVelocity();
    const friction = 0.95;
    const step = () => {
      if (Math.abs(this.velocity) < 0.05) {
        this.velocity = 0;
        return;
      }
      container.scrollLeft += this.velocity * 16;
      this.velocity *= friction;
      this.animationId = requestAnimationFrame(step);
    };
    this.animationId = requestAnimationFrame(step);
  }

  /**
   * Clamps the velocity to a reasonable range and zeroes it
   * if the mouse was held still before releasing.
   */
  private clampInitialVelocity(): void {
    const timeSinceLastMove = Date.now() - this.lastTime;
    if (timeSinceLastMove > 100) {
      this.velocity = 0;
    }
    const maxVelocity = 3;
    if (this.velocity > maxVelocity) this.velocity = maxVelocity;
    if (this.velocity < -maxVelocity) this.velocity = -maxVelocity;
  }

  /**
   * Handles a click on a recipe card. Navigates only if the user
   * did not drag the carousel.
   * @param e - The click event.
   * @param recipeId - The ID of the clicked recipe.
   */
  onCardClick(e: MouseEvent, recipeId: string | undefined): void {
    if (!recipeId) return;
    if (this.hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.router.navigate(['/recipe-view', recipeId], { queryParams: { from: 'cookbook' } });
  }

  /**
   * Navigates back to the previous page in the browser history.
   */
  goBack(): void {
    this.location.back();
  }
}
