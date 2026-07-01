import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetContextMenu } from './asset-context-menu';

describe('AssetContextMenu', () => {
  let component: AssetContextMenu;
  let fixture: ComponentFixture<AssetContextMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetContextMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetContextMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
