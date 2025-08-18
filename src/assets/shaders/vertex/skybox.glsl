#version 300 es

// Define default precision for floats.
// `highp` is typically used in vertex shaders for better precision in calculations.
precision highp float;

// The Model-View-Projection matrix, with the camera's translation removed from its view component.
// This is key for making the skybox appear infinitely far away and only rotate with the camera.
uniform mat4 u_mvpMatrix;

// Only the position attribute is needed for a skybox cube.
// These positions will also serve as our sampling direction for the cubemap.
in vec3 a_position;

// Output to the fragment shader. This `vec3` represents the direction from the camera
// to the point on the skybox, which is used to sample the cubemap texture.
out vec3 v_viewDirection;

void main() {
  // Calculate the final vertex position in clip space.
  // We use the `u_mvpMatrix` which, for the skybox, will have its camera-translation component
  // zeroed out on the CPU side. This ensures the skybox remains centered on the camera.
  // gl_Position is a built-in output variable for the vertex shader and takes a vec4.
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);

  // For skybox rendering, the local vertex position `a_position` itself can be used
  // as the direction vector for cubemap lookup. This is because the skybox cube
  // is effectively rendered around the camera's origin, and its vertices point
  // outwards in the directions corresponding to the environment.
  v_viewDirection = a_position;
}
