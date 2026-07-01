import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetCreateMenu } from './asset-create-menu';

describe('AssetCreateMenu', () => {
  let component: AssetCreateMenu;
  let fixture: ComponentFixture<AssetCreateMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetCreateMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetCreateMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
