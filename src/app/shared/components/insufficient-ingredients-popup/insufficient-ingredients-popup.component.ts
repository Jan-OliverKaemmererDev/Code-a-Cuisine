import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-insufficient-ingredients-popup',
  standalone: true,
  imports: [],
  templateUrl: './insufficient-ingredients-popup.component.html',
  styleUrl: './insufficient-ingredients-popup.component.scss'
})
export class InsufficientIngredientsPopupComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  goBack() {
    this.close.emit();
    this.router.navigate(['/generate-recipe']);
  }
}
