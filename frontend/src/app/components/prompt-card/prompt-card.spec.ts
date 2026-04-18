import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptCard } from './prompt-card';

describe('PromptCard', () => {
  let component: PromptCard;
  let fixture: ComponentFixture<PromptCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
