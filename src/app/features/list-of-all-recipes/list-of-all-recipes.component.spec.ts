import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfAllRecipesComponent } from './list-of-all-recipes.component';

describe('ListOfAllRecipesComponent', () => {
  let component: ListOfAllRecipesComponent;
  let fixture: ComponentFixture<ListOfAllRecipesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfAllRecipesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListOfAllRecipesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
