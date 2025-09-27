#version 300 es

// This is the only uniform required for the shadow pass.
// It's the combined Model-View-Projection matrix from the light's perspective.
uniform mat4 u_mvpMatrix;

// The only input attribute needed is the vertex position.
layout (location = 0) in vec3 a_position;

void main() {
  // Transform the vertex position directly using the light's MVP matrix.
  // This projects the vertex into clip space for the light.
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}
