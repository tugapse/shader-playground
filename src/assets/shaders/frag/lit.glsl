#version 300 es
precision mediump float;

#define MAX_DIRECTIONAL_LIGHTS 5 // Max number of directional lights
#define MAX_POINT_LIGHTS 20       // Max number of point lights
#define MAX_SPOT_LIGHTS 20        // Max number of spot lights

uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;

uniform vec4 u_ambientLight; // Ambient light color

// Uniforms for multiple Directional Lights:
uniform int u_numDirectionalLights;
uniform vec3 u_directionalLightDirections[MAX_DIRECTIONAL_LIGHTS];
uniform vec3 u_directionalLightColors[MAX_DIRECTIONAL_LIGHTS];

// New Uniforms for multiple Point Lights:
uniform int u_numPointLights;
uniform vec3 u_pointLightPositions[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightColors[MAX_POINT_LIGHTS];
uniform float u_pointLightConstantAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightLinearAtts[MAX_POINT_LIGHTS];
uniform float u_pointLightQuadraticAtts[MAX_POINT_LIGHTS];

// New Uniforms for multiple Spot Lights:
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
in vec3 v_position; // Crucial for point and spot lights: fragment's world position

out vec4 fragColor;

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = sampledTexColor * u_matColor;

  // Re-normalize normal after interpolation, needed for all types of lights
  vec3 normal = normalize(v_normal);

  // --- Ambient Lighting Contribution ---
  vec3 totalLitColorRGB = u_ambientLight.rgb * baseColor.rgb;

  // --- Directional Lighting Contributions ---
  for (int i = 0; i < u_numDirectionalLights; ++i) {
    vec3 lightDir = normalize(u_directionalLightDirections[i]);
    float diffuseIntensity = max(dot(normal, lightDir), 0.0);
    totalLitColorRGB += (baseColor.rgb * u_directionalLightColors[i] * diffuseIntensity);
  }

  // --- Point Light Contributions ---
  for (int i = 0; i < u_numPointLights; ++i) {
    vec3 lightVecPoint = u_pointLightPositions[i] - v_position;
    float distancePoint = length(lightVecPoint);
    vec3 pointLightDir = normalize(lightVecPoint);

    float pointDiffuseIntensity = max(dot(normal, pointLightDir), 0.0);

    float attenuationPoint = 1.0 / (
      u_pointLightConstantAtts[i] +
      u_pointLightLinearAtts[i] * distancePoint +
      u_pointLightQuadraticAtts[i] * (distancePoint * distancePoint)
    );
    attenuationPoint = clamp(attenuationPoint, 0.0, 1.0); // Clamp to prevent brightening very close

    totalLitColorRGB += (baseColor.rgb * u_pointLightColors[i] * pointDiffuseIntensity * attenuationPoint);
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

    // Compare this direction with the spotlight's actual direction
    // u_spotLightDirections[i] points FROM light source. spotLightDirFromFrag points TO light source.
    // So, we use dot(spotLightDirFromFrag, -normalize(u_spotLightDirections[i]))
    // Assuming u_spotLightDirections[i] is already normalized on CPU:
    float angleCos = dot(spotLightDirFromFrag, -u_spotLightDirections[i]);

    float coneFactor = smoothstep(u_spotLightOuterConeCos[i], u_spotLightInnerConeCos[i], angleCos);

    float spotDiffuseIntensity = max(dot(normal, spotLightDirFromFrag), 0.0); // Diffuse calculation

    totalLitColorRGB += (baseColor.rgb * u_spotLightColors[i] * spotDiffuseIntensity * attenuationSpot * coneFactor);
  }

  fragColor = vec4(totalLitColorRGB, baseColor.a);

}
