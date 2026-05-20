import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Landing page component serving as the application entry point.
 * Provides navigation links to the main features.
 */
@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {}
