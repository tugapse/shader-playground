#version 300 es
precision mediump float;

#define MAX_DIRECTIONAL_LIGHTS 5 // Max number of directional lights
#define MAX_POINT_LIGHTS 20       // Max number of point lights
#define MAX_SPOT_LIGHTS 20        // Max number of spot lights

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap; // New: Uniform for the normal map texture



in vec2 v_uv;
in vec3 v_normal; // Interpolated normal (from vertex shader)
in vec3 v_position; // Crucial for point and spot lights: fragment's world position
// New: Tangent and Bitangent vectors from the vertex shader for TBN matrix
in vec3 v_tangent;
in vec3 v_bitangent;

out vec4 fragColor;

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = sampledTexColor * u_matColor;


  fragColor = vec4(uv,0,1);
  // fragColor = vec4(v_normal,1);
  // fragColor = vec4(v_bitangent,1);
  // fragColor = vec4(v_tangent * 0.5 + 0.5, 1.0);
  // fragColor = vec4(v_bitangent * 0.5 + 0.5, 1.0);

}
