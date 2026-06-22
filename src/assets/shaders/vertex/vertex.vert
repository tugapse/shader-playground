#version 300 es

// 1. THE NEW UBO BLOCK: This replaces individual camera uniforms
layout(std140) uniform CameraBlock {
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
};

// 2. WORLD UNIFORMS: Notice u_mvpMatrix and u_viewMatrix are gone from here
uniform mat4 u_worldMatrix;
uniform mat3 u_worldInverseTransposeMatrix;

// Animation uniforms (if used)
uniform float u_time;
uniform vec2 u_screenResolution;

// Light uniforms for shadow mapping
uniform mat4 u_lightMVPMatrix;
uniform float u_fogDistance;

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
out vec4 v_lightSpacePosition;
out float v_fogDistance;

void main() {
  // Standard vertex transformations
  vec4 worldPosition = u_worldMatrix * vec4(a_position, 1.0);
  
  // u_viewMatrix is now automatically pulled from the shared CameraBlock!
  vec4 viewPosition = u_viewMatrix * worldPosition;

  v_position = worldPosition.xyz;
  v_position_view = viewPosition.xyz;
  v_normal = u_worldInverseTransposeMatrix * a_normal;
  v_tangent = u_worldInverseTransposeMatrix * a_tangent;
  v_bitangent = u_worldInverseTransposeMatrix * a_bitangent;
  v_uv = a_uv;

  // Calculate the distance for fog (using true radial distance from the camera)
  v_fogDistance = length(viewPosition.xyz) + u_fogDistance;

  // Calculate the vertex position in light space and pass it to the fragment shader
  v_lightSpacePosition = u_lightMVPMatrix * vec4(a_position, 1.0);

  // 3. THE NEW MVP CALCULATION: 
  // We multiply the matrices in order (Projection * View * Model) directly in the shader
  gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * vec4(a_position, 1.0);
  gl_PointSize = 10.0;
}