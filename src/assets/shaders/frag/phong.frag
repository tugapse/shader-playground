#version 300 es
precision highp float;

uniform int u_fogEnabled;
uniform vec3 u_FogColor;
uniform float u_FogDensity;

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap;
uniform float u_emmission;
uniform float u_id;
uniform float u_sid;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_position;
in vec3 v_tangent;
in vec3 v_bitangent;
in vec4 v_lightSpacePosition;
in float v_fogDistance;

out vec4 fragColor;

// All lighting uniforms and functions;
@INCLUDE_LIGHT_FUNC
@INCLUDE_FUNC

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;
  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = vec4(sampledTexColor.rgb * u_matColor.rgb, (u_matColor.a * sampledTexColor.a));

  vec3 totalLitColorRGB = calculateTotalLitColor(baseColor.rgb, uv);

  vec4 finalColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
  vec3 foggedRGB = finalColor.rgb;

  if (u_fogEnabled == 1) {
    foggedRGB = applyExponentialFog(finalColor.rgb, u_FogColor, v_fogDistance, u_FogDensity);
  }
  fragColor = vec4(foggedRGB, finalColor.a);
}
