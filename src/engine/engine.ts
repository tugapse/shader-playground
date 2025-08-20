import { RenderMeshBehaviour } from "./behaviours/renderer/render-mesh-behaviour";
import { SkyboxRenderer } from "./behaviours/renderer/skybox-renderer";
import { MeshData } from "./core/mesh";
import { Camera } from "./entities/camera";
import { GlEntity } from "./entities/entity";
import { Light, PointLight, SpotLight, DirectionalLight } from "./entities/light";
import { SceneManager } from "./entities/scene-manager";
import { ColorMaterial } from "./materials/color-material";
import { CubemapMaterial } from "./materials/cubemap-material";
import { LitMaterial } from "./materials/lit-material";
import { UnlitMaterial } from "./materials/unlit-material";
import { CubePrimitive } from "./primitives/cube-primitive";
import { QuadPrimitive } from "./primitives/quad-primitive";
import { SkyboxPrimitive } from "./primitives/skybox-primitive";
import { SpherePrimitive } from "./primitives/sphere-primitive";
import { TrianglePrimitive } from "./primitives/triangle-primitive";
import { LitShader } from "./shaders/lit-shader";
import { Shader } from "./shaders/shader";
import { SkyboxShader } from "./shaders/skybox-shader";
import { UnlitShader } from "./shaders/unlit-shader";

export function registerDependencies() {

  // Entities
  SceneManager.addDependency(GlEntity.name, GlEntity.instanciate)
  SceneManager.addDependency(Camera.name, Camera.instanciate);
  SceneManager.addDependency(Light.name, Light.instanciate);
  SceneManager.addDependency(PointLight.name, PointLight.instanciate);
  SceneManager.addDependency(SpotLight.name, SpotLight.instanciate);
  SceneManager.addDependency(DirectionalLight.name, DirectionalLight.instanciate);

  // Geometry
  SceneManager.addDependency(MeshData.name, MeshData.instanciate);
  SceneManager.addDependency(CubePrimitive.name, CubePrimitive.instanciate);
  SceneManager.addDependency(QuadPrimitive.name, QuadPrimitive.instanciate);
  SceneManager.addDependency(SpherePrimitive.name, SpherePrimitive.instanciate);
  SceneManager.addDependency(SkyboxPrimitive.name, SkyboxPrimitive.instanciate);
  SceneManager.addDependency(TrianglePrimitive.name, TrianglePrimitive.instanciate);

  // shaders
  SceneManager.addDependency(Shader.name, Shader.instanciate)
  SceneManager.addDependency(SkyboxShader.name, SkyboxShader.instanciate)
  SceneManager.addDependency(UnlitShader.name, UnlitShader.instanciate)
  SceneManager.addDependency(LitShader.name, LitShader.instanciate)

  SceneManager.addDependency(RenderMeshBehaviour.name, RenderMeshBehaviour.instanciate)
  SceneManager.addDependency(SkyboxRenderer.name, SkyboxRenderer.instanciate)
  // SceneManager.addDependency(Shader.name, Shader.instanciate)
  // SceneManager.addDependency(Shader.name, Shader.instanciate)

  SceneManager.addDependency(ColorMaterial.name, ColorMaterial.instanciate)
  SceneManager.addDependency(UnlitMaterial.name, UnlitMaterial.instanciate)
  SceneManager.addDependency(LitMaterial.name, LitMaterial.instanciate)
  SceneManager.addDependency(CubemapMaterial.name, CubemapMaterial.instanciate)

}
