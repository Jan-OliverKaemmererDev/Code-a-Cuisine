import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeView } from './recipe-view.component';

describe('RecipeView', () => {
  let component: RecipeView;
  let fixture: ComponentFixture<RecipeView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeView],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
