
#version 300 es
precision mediump float;

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap;

uniform vec4 u_ambientLight;
uniform float u_normalMapStrength; // Controls the intensity of the normal map effect

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_position;
in vec3 v_tangent;
in vec3 v_bitangent;

out vec4 fragColor;

INCLUDE_LIGHT_FUNC


void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = sampledTexColor * u_matColor;

  vec3 normalFromMap = texture(u_normalMap, uv).rgb;
  normalFromMap = normalFromMap * 2.0 - 1.0;

  mat3 tbnMatrix = mat3(
    normalize(v_tangent),
    normalize(v_bitangent),
    normalize(v_normal)
  );

  vec3 perturbedNormal = tbnMatrix * normalFromMap;

  // Blending the original normal with the perturbed normal based on u_normalMapStrength
  vec3 finalNormal = normalize(mix(normalize(v_normal), normalize(perturbedNormal), u_normalMapStrength));

  // Calculate view direction and shininess for specular highlights
  vec3 viewDir = normalize(u_cameraPosition - v_position);
  float clampedRoughness = clamp(u_roughness, 0.001, 0.999);
  float shininess = (2.0 / (1.0 - clampedRoughness)) - 2.0;

  vec3 totalLitColorRGB = u_ambientLight.rgb * baseColor.rgb;

  // Calculate total contributions from each light type
  totalLitColorRGB += calculateTotalDirectionalLighting(finalNormal, viewDir, shininess, baseColor);
  totalLitColorRGB += calculateTotalPointLighting(v_position, finalNormal, viewDir, shininess, baseColor);
  totalLitColorRGB += calculateTotalSpotLighting(v_position, finalNormal, viewDir, shininess, baseColor);

  fragColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
}
