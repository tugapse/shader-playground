// This file contains all the necessary uniforms, and functions
// for lighting and shadowing. It is designed to be included in a main fragment
// shader.

// Define the maximum number of lights to match your engine's setup
#define MAX_DIRECTIONAL_LIGHTS 1
#define MAX_POINT_LIGHTS 20
#define MAX_SPOT_LIGHTS 20

// Global uniforms needed for lighting and shadowing
uniform float u_specularStrength;
uniform float u_roughness;
uniform vec3 u_cameraPosition;
uniform float u_normalMapStrength;
uniform vec4 u_ambientLight;

uniform int u_useShadows;
uniform highp sampler2DShadow u_shadowMap; // Added precision qualifier
uniform vec2 u_shadowMapSize;


// Directional Light Uniforms
uniform int u_numDirectionalLights;
uniform vec3 u_directionalLightDirections[MAX_DIRECTIONAL_LIGHTS];
uniform vec3 u_directionalLightColors[MAX_DIRECTIONAL_LIGHTS];

// Point Light Uniforms
uniform int u_numPointLights;
uniform vec3 u_pointLightPositions[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightColors[MAX_POINT_LIGHTS];
uniform float u_pointLightConstantAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightLinearAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightQuadraticAtts[MAX_POINT_LIGHTS];

// Spot Light Uniforms
uniform int u_numSpotLights;
uniform vec3 u_spotLightPositions[MAX_SPOT_LIGHTS];
uniform vec3 u_spotLightDirections[MAX_SPOT_LIGHTS];
uniform vec3 u_spotLightColors[MAX_SPOT_LIGHTS];
uniform float u_spotLightInnerConeCos[MAX_SPOT_LIGHTS];
uniform float u_spotLightOuterConeCos[MAX_SPOT_LIGHTS];
uniform float u_spotLightConstantAtts[MAX_SPOT_LIGHTS];
uniform float u_spotLightLinearAtts[MAX_SPOT_LIGHTS];
uniform float u_spotLightQuadraticAtts[MAX_SPOT_LIGHTS];

float is_in_shadow_pcf(vec4 lightSpacePosition, vec3 finalNormal,
                       vec3 lightDir) {
  vec3 projCoords = lightSpacePosition.xyz / lightSpacePosition.w;
  projCoords = projCoords * 0.5 + 0.5;

  // Check bounds
  if (projCoords.z > 1.0 || u_useShadows == 0) {
    return 1.0;
  }

  float shadow = 0.0;
  vec2 texelSize = 1.0 / u_shadowMapSize;
  float bias = max(0.005 * (1.0 - dot(finalNormal, lightDir)), 0.0005);

  for (int x = -1; x <= 1; ++x) {
    for (int y = -1; y <= 1; ++y) {
      shadow += texture(u_shadowMap, vec3(projCoords.xy + vec2(x, y) * texelSize, projCoords.z - bias));
    }
  }
  return max(0.1, shadow / 9.0);
}

// This function calculates the final lit color, including shadows
vec3 calculateTotalLitColor(vec3 baseColor, vec2 uv) {

  // Apply normal mapping if a normal map is provided
  vec3 finalNormal;
  if (u_normalMapStrength > 0.0) {
    vec3 normalFromMap = texture(u_normalMap, uv).rgb;
    normalFromMap = normalFromMap * 2.0 - 1.0;
    mat3 tbnMatrix =
        mat3(normalize(v_tangent), normalize(v_bitangent), normalize(v_normal));
    vec3 perturbedNormal = tbnMatrix * normalFromMap;
    finalNormal = normalize(mix(normalize(v_normal), normalize(perturbedNormal),
                                u_normalMapStrength));
  } else {
    finalNormal = normalize(v_normal);
  }

  vec3 viewDir = normalize(u_cameraPosition - v_position);
  float clampedRoughness = clamp(u_roughness, 0.001, 0.999);
  float shininess = (2.0 / (1.0 - clampedRoughness)) - 2.0;

  // Start with ambient lighting
  vec3 totalLitColorRGB = u_ambientLight.rgb * baseColor;

  // Directional Lighting

  vec3 lightDir = normalize(u_directionalLightDirections[0]);
  float diffuseIntensity = max(dot(finalNormal, lightDir), 0.0);
  vec3 halfVec = normalize(lightDir + viewDir);
  float shadowFactor =
      is_in_shadow_pcf(v_lightSpacePosition, finalNormal, -lightDir);

  float specularIntensity =
      pow(max(0.0, dot(finalNormal, halfVec)), shininess) * u_specularStrength;
  totalLitColorRGB += (baseColor * u_directionalLightColors[0] *
                       (diffuseIntensity + specularIntensity)) *
                      shadowFactor;

  // Point Light Contributions
  for (int i = 0; i < u_numPointLights; ++i) {
    vec3 lightVecPoint = u_pointLightPositions[i] - v_position;
    float distancePoint = length(lightVecPoint);
    vec3 pointLightDir = normalize(lightVecPoint);
    float attenuationPoint =
        1.0 / (u_pointLightConstantAtts[i] +
               u_pointLightLinearAtts[i] * distancePoint +
               u_pointLightQuadraticAtts[i] * (distancePoint * distancePoint));
    float pointDiffuseIntensity = max(dot(finalNormal, pointLightDir), 0.0);
    vec3 halfVec = normalize(pointLightDir + viewDir);
    float pointSpecularIntensity =
        pow(max(0.0, dot(finalNormal, halfVec)), shininess) *
        u_specularStrength;
    totalLitColorRGB +=
        (baseColor * u_pointLightColors[i] *
         (pointDiffuseIntensity + pointSpecularIntensity) * attenuationPoint) *
        shadowFactor;
  }

  // Spot Light Contributions
  for (int i = 0; i < u_numSpotLights; ++i) {
    vec3 lightVecSpot = u_spotLightPositions[i] - v_position;
    float distanceSpot = length(lightVecSpot);
    float attenuationSpot =
        1.0 /
        (u_spotLightConstantAtts[i] + u_spotLightLinearAtts[i] * distanceSpot +
         u_spotLightQuadraticAtts[i] * (distanceSpot * distanceSpot));
    attenuationSpot = clamp(attenuationSpot, 0.0, 1.0);
    vec3 spotLightDirFromFrag = normalize(lightVecSpot);
    float angleCos = dot(spotLightDirFromFrag, -u_spotLightDirections[i]);
    float coneFactor = smoothstep(u_spotLightOuterConeCos[i],
                                  u_spotLightInnerConeCos[i], angleCos);
    coneFactor = clamp(coneFactor, 0.0, 1.0);
    float spotDiffuseIntensity =
        max(dot(finalNormal, spotLightDirFromFrag), 0.0);
    vec3 halfVec = normalize(spotLightDirFromFrag + viewDir);
    float spotSpecularIntensity =
        pow(max(0.0, dot(finalNormal, halfVec)), shininess) *
        u_specularStrength;
    totalLitColorRGB += (baseColor * u_spotLightColors[i] *
                         (spotDiffuseIntensity + spotSpecularIntensity) *
                         attenuationSpot * coneFactor) *
                        shadowFactor;
  }
  return totalLitColorRGB;
}
