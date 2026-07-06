import { EventEmitter, inject, Injectable } from '@angular/core';
import { Engine } from 'omega-game-engine';
import { API_URL } from '../api/api-url.token';

@Injectable({
  providedIn: 'root',
})
export class OmegaEngineService {
  private _isReloadingEngine = false;
  private apiUrl = inject(API_URL);
  private _currentEngine: Engine | null = null;

  public get isReloadingEngine(): boolean {
    return this._isReloadingEngine;
  }

  public get currentEngine(): Engine | null {
    return this._currentEngine;
  }

  public reloadEngineRequested = new EventEmitter();
  public engineReloaded = new EventEmitter<boolean>();

  protected async onReloadEngine(projectId: string) {
    this.reloadEngineRequested.emit();
    this._isReloadingEngine = true;

    if (!projectId) throw new Error('No project id provided.');

    const baseGateway = this.apiUrl.endsWith('/api')
      ? this.apiUrl
      : `${this.apiUrl}/api`;

    // FIXME:Fetch from auth Service and use a cookie service instead
    const authToken = localStorage.getItem('omega-auth-token');
    if (!authToken) throw new Error('No auth token found.');

    const bundleUrl = `${baseGateway}/projects/${projectId}/code/bundle?token=${encodeURIComponent(authToken)}&t=${new Date().getTime()}`;

    try {
      const gameModule = await import(/* @vite-ignore */ bundleUrl);

      if (!gameModule.Game) {
        console.error(
          "Linker error: The module loaded, but failed to locate an exported 'Game' class.",
        );
        this.engineReloaded.emit(false);
        this._isReloadingEngine = false;
        return null;
      }

      if (this._currentEngine) {
        this._currentEngine.destroy();
        this._currentEngine = null;
      }

      this._currentEngine = new gameModule.Game();
      if (this._currentEngine && this._currentEngine instanceof Engine) {
        this._currentEngine.registerDependencies();
        console.debug(
          `Successfully loaded and booted engine instance for project: ${projectId}`,
        );
        this.engineReloaded.emit(true);
        this._isReloadingEngine = false;
        return this._currentEngine;
      } else {
        console.error(
          `Linker error: The module loaded, but the exported 'Game' class is not an instance of Engine.`,
        );
        this.engineReloaded.emit(false);
        this._isReloadingEngine = false;
        return null;
      }
    } catch (error) {
      console.error(
        `CRITICAL: Dynamic runtime execution injection fault for project ${projectId}:`,
        error,
      );
      this.engineReloaded.emit(false);
      this._isReloadingEngine = false;
      return null;
    }
  }
}
