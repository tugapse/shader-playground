import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityInspector } from './entity-inspector';

describe('EntityInspector', () => {
  let component: EntityInspector;
  let fixture: ComponentFixture<EntityInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
