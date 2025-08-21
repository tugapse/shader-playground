#version 300 es
precision mediump float;

#define MAX_DIRECTIONAL_LIGHTS 5
#define MAX_POINT_LIGHTS 20
#define MAX_SPOT_LIGHTS 20

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap;

uniform vec4 u_ambientLight;

uniform int u_numDirectionalLights;
uniform vec3 u_directionalLightDirections[MAX_DIRECTIONAL_LIGHTS];
uniform vec3 u_directionalLightColors[MAX_DIRECTIONAL_LIGHTS];

uniform int u_numPointLights;
uniform vec3 u_pointLightPositions[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightColors[MAX_POINT_LIGHTS];
uniform float u_pointLightConstantAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightLinearAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightQuadraticAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightRadii[MAX_POINT_LIGHTS];

uniform int u_numSpotLights;
uniform vec3 u_spotLightPositions[MAX_SPOT_LIGHTS];
uniform vec3 u_spotLightDirections[MAX_SPOT_LIGHTS];
uniform vec3 u_spotLightColors[MAX_SPOT_LIGHTS];
uniform float u_spotLightInnerConeCos[MAX_SPOT_LIGHTS];
uniform float u_spotLightOuterConeCos[MAX_SPOT_LIGHTS];
uniform float u_spotLightConstantAtts[MAX_SPOT_LIGHTS];
uniform float u_spotLightLinearAtts[MAX_SPOT_LIGHTS];
uniform float u_spotLightQuadraticAtts[MAX_SPOT_LIGHTS];


in vec2 v_uv;
in vec3 v_normal;
in vec3 v_position;
in vec3 v_tangent;
in vec3 v_bitangent;

out vec4 fragColor;

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

  vec3 blendedNormal = mix(normalize(v_normal), normalize(perturbedNormal), 0.8);

  vec3 finalNormal = normalize(blendedNormal);


  vec3 totalLitColorRGB = u_ambientLight.rgb * baseColor.rgb;

  for (int i = 0; i < u_numDirectionalLights; ++i) {
    vec3 lightDir = normalize(u_directionalLightDirections[i]);
    float diffuseIntensity = max(dot(finalNormal, lightDir), 0.0);
    totalLitColorRGB += (baseColor.rgb * u_directionalLightColors[i] * diffuseIntensity);
  }

  for (int i = 0; i < u_numPointLights; ++i) {
    vec3 lightVecPoint = u_pointLightPositions[i] - v_position;
    float distancePoint = length(lightVecPoint);
    vec3 pointLightDir = normalize(lightVecPoint);

    float rangeFactor = 1.0 - smoothstep(
      0.8 * u_pointLightRadii[i],
      u_pointLightRadii[i],
      distancePoint
    );

    if (rangeFactor == 0.0) {
      continue;
    }

    float pointDiffuseIntensity = max(dot(finalNormal, pointLightDir), 0.0);

    float attenuationPoint = 1.0 / (
      u_pointLightConstantAtts[i] +
      u_pointLightLinearAtts[i] * distancePoint +
      u_pointLightQuadraticAtts[i] * (distancePoint * distancePoint)
    );
    attenuationPoint = clamp(attenuationPoint, 0.0, 1.0);

    totalLitColorRGB += (baseColor.rgb * u_pointLightColors[i] * pointDiffuseIntensity * attenuationPoint * rangeFactor);
  }

  for (int i = 0; i < u_numSpotLights; ++i) {
    vec3 lightVecSpot = u_spotLightPositions[i] - v_position;
    float distanceSpot = length(lightVecSpot);
    float attenuationSpot = 1.0 / (
      u_spotLightConstantAtts[i] +
      u_spotLightLinearAtts[i] * distanceSpot +
      u_spotLightQuadraticAtts[i] * (distanceSpot * distanceSpot)
    );
    attenuationSpot = clamp(attenuationSpot, 0.0, 1.0);

    vec3 spotLightDirFromFrag = normalize(lightVecSpot);
    float angleCos = dot(spotLightDirFromFrag, -u_spotLightDirections[i]);

    float coneFactor = smoothstep(u_spotLightOuterConeCos[i], u_spotLightInnerConeCos[i], angleCos);

    float spotDiffuseIntensity = max(dot(finalNormal, spotLightDirFromFrag), 0.0);

    totalLitColorRGB += (baseColor.rgb * u_spotLightColors[i] * spotDiffuseIntensity * attenuationSpot * coneFactor);
  }

  fragColor = vec4(totalLitColorRGB, baseColor.a);
}
