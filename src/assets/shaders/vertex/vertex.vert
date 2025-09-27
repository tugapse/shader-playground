#version 300 es

// Camera and world uniforms
uniform mat4 u_mvpMatrix;
uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat3 u_worldInverseTransposeMatrix;

// Animation uniforms (if used)
uniform float u_time;
uniform vec2 u_screenResolution;

// Light uniforms for shadow mapping
uniform mat4 u_lightMVPMatrix; // The light's combined view-projection matrix

// Input attributes from your mesh
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;
in vec3 a_tangent;
in vec3 a_bitangent;

// Outputs to the fragment shader
out vec2 v_uv;
out vec3 v_normal;
out vec3 v_position;
out vec3 v_position_view;
out vec3 v_tangent;
out vec3 v_bitangent;
out vec4 v_lightSpacePosition; // <-- This is the new varying you need to declare

void main() {
  // Standard vertex transformations
  v_position = (u_worldMatrix * vec4(a_position, 1.0)).xyz;
  v_position_view = (u_viewMatrix * u_worldMatrix * vec4(a_position, 1.0)).xyz;
  v_normal = u_worldInverseTransposeMatrix * a_normal;
  v_tangent = u_worldInverseTransposeMatrix * a_tangent;
  v_bitangent = u_worldInverseTransposeMatrix * a_bitangent;
  v_uv = a_uv;

  // Calculate the vertex position in light space and pass it to the fragment shader
  v_lightSpacePosition = u_lightMVPMatrix * vec4(a_position, 1.0);

  // Final position for rendering to the screen
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
  gl_PointSize = 10.0;
}
