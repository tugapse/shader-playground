import { Injectable, inject, NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MonacoService {
  private ngZone = inject(NgZone);
  private editorInstance: any;

  private extraLibs: Map<string, any> = new Map();

  // 🎯 Engine Preprocessor Directive Maps
  private static readonly SHADER_FUNCTIONS: { [key: string]: string } = {
    '@INCLUDE_FOG_FUNC': 'ShaderSources.frag.fog',
    '@INCLUDE_LIGHT_FUNC': 'ShaderSources.frag.light',
    '@INCLUDE_UTIL_FUNC': 'ShaderSources.frag.functions',
  };

  // 🎯 Core Native GLSL Built-in Function Signatures & Documentation Map
  private static readonly NATIVE_GLSL_BUILTINS = [
    {
      label: 'radians',
      insert: 'radians(${1:degrees})',
      detail: 'float radians(float degrees)',
      desc: 'Converts degrees to radians.',
    },
    {
      label: 'degrees',
      insert: 'degrees(${1:radians})',
      detail: 'float degrees(float radians)',
      desc: 'Converts radians to degrees.',
    },
    {
      label: 'sin',
      insert: 'sin(${1:x})',
      detail: 'float/vec sin(float/vec x)',
      desc: 'Sine trigonometric calculation.',
    },
    {
      label: 'cos',
      insert: 'cos(${1:x})',
      detail: 'float/vec cos(float/vec x)',
      desc: 'Cosine trigonometric calculation.',
    },
    {
      label: 'tan',
      insert: 'tan(${1:x})',
      detail: 'float/vec tan(float/vec x)',
      desc: 'Tangent trigonometric calculation.',
    },
    {
      label: 'pow',
      insert: 'pow(${1:x}, ${2:y})',
      detail: 'float pow(float x, float y)',
      desc: 'Returns x raised to the power of y.',
    },
    {
      label: 'exp',
      insert: 'exp(${1:x})',
      detail: 'float exp(float x)',
      desc: 'Returns the natural exponentiation of x.',
    },
    {
      label: 'log',
      insert: 'log(${1:x})',
      detail: 'float log(float x)',
      desc: 'Returns the natural logarithm of x.',
    },
    {
      label: 'sqrt',
      insert: 'sqrt(${1:x})',
      detail: 'float sqrt(float x)',
      desc: 'Returns the square root of x.',
    },
    {
      label: 'abs',
      insert: 'abs(${1:x})',
      detail: 'float/vec abs(float/vec x)',
      desc: 'Returns absolute value matrix magnitude.',
    },
    {
      label: 'sign',
      insert: 'sign(${1:x})',
      detail: 'float sign(float x)',
      desc: 'Returns 1.0 if x > 0, 0.0 if x == 0, -1.0 if x < 0.',
    },
    {
      label: 'floor',
      insert: 'floor(${1:x})',
      detail: 'float floor(float x)',
      desc: 'Finds nearest integer value boundary below x.',
    },
    {
      label: 'ceil',
      insert: 'ceil(${1:x})',
      detail: 'float ceil(float x)',
      desc: 'Finds nearest integer value boundary above x.',
    },
    {
      label: 'mod',
      insert: 'mod(${1:x}, ${2:y})',
      detail: 'float mod(float x, float y)',
      desc: 'Modulo remainder extraction calculation.',
    },
    {
      label: 'min',
      insert: 'min(${1:x}, ${2:y})',
      detail: 'float min(float x, float y)',
      desc: 'Returns lesser value scalar.',
    },
    {
      label: 'max',
      insert: 'max(${1:x}, ${2:y})',
      detail: 'float max(float x, float y)',
      desc: 'Returns greater value scalar.',
    },
    {
      label: 'clamp',
      insert: 'clamp(${1:x}, ${2:minVal}, ${3:maxVal})',
      detail: 'vec/float clamp(val, min, max)',
      desc: 'Constrains val between min and max parameters.',
    },
    {
      label: 'mix',
      insert: 'mix(${1:x}, ${2:y}, ${3:a})',
      detail: 'vec/float mix(vec x, vec y, vec/float a)',
      desc: 'Performs standard linear interpolation: x * (1 - a) + y * a.',
    },
    {
      label: 'step',
      insert: 'step(${1:edge}, ${2:x})',
      detail: 'float step(float edge, float x)',
      desc: 'Returns 0.0 if x < edge, else 1.0.',
    },
    {
      label: 'smoothstep',
      insert: 'smoothstep(${1:edge0}, ${2:edge1}, ${3:x})',
      detail: 'float smoothstep(edge0, edge1, x)',
      desc: 'Performs Hermite smooth interpolation scaling constraints.',
    },
    {
      label: 'length',
      insert: 'length(${1:x})',
      detail: 'float length(vec x)',
      desc: 'Calculates structural magnitude lengths for vector elements.',
    },
    {
      label: 'distance',
      insert: 'distance(${1:p0}, ${2:p1})',
      detail: 'float distance(vec p0, vec p1)',
      desc: 'Calculates absolute scalar distance gaps between matrix points.',
    },
    {
      label: 'dot',
      insert: 'dot(${1:x}, ${2:y})',
      detail: 'float dot(vec x, vec y)',
      desc: 'Calculates the vector dot product layout sequence matrix.',
    },
    {
      label: 'cross',
      insert: 'cross(${1:x}, ${2:y})',
      detail: 'vec3 cross(vec3 x, vec3 y)',
      desc: 'Calculates standard cross production orientation bounds.',
    },
    {
      label: 'normalize',
      insert: 'normalize(${1:x})',
      detail: 'vec normalize(vec x)',
      desc: 'Normalizes target vector matrix bounds into uniform unit length vectors.',
    },
    {
      label: 'reflect',
      insert: 'reflect(${1:I}, ${2:N})',
      detail: 'vec reflect(vec I, vec N)',
      desc: 'Calculates standard reflection directions for surface normals.',
    },
    {
      label: 'refract',
      insert: 'refract(${1:I}, ${2:N}, ${3:eta})',
      detail: 'vec refract(vec I, vec N, float eta)',
      desc: 'Calculates standard refraction vectors.',
    },
    {
      label: 'texture2D',
      insert: 'texture2D(${1:sampler}, ${2:coord})',
      detail: 'vec4 texture2D(sampler2D sampler, vec2 coord)',
      desc: 'Looks up a explicit pixel coordinate color vector map from sample canvases.',
    },
  ];

  public loadDependencies(onReady: () => void): void {
    if ((window as any).monaco) {
      onReady();
      return;
    }

    const loaderScript = document.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.src = '/assets/monaco/vs/loader.js';
    loaderScript.onload = () => {
      (window as any).require.config({ paths: { vs: '/assets/monaco/vs' } });
      this.ngZone.run(() => {
        (window as any).require(['vs/editor/editor.main'], () => {
          onReady();
        });
      });
    };
    document.body.appendChild(loaderScript);
  }

  public createEditor(
    container: HTMLElement,
    onSave: () => void,
    onMarkerChange: (errors: number, warnings: number) => void,
  ): any {
    const monaco = (window as any).monaco;

    this.registerGlslLanguageFeatures(monaco);

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2022,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      noEmit: true,
      strict: true,
      noImplicitAny: true,
      allowJs: true,
      checkJs: true,
    });

    const computedStyle = window.getComputedStyle(container);
    const background =
      computedStyle.getPropertyValue('--global-background-color').trim() ||
      '#0f111a';
    const foreground =
      computedStyle.getPropertyValue('--editor-panel-color').trim() ||
      '#a6accd';
    const accent =
      computedStyle.getPropertyValue('--editor-panel-H-color').trim() ||
      '#82aaff';
    const selection =
      computedStyle
        .getPropertyValue('--editor-icon-button-hover-background')
        .trim() || '#292d39';

    monaco.editor.defineTheme('omega-dynamic-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: foreground.replace('#', '') },
        {
          token: 'keyword',
          foreground: accent.replace('#', ''),
          fontStyle: 'bold',
        },
        { token: 'identifier', foreground: foreground.replace('#', '') },
        {
          token: 'preprocessor.omega',
          foreground: accent.replace('#', ''),
          fontStyle: 'bold',
        },
      ],
      colors: {
        'editor.background': background,
        'editor.foreground': foreground,
        'editor.lineHighlightBackground': '#22242d',
        'editorLineNumber.foreground': '#4e5579',
        'editorLineNumber.activeForeground': accent,
        'editor.selectionBackground': selection,
        'editor.inactiveSelectionBackground': selection,
        'scrollbarSlider.background': '#292d39',
        'scrollbarSlider.hoverBackground': '#717cb4',
        'scrollbarSlider.activeBackground': accent,
      },
    });

    this.editorInstance = monaco.editor.create(container, {
      theme: 'omega-dynamic-theme',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    });

    this.editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        onSave();
      },
    );

    monaco.editor.onDidChangeMarkers(() => {
      const currentModel = this.editorInstance.getModel();
      if (!currentModel) return;

      const markers = monaco.editor.getModelMarkers({
        resource: currentModel.uri,
      });
      const errors = markers.filter(
        (m: any) => m.severity === monaco.MarkerSeverity.Error,
      ).length;
      const warnings = markers.filter(
        (m: any) => m.severity === monaco.MarkerSeverity.Warning,
      ).length;
      onMarkerChange(errors, warnings);
    });

    return this.editorInstance;
  }

  private registerGlslLanguageFeatures(monaco: any): void {
    if (
      monaco.languages.getLanguages().some((lang: any) => lang.id === 'glsl')
    ) {
      return;
    }

    monaco.languages.register({ id: 'glsl' });

    monaco.languages.setMonarchTokensProvider('glsl', {
      keywords: [
        'attribute',
        'const',
        'uniform',
        'varying',
        'break',
        'continue',
        'do',
        'for',
        'while',
        'if',
        'else',
        'in',
        'out',
        'inout',
        'float',
        'int',
        'void',
        'bool',
        'true',
        'false',
        'lowp',
        'mediump',
        'highp',
        'precision',
        'invariant',
        'discard',
        'return',
        'mat2',
        'mat3',
        'mat4',
        'vec2',
        'vec3',
        'vec4',
        'ivec2',
        'ivec3',
        'ivec4',
        'bvec2',
        'bvec3',
        'bvec4',
        'sampler2D',
        'samplerCube',
        'struct',
      ],
      tokenizer: {
        root: [
          [
            /[a-zA-Z_]\w*/,
            {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier',
              },
            },
          ],
          [/@[A-Z_]+/, 'preprocessor.omega'],
          [/\/\/.*/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/[{}()\[\]]/, '@brackets'],
          [/[0-9]+/, 'number'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment'],
        ],
      },
    });

    // Register combined provider for custom preprocessor tags and built-in native functions
    monaco.languages.registerCompletionItemProvider('glsl', {
      provideCompletionItems: (model: any, position: any) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // 🎯 Path A: If typing a preprocessor trigger symbol, offer macro injection tokens
        if (textUntilPosition.trim().endsWith('@')) {
          const directiveSuggestions = Object.entries(
            MonacoService.SHADER_FUNCTIONS,
          ).map(([token, fileUri]) => ({
            label: token,
            kind: monaco.languages.CompletionItemKind.Interface,
            insertText: token,
            detail: `↳ Module Link: ${fileUri}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - 1, // Replaces typed '@' cleanly
              endColumn: position.column,
            },
          }));
          return { suggestions: directiveSuggestions };
        }

        // 🎯 Path B: Default code completion context, populate standard mathematical GLSL functions
        const glslSuggestions = MonacoService.NATIVE_GLSL_BUILTINS.map(
          (func) => ({
            label: func.label,
            kind: monaco.languages.CompletionItemKind.Function,
            // Snippet string format enabling quick Tab navigation parameter skips inside Monaco
            insertText: func.insert,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: func.detail,
            documentation: func.desc,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn:
                position.column -
                (textUntilPosition.match(/\w+$/)?.[0]?.length || 0),
              endColumn: position.column,
            },
          }),
        );

        return { suggestions: glslSuggestions };
      },
    });
  }

  public setModel(model: any): void {
    if (this.editorInstance) this.editorInstance.setModel(model);
  }

  public getModelValue(): string {
    return this.editorInstance?.getModel()?.getValue() || '';
  }

  public clearAllModelMarkers(source: string): void {
    const monaco = (window as any).monaco;
    const currentModel = this.editorInstance?.getModel();
    if (monaco && currentModel)
      monaco.editor.setModelMarkers(currentModel, source, []);
  }

  public setModelMarkers(source: string, errorMarkers: any[]): void {
    const monaco = (window as any).monaco;
    const currentModel = this.editorInstance?.getModel();
    if (monaco && currentModel)
      monaco.editor.setModelMarkers(currentModel, source, errorMarkers);
  }

  public createOrGetModel(
    path: string,
    content: string,
    language: string,
  ): any {
    const monaco = (window as any).monaco;
    const fileUri = monaco.Uri.parse(`file:///${path}`);
    let targetModel = monaco.editor.getModel(fileUri);

    if (!targetModel) {
      let langMapping = language?.toLowerCase();

      if (
        path.endsWith('.frag') ||
        path.endsWith('.vert') ||
        langMapping === 'frag' ||
        langMapping === 'vert'
      ) {
        langMapping = 'glsl';
      } else if (
        langMapping === 'ts' ||
        langMapping === 'typescript' ||
        !langMapping
      ) {
        langMapping = 'typescript';
      } else {
        langMapping = 'javascript';
      }

      targetModel = monaco.editor.createModel(content, langMapping, fileUri);
    }
    return targetModel;
  }

  public updateIntelliSenseDefinitions(
    filePath: string,
    declarationContent: string,
  ): void {
    const monaco = (window as any).monaco;
    if (!monaco) return;

    if (this.extraLibs.has(filePath)) {
      this.extraLibs.get(filePath).dispose();
      this.extraLibs.delete(filePath);
    }

    const libHandle =
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        declarationContent,
        filePath,
      );
    this.extraLibs.set(filePath, libHandle);
  }

  public isEditorReady(): boolean {
    return !!this.editorInstance;
  }

  public disposeEditor(): void {
    this.extraLibs.forEach((lib) => lib.dispose());
    this.extraLibs.clear();
    if (this.editorInstance) {
      this.editorInstance.dispose();
      this.editorInstance = null;
    }
  }
}
