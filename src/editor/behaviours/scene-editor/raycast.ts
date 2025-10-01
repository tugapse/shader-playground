import { mat4, vec3, vec4 } from "gl-matrix";
import { Camera, CanvasViewport, Mouse } from "omega-game-engine";

export class Raycast {

  public static screenPointToRay(camera: Camera, game: { webgl: WebGL2RenderingContext }): vec3 {
    const canvas = game.webgl.canvas;
    const x = (Mouse.mousePosition.x / CanvasViewport.rendererWidth) * 2 - 1;
    const y = 1 - (Mouse.mousePosition.y / CanvasViewport.rendererHeight) * 2;

    const clipCoords = vec4.fromValues(x, y, -1.0, 1.0);

    const invProj = mat4.create();
    mat4.invert(invProj, camera.projectionMatrix);
    const eyeCoords = vec4.create();
    vec4.transformMat4(eyeCoords, clipCoords, invProj);
    eyeCoords[2] = -1.0;
    eyeCoords[3] = 0.0;

    const invView = mat4.create();
    mat4.invert(invView, camera.viewMatrix);
    const worldCoords = vec4.create();
    vec4.transformMat4(worldCoords, eyeCoords, invView);

    const ray = vec3.fromValues(worldCoords[0], worldCoords[1], worldCoords[2]);
    vec3.normalize(ray, ray);

    return ray;
  }

  public static intersectRayWithPlane(rayOrigin: vec3, rayDirection: vec3, planeOrigin: vec3, planeNormal: vec3): vec3 | null {
    const denominator = vec3.dot(rayDirection, planeNormal);
    if (Math.abs(denominator) > 0.0001) {
      const t = vec3.dot(vec3.subtract(vec3.create(), planeOrigin, rayOrigin), planeNormal) / denominator;
      const intersectionPoint = vec3.scaleAndAdd(vec3.create(), rayOrigin, rayDirection, t);
      return intersectionPoint;
    }
    return null;
  }
}
