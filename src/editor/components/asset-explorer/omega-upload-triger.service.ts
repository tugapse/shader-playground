import {
  inject,
  Injectable,
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';
import { Subject, Observable } from 'rxjs';
import {
  StagedAssetResult,
  OmegaUploadModalComponent,
} from './components/omega-upload-modal.component.ts';

@Injectable({
  providedIn: 'root',
})
export class AssetsUploadTriggerService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  /**
   * Spawns the modern staging modal overlay onto the global body wrapper container.
   * Returns an Observable that emits the final custom metadata and native file structures
   * when the user hits "Import", or completes without value if canceled.
   * * @param targetVirtualPath The destination directory string context (e.g. '/root/textures')
   */
  openUploadDialog(targetVirtualPath: string): Observable<StagedAssetResult[]> {
    const result$ = new Subject<StagedAssetResult[]>();

    // 🚀 Programmatically instantiate the component context completely detached from standard static layout routes
    const componentRef: ComponentRef<OmegaUploadModalComponent> =
      createComponent(OmegaUploadModalComponent, {
        environmentInjector: this.injector,
      });

    // Bind input attributes configuration parameters
    componentRef.setInput('targetFolderColumn', targetVirtualPath);

    // Handle Confirm Event output pipeline hook
    componentRef.instance.confirmed.subscribe((stagedData) => {
      result$.next(stagedData);
      result$.complete();
      this.destroyModal(componentRef);
    });

    // Handle Cancel/Close Event output pipeline hook
    componentRef.instance.closed.subscribe(() => {
      result$.complete();
      this.destroyModal(componentRef);
    });

    // Attach to the live Angular application view validation tree structure
    this.appRef.attachView(componentRef.hostView);

    // Append raw generated native DOM element onto the application body root frame layout
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    return result$.asObservable();
  }

  private destroyModal(componentRef: ComponentRef<OmegaUploadModalComponent>) {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }
}
