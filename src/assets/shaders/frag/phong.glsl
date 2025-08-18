#version 300 es
precision mediump float;

#define MAX_DIRECTIONAL_LIGHTS 5 // Max number of directional lights
#define MAX_POINT_LIGHTS 20       // Max number of point lights
#define MAX_SPOT_LIGHTS 20        // Max number of spot lights

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap; // Uniform for the normal map texture

// New uniforms for specular lighting and roughness
uniform float u_specularStrength; // Controls the intensity/brightness of the specular highlight
uniform float u_roughness;        // Controls the size/blurriness of the specular highlight (0.0 = very smooth, 1.0 = very rough)
uniform vec3 u_cameraPosition;    // World position of the camera/viewer

// New uniform for normal map strength
uniform float u_normalMapStrength; // Controls the intensity of the normal map effect (0.0 = no effect, 1.0 = full effect)

uniform vec4 u_ambientLight; // Ambient light color

// Uniforms for multiple Directional Lights:
uniform int u_numDirectionalLights;
uniform vec3 u_directionalLightDirections[MAX_DIRECTIONAL_LIGHTS];
uniform vec3 u_directionalLightColors[MAX_DIRECTIONAL_LIGHTS];

// Uniforms for multiple Point Lights:
uniform int u_numPointLights;
uniform vec3 u_pointLightPositions[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightColors[MAX_POINT_LIGHTS];
uniform float u_pointLightConstantAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightLinearAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightQuadraticAtts[MAX_POINT_LIGHTS];

// Uniforms for multiple Spot Lights:
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

  // Normal maps store vectors with components in [0, 1] range, centered at 0.5 (representing 0).
  vec3 normalFromMap = texture(u_normalMap, uv).rgb;
  normalFromMap = normalFromMap * 2.0 - 1.0; // Remap to [-1, 1] range

  // These vectors (v_tangent, v_bitangent, v_normal) are already in world space from the vertex shader.
  // The matrix transforms a vector from tangent space (normal map's space) to world space.
  mat3 tbnMatrix = mat3(
    normalize(v_tangent),    // Tangent vector (X-axis of tangent space)
    normalize(v_bitangent),  // Bitangent vector (Y-axis of tangent space)
    normalize(v_normal)      // Normal vector (Z-axis of tangent space)
  );

  vec3 perturbedNormal = tbnMatrix * normalFromMap;

  vec3 finalNormal = normalize(mix(normalize(v_normal), normalize(perturbedNormal), u_normalMapStrength));

  vec3 viewDir = normalize(u_cameraPosition - v_position);
  float clampedRoughness = clamp(u_roughness, 0.001, 0.999); // Avoid exactly 0 or 1
  float shininess = (2.0 / (1.0 - clampedRoughness)) - 2.0;


  // --- Ambient Lighting Contribution ---
  vec3 totalLitColorRGB = u_ambientLight.rgb * baseColor.rgb;

  // --- Directional Lighting Contributions ---
  for (int i = 0; i < u_numDirectionalLights; ++i) {
    vec3 lightDir = normalize(u_directionalLightDirections[i]);

    // Diffuse component (Lambertian)
    float diffuseIntensity = max(dot(finalNormal, lightDir), 0.0);

    // Specular component (Blinn-Phong)
    vec3 halfVec = normalize(lightDir + viewDir); // Halfway vector
    float specularIntensity = pow(max(0.0, dot(finalNormal, halfVec)), shininess) * u_specularStrength;

    // Add both diffuse and specular contributions
    totalLitColorRGB += (baseColor.rgb * u_directionalLightColors[i] * (diffuseIntensity + specularIntensity));
  }

  // --- Point Light Contributions ---
  for (int i = 0; i < u_numPointLights; ++i) {
    vec3 lightVecPoint = u_pointLightPositions[i] - v_position;
    float distancePoint = length(lightVecPoint);
    vec3 pointLightDir = normalize(lightVecPoint);

    float attenuationPoint = 1.0 / (
      u_pointLightConstantAtts[i] +
      u_pointLightLinearAtts[i] * distancePoint +
      u_pointLightQuadraticAtts[i] * (distancePoint * distancePoint)
    );
    attenuationPoint = clamp(attenuationPoint, 0.0, 1.0); // Clamp to prevent brightening very close

    // Diffuse component
    float pointDiffuseIntensity = max(dot(finalNormal, pointLightDir), 0.0);

    // Specular component
    vec3 halfVec = normalize(pointLightDir + viewDir); // Halfway vector
    float pointSpecularIntensity = pow(max(0.0, dot(finalNormal, halfVec)), shininess) * u_specularStrength;

    // Add both diffuse and specular contributions, applying attenuation
    totalLitColorRGB += (baseColor.rgb * u_pointLightColors[i] * (pointDiffuseIntensity + pointSpecularIntensity) * attenuationPoint);
  }

  // --- Spot Light Contributions ---
  for (int i = 0; i < u_numSpotLights; ++i) {
    vec3 lightVecSpot = u_spotLightPositions[i] - v_position;
    float distanceSpot = length(lightVecSpot);
    float attenuationSpot = 1.0 / (
      u_spotLightConstantAtts[i] +
      u_spotLightLinearAtts[i] * distanceSpot +
      u_spotLightQuadraticAtts[i] * (distanceSpot * distanceSpot)
    );
    attenuationSpot = clamp(attenuationSpot, 0.0, 1.0);

    vec3 spotLightDirFromFrag = normalize(lightVecSpot); // Direction FROM fragment TO spot light
    float angleCos = dot(spotLightDirFromFrag, -u_spotLightDirections[i]);

    float coneFactor = smoothstep(u_spotLightOuterConeCos[i], u_spotLightInnerConeCos[i], angleCos);
    coneFactor = clamp(coneFactor, 0.0, 1.0); // Ensure coneFactor is valid

    // Diffuse component
    float spotDiffuseIntensity = max(dot(finalNormal, spotLightDirFromFrag), 0.0);

    // Specular component
    vec3 halfVec = normalize(spotLightDirFromFrag + viewDir); // Halfway vector
    float spotSpecularIntensity = pow(max(0.0, dot(finalNormal, halfVec)), shininess) * u_specularStrength;

    // Add both diffuse and specular contributions, applying attenuation and cone factor
    totalLitColorRGB += (baseColor.rgb * u_spotLightColors[i] * (spotDiffuseIntensity + spotSpecularIntensity) * attenuationSpot * coneFactor);
  }

  // --- Final Color Output ---
  // Clamp the final lit color to the [0.0, 1.0] range before outputting.
  fragColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
}
