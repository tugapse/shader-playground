#version 300 es
precision mediump float;

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap; // Uniform for the normal map texture

@INCLUDE_LIGHT_HEADER

in vec2 v_uv;
in vec3 v_normal;   // Interpolated normal (from vertex shader)
in vec3 v_position; // Crucial for point and spot lights: fragment's world position
// Tangent and Bitangent vectors from the vertex shader for TBN matrix
in vec3 v_tangent;
in vec3 v_bitangent;

out vec4 fragColor;

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = sampledTexColor * u_matColor;


@INCLUDE_LIGHT_FUNC

  // --- Final Color Output ---
  // Clamp the final lit color to the [0.0, 1.0] range before outputting.
  fragColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
}
