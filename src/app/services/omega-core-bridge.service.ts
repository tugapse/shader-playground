import { Injectable } from "@angular/core";

export interface OmegaEngineExports {
  OmegaCore?: {
    EngineMath?: {
      CalculateTransform: (x: number, y: number, scale: number) => number;
      Ping: () => string;
    };
  };
  [key: string]: any;
}

@Injectable({
  providedIn: "root",
})
export class OmegaCoreBridgeService {
  private dotNetExports: OmegaEngineExports | null = null;
  private isInitialized = false;

  async initializeEngine(): Promise<OmegaEngineExports> {
    if (this.isInitialized && this.dotNetExports) {
      return this.dotNetExports;
    }

    try {
      const dotnetScriptUrl = "/assets/wasm/dotnet.js";

      // @ts-ignore
      const dotnetModule: any = await import(
        /* @vite-ignore */ dotnetScriptUrl
      );

      console.log("Initializing .NET WebAssembly Runtime...");

      const runtime = await dotnetModule.dotnet
        .withDiagnosticTracing(false)
        .withConfig({
          mainAssemblyName: "omega-engine-core.dll",
          resources: {
            jsModuleNative: { "dotnet.native.js": "" },
            jsModuleRuntime: { "dotnet.runtime.js": "" },
            wasmNative: { "dotnet.native.wasm": "" },
            assembly: {
              "omega-engine-core.dll": "",
              "System.Private.CoreLib.dll": "",
              "System.Runtime.InteropServices.JavaScript.dll": "",
              "System.Console.dll": "",
            },
            icu: {
              "icudt.dat": "",
            },
          },
        })
        .withResourceLoader(
          (type: string, name: string, defaultUri: string) => {
            return `/assets/wasm/${name}`;
          },
        )
        .create();

      console.log(".NET Runtime Created successfully.");

      try {
        this.dotNetExports = await runtime.getAssemblyExports(
          "omega-engine-core.dll",
        );
      } catch (e) {
        console.warn("Fallback: Trying without .dll extension...");
        this.dotNetExports =
          await runtime.getAssemblyExports("omega-engine-core");
      }

      this.isInitialized = true;
      console.log(
        ".NET WebAssembly Runtime Fully Initialized!",
        this.dotNetExports,
      );
      return this.dotNetExports!;
    } catch (error) {
      console.error("Failed to initialize .NET WebAssembly runtime:", error);
      throw error;
    }
  }

  async runTestCalculation(): Promise<any> {
    const exports = await this.initializeEngine();
    console.log("Available C# Exports Object:", exports);

    if (exports.OmegaCore?.EngineMath) {
      const result = exports.OmegaCore.EngineMath.CalculateTransform(10, 20, 2);
      console.log("C# Compute Result:", result);
      return result;
    }

    return exports;
  }

  async calculateTransform(
    x: number,
    y: number,
    scale: number,
  ): Promise<number> {
    const exports = await this.initializeEngine();
    if (exports.OmegaCore?.EngineMath) {
      return exports.OmegaCore.EngineMath.CalculateTransform(x, y, scale);
    }
    throw new Error("EngineMath exports not available.");
  }
}
