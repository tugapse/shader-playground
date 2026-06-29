# Omega Editor

<p align="center">
  <a href="readme-assets/image.png" target="_blank">
    <img src="readme-assets/image.png" alt="Omega Editor Day Scene" width="400">
  </a>
  <a href="readme-assets/image1.png" target="_blank">
    <img src="readme-assets/image1.png" alt="Omega Editor Night Scene" width="400">
  </a>
</p>

**Omega Editor** is a web-based 2D/3D Game Engine and Editor built with Angular and WebGL. 

This is an ongoing personal project rather than a commercial product. I built it as a practical sandbox to apply and consolidate years of learning in Angular architecture, game systems design, and low-level engine development. While it is very much a work in progress, it already features a robust rendering pipeline supporting custom shaders, complex materials, dynamic lighting, and shadows. Beyond rendering, the editor provides deep visibility into the engine's state, allowing for live inspection of entities, components, and underlying engine code directly through the UI.

## 🌌 The Omega Ecosystem

Omega is designed with a strict separation of concerns, split across three primary pillars:

1. **Omega Editor (This Repository):** The Angular-driven user interface, inspector panels, and scene management tools.
2. **Omega Engine:** The core WebGL rendering and ECS logic. It is consumed by the editor as an npm package ([`omega-game-engine`](https://www.npmjs.com/package/omega-game-engine)).
3. **Omega API:** The backend service required for advanced local operations. Available at [`tugapse/omega-api`](https://github.com/tugapse/omega-api).

## ✨ Key Features

* **Entity-Component-System (ECS) & Live Inspection:** Granular control over entities through a modular behavior system. The editor interface allows for real-time inspection and modification of entities, attached components, and raw engine code.
* **Advanced WebGL Rendering:** Full support for custom shaders, complex material properties, dynamic lighting (ambient, directional, spot), and real-time shadow mapping.
* **Custom User Logic & Scripting:** The engine is fully capable of handling and executing user-created code. The advanced day/night cycle pipeline shown in the screenshots (with configurable moon phases and shadow transitions) is just one example of a custom behavior running live in the engine.
* **Professional Editor Tooling:**
  * Interactive 3D transform gizmos (Translation, Rotation, Scaling).
  * Real-time performance profiling (FPS, Update, Render, and Idle ms tracking).
  * Integrated asset and project management.
  * UI theming support (e.g., "Autumn Rust" and "Default").

---

## 🚀 Getting Started

> **⚠️ WIP Notice:** A unified build script is currently in development to automate this setup process prior to the official release. For now, please follow the manual steps below.

To run the Omega Editor locally, you must also have the Omega API running.

### 1. Setup the API
Clone and run the API service:

```bash
git clone [https://github.com/tugapse/omega-api.git](https://github.com/tugapse/omega-api.git)
# Follow the setup instructions in the omega-api repository
```

### 2. Setup the Editor
Once the API is running, clone this repository and install the dependencies (this will automatically pull in the `omega-game-engine` npm package).

```bash
git clone [https://github.com/tugapse/omega-editor.git](https://github.com/tugapse/omega-editor.git)
cd omega-editor
npm install
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

---

## 🛠 Angular CLI Reference

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.3.

* **Code scaffolding:** Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.
* **Building:** Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
* **Running unit tests:** Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
* **Running end-to-end tests:** Run `ng e2e` to execute the end-to-end tests via a platform of your choice.

For more information on using the Angular CLI, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.