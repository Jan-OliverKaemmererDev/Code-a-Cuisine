import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { RecipeService, Recipe } from '../../core/services/recipe.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface CuisineCategory {
  name: string;
  icon: string;
  image: string;
}

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

  // Get most liked recipes (sort by likes descending)
  mostLikedRecipes$: Observable<Recipe[]> = this.recipeService.getRecipes().pipe(
    map(recipes => recipes.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5))
  );

  categories: CuisineCategory[] = [
    { name: 'Italian cuisine', icon: '🧀', image: 'assets/img/cookbook/italian.jpg' },
    { name: 'German cuisine', icon: '🥨', image: 'assets/img/cookbook/german.jpg' },
    { name: 'Japanese cuisine', icon: '🥢', image: 'assets/img/cookbook/japanese.jpg' },
    { name: 'Gourmet cuisine', icon: '✨', image: 'assets/img/cookbook/gourmet.jpg' },
    { name: 'Indian cuisine', icon: '🍛', image: 'assets/img/cookbook/indian.jpg' },
    { name: 'Fusion cuisine', icon: '🍢', image: 'assets/img/cookbook/fusion.jpg' }
  ];

  isDown = false;
  startX = 0;
  scrollLeft = 0;
  hasDragged = false;

  // Momentum scroll variables
  lastX = 0;
  lastTime = 0;
  velocity = 0;
  animationId: any;

  onMouseDown(e: MouseEvent) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.isDown = true;
    const container = e.currentTarget as HTMLElement;
    container.classList.add('active');
    this.startX = e.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
    this.hasDragged = false;

    // Initialize velocity tracking
    this.lastX = e.pageX;
    this.lastTime = Date.now();
    this.velocity = 0;
  }

  onMouseLeave(e: MouseEvent) {
    if (!this.isDown) return;
    this.isDown = false;
    const container = e.currentTarget as HTMLElement;
    container.classList.remove('active');
    this.startMomentumScroll(container);
  }

  onMouseUp(e: MouseEvent) {
    if (!this.isDown) return;
    this.isDown = false;
    const container = e.currentTarget as HTMLElement;
    container.classList.remove('active');
    this.startMomentumScroll(container);
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDown) return;
    e.preventDefault();
    const container = e.currentTarget as HTMLElement;

    // Track scroll velocity
    const currentTime = Date.now();
    const elapsed = currentTime - this.lastTime;
    if (elapsed > 0) {
      const deltaX = e.pageX - this.lastX;
      // pixels per millisecond (negative because dragging left scrolls right)
      this.velocity = -deltaX / elapsed;
      this.lastX = e.pageX;
      this.lastTime = currentTime;
    }

    const x = e.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 1.5;
    if (Math.abs(walk) > 5) {
      this.hasDragged = true;
    }
    container.scrollLeft = this.scrollLeft - walk;
  }

  private startMomentumScroll(container: HTMLElement) {
    // If the user held the mouse still before releasing, don't scroll
    const timeSinceLastMove = Date.now() - this.lastTime;
    if (timeSinceLastMove > 100) {
      this.velocity = 0;
    }

    // Limit initial velocity to a reasonable range
    const maxVelocity = 3;
    if (this.velocity > maxVelocity) this.velocity = maxVelocity;
    if (this.velocity < -maxVelocity) this.velocity = -maxVelocity;

    const friction = 0.95; // Deceleration rate per frame
    const step = () => {
      if (Math.abs(this.velocity) < 0.05) {
        this.velocity = 0;
        return;
      }
      container.scrollLeft += this.velocity * 16; // Multiply velocity by frame duration
      this.velocity *= friction;
      this.animationId = requestAnimationFrame(step);
    };
    this.animationId = requestAnimationFrame(step);
  }

  onCardClick(e: MouseEvent, recipeId: string | undefined) {
    if (!recipeId) return;
    if (this.hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.router.navigate(['/recipe-view', recipeId], { queryParams: { from: 'cookbook' } });
  }

  goBack() {
    this.location.back();
  }
}
