#define MAX_DIRECTIONAL_LIGHTS 5 // Max number of directional lights
#define MAX_POINT_LIGHTS 20       // Max number of point lights
#define MAX_SPOT_LIGHTS 20        // Max number of spot lights

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
