// This file contains all the necessary uniforms, and functions
// for lighting and shadowing. It is designed to be included in a main fragment
// shader.

// Define the maximum number of lights to match your engine's setup
#define MAX_DIRECTIONAL_LIGHTS 5
#define MAX_POINT_LIGHTS 20
#define MAX_SPOT_LIGHTS 20

// Global uniforms needed for lighting and shadowing
uniform float u_specularStrength;
uniform float u_roughness;
uniform vec3 u_cameraPosition;
uniform float u_normalMapStrength;
uniform vec4 u_ambientLight;

uniform int u_useShadows;
uniform float u_shadowStrength;
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

float is_in_shadow_pcf(vec4 lightSpacePosition, vec3 finalNormal, vec3 lightDir) {
  vec3 projCoords = lightSpacePosition.xyz / lightSpacePosition.w;
  projCoords = projCoords * 0.5 + 0.5;

  // Check bounds
  if (projCoords.z > 1.0 || u_useShadows == 0) {
    return 1.0;
  }

  float cells = 1.0; // Reduced from 2.0 (5x5) to 1.0 (3x3) for performance (9 vs 25 samples)
  float total = cells * 2.0 + 1.0;

  float shadow = 0.0;
  vec2 texelSize = 1.0 / u_shadowMapSize;
  float bias = max(0.001 * (1.0 - dot(finalNormal, lightDir)), 0.0005);

  for (float x = -cells; x <= cells; ++x) {
    for (float y = -cells; y <= cells; ++y) {
      shadow += texture(u_shadowMap, vec3(projCoords.xy + vec2(x, y) * texelSize, projCoords.z - bias));
    }
  }
  float shadowFactor = max(0.05, shadow / (total*total));
  return mix(1.0, shadowFactor, u_shadowStrength);
}

vec3 getFinalNormal(vec2 uv) {
    vec3 n = normalize(v_normal);
    if (u_normalMapStrength > 0.0) {
        vec3 normalFromMap = texture(u_normalMap, uv).rgb * 2.0 - 1.0;
        mat3 tbnMatrix = mat3(normalize(v_tangent), normalize(v_bitangent), n);
        vec3 perturbedNormal = tbnMatrix * normalFromMap;
        return normalize(mix(n, normalize(perturbedNormal), u_normalMapStrength));
    }
    return n;
}

vec2 calculateBlinnPhong(vec3 lightDir, vec3 viewDir, vec3 normal, float shininess) {
    float diffuseIntensity = max(dot(normal, lightDir), 0.0);
    float specularIntensity = 0.0;
    if (diffuseIntensity > 0.0) {
        vec3 halfVec = normalize(lightDir + viewDir);
        specularIntensity = pow(max(0.0, dot(normal, halfVec)), shininess) * u_specularStrength;
    }
    return vec2(diffuseIntensity, specularIntensity);
}

vec3 applyDirectionalLight(int index, vec3 baseColor, vec3 viewDir, vec3 normal, float shininess) {
    vec3 lightDir = normalize(-u_directionalLightDirections[index]);
    vec2 intensities = calculateBlinnPhong(lightDir, viewDir, normal, shininess);
    
    if (intensities.x <= 0.0) return vec3(0.0);

    float shadowFactor = 1.0;
    if (index == 0) { // Only first directional light casts shadows
        shadowFactor = is_in_shadow_pcf(v_lightSpacePosition, normal, lightDir);
    }

    vec3 diffuse = baseColor * intensities.x;
    vec3 specular = vec3(1.0) * intensities.y;
    return (diffuse + specular) * u_directionalLightColors[index] * shadowFactor;
}

vec3 applyPointLight(int index, vec3 baseColor, vec3 viewDir, vec3 normal, float shininess) {
    vec3 lightVec = u_pointLightPositions[index] - v_position;
    vec3 lightDir = normalize(lightVec);

    vec2 intensities = calculateBlinnPhong(lightDir, viewDir, normal, shininess);
    if (intensities.x <= 0.0) return vec3(0.0);

    float distance = length(lightVec);
    float attenuation = 1.0 / (u_pointLightConstantAtts[index] +
                               u_pointLightLinearAtts[index] * distance +
                               u_pointLightQuadraticAtts[index] * (distance * distance));

    vec3 diffuse = baseColor * intensities.x;
    vec3 specular = vec3(1.0) * intensities.y;

    return (diffuse + specular) * u_pointLightColors[index] * attenuation;
}

vec3 applySpotLight(int index, vec3 baseColor, vec3 viewDir, vec3 normal, float shininess) {
    vec3 lightVec = u_spotLightPositions[index] - v_position;
    vec3 lightDir = normalize(lightVec);

    vec2 intensities = calculateBlinnPhong(lightDir, viewDir, normal, shininess);
    if (intensities.x <= 0.0) return vec3(0.0);

    float angleCos = dot(lightDir, -u_spotLightDirections[index]);
    float coneFactor = smoothstep(u_spotLightOuterConeCos[index], u_spotLightInnerConeCos[index], angleCos);
    
    if (coneFactor <= 0.0) return vec3(0.0);

    float distance = length(lightVec);
    float attenuation = 1.0 / (u_spotLightConstantAtts[index] +
                               u_spotLightLinearAtts[index] * distance +
                               u_spotLightQuadraticAtts[index] * (distance * distance));
    
    vec3 diffuse = baseColor * intensities.x;
    vec3 specular = vec3(1.0) * intensities.y;

    return (diffuse + specular) * u_spotLightColors[index] * attenuation * coneFactor;
}

// This function calculates the final lit color, including shadows
vec3 calculateTotalLitColor(vec3 baseColor, vec2 uv) {
  vec3 finalNormal = getFinalNormal(uv);
  vec3 viewDir = normalize(u_cameraPosition - v_position);
  float shininess = (2.0 / (1.0 - clamp(u_roughness, 0.001, 0.999))) - 2.0;

  // Start with ambient lighting
  vec3 totalLitColorRGB = u_ambientLight.rgb * baseColor;

  // Directional Lighting
  for (int i = 0; i < u_numDirectionalLights; ++i) {
    totalLitColorRGB += applyDirectionalLight(i, baseColor, viewDir, finalNormal, shininess);
  }

  // Point Light Contributions
  for (int i = 0; i < u_numPointLights; ++i) {
    totalLitColorRGB += applyPointLight(i, baseColor, viewDir, finalNormal, shininess);
  }

  // Spot Light Contributions
  for (int i = 0; i < u_numSpotLights; ++i) {
    totalLitColorRGB += applySpotLight(i, baseColor, viewDir, finalNormal, shininess);
  }
  return totalLitColorRGB;
}
