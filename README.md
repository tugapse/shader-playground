# Omega Editor

<p align="center">
  <a href="readme-assets/image.png" target="_blank">
    <img src="readme-assets/image.png" alt="Omega Editor Day Scene" width="400">
  </a>
  <a href="readme-assets/image1.png" target="_blank">
    <img src="readme-assets/image1.png" alt="Omega Editor Night Scene" width="400">
  </a>
</p>

**Omega Editor** is a comprehensive, web-based 2D/3D Game Engine and Editor. Built with Angular and WebGL, it provides a highly structured environment for real-time scene manipulation, entity management, and dynamic rendering. 

This project began as a dedicated space to apply and consolidate years of full-stack architectural learning, rendering math, and engine design into a unified, professional-grade toolset.

## 🌌 The Omega Ecosystem

Omega is designed with a strict separation of concerns, split across three primary pillars:

1. **Omega Editor (This Repository):** The complex Angular-driven user interface, inspector panels, and scene management tools.
2. **Omega Engine:** The core WebGL rendering and ECS logic. It is consumed by the editor as an npm package ([`omega-game-engine`](https://www.npmjs.com/package/omega-game-engine)).
3. **Omega API:** The backend service required for advanced local operations. Available at [`tugapse/omega-api`](https://github.com/tugapse/omega-api).

## ✨ Key Features

* **Entity-Component-System (ECS):** Granular control over entities through a modular behavior system (e.g., `SunBehaviour`).
* **Professional Editor Tooling:**
  * Interactive 3D transform gizmos (Translation, Rotation, Scaling).
  * Real-time performance profiling (FPS, Update, Render, and Idle ms tracking).
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