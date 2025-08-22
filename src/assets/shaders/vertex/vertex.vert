#version 300 es

uniform mat4 u_mvpMatrix;
uniform mat4 u_worldMatrix;
uniform mat3 u_worldInverseTransposeMatrix;

uniform float u_time;
uniform vec2 u_screenResolution;

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;
// New attributes for normal mapping
in vec3 a_tangent;
in vec3 a_bitangent;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_position;
// New outputs for normal mapping - transformed to world space
out vec3 v_tangent;
out vec3 v_bitangent;

void main() {
  // Transform position to world space for lighting calculations in fragment shader
  // This is crucial for point and spot lights, which need the fragment's world position
  v_position = (u_worldMatrix * vec4(a_position, 1.0)).xyz;

  // Transform the normal, tangent, and bitangent vectors into world space.
  // The world inverse transpose matrix ensures correct transformation even with non-uniform scaling.
  // Normalizing after transformation is good practice as interpolation can denormalize vectors.
  v_normal = normalize(u_worldInverseTransposeMatrix * a_normal);
  v_tangent = normalize(u_worldInverseTransposeMatrix * a_tangent);
  v_bitangent = normalize(u_worldInverseTransposeMatrix * a_bitangent);

  // Pass UV coordinates directly
  v_uv = a_uv;

  // Calculate the final vertex position in clip space
  gl_Position =  u_mvpMatrix * vec4(a_position, 1.0);
}
