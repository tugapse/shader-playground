import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetTree } from './asset-tree';

describe('AssetTree', () => {
  let component: AssetTree;
  let fixture: ComponentFixture<AssetTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetTree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetTree);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
