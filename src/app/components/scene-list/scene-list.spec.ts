import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SceneList } from './scene-list';

describe('SceneList', () => {
  let component: SceneList;
  let fixture: ComponentFixture<SceneList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SceneList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SceneList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
