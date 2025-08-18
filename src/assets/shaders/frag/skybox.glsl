#version 300 es

precision mediump float;

// New uniform for the cubemap sampler
uniform samplerCube u_mainTex;

// The view direction from the camera to the vertex, typically passed from the vertex shader.
// This is crucial for sampling the cubemap correctly.
in vec3 v_viewDirection; // Changed from v_position, as view direction is better for sampling cubemaps

out vec4 fragColor;

void main() {
  // Sample the cubemap using the normalized view direction.
  // The texture() function for samplerCube takes a vec3.
  fragColor = texture(u_mainTex, normalize(v_viewDirection));
}
