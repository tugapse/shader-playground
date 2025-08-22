#define MAX_DIRECTIONAL_LIGHTS 5
#define MAX_POINT_LIGHTS 20
#define MAX_SPOT_LIGHTS 20

// Uniforms for specular lighting and roughness
uniform float u_specularStrength;
uniform float u_roughness;
uniform vec3 u_cameraPosition;

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
uniform float u_pointLightRadii[MAX_POINT_LIGHTS];

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


vec3 calculateTotalDirectionalLighting(
    vec3 fragmentNormal,
    vec3 viewDir,
    float shininess,
    vec4 baseColor) {

    vec3 totalDirLight = vec3(0.0);
    for (int i = 0; i < u_numDirectionalLights; ++i) {
        vec3 lightDir = normalize(u_directionalLightDirections[i]);

        // Diffuse component (Lambertian)
        float diffuseIntensity = max(dot(fragmentNormal, lightDir), 0.0);

        // Specular component (Blinn-Phong)
        vec3 halfVec = normalize(lightDir + viewDir); // Halfway vector
        float specularIntensity = pow(max(0.0, dot(fragmentNormal, halfVec)), shininess) * u_specularStrength;

        // Add both diffuse and specular contributions
        totalDirLight += (baseColor.rgb * u_directionalLightColors[i] * (diffuseIntensity + specularIntensity));
    }
    return totalDirLight;
}

vec3 calculateTotalPointLighting(
    vec3 fragmentPosition,
    vec3 fragmentNormal,
    vec3 viewDir,
    float shininess,
    vec4 baseColor) {

    vec3 totalPointLight = vec3(0.0);
    for (int i = 0; i < u_numPointLights; ++i) {
        vec3 lightVecPoint = u_pointLightPositions[i] - fragmentPosition;
        float distancePoint = length(lightVecPoint);
        vec3 pointLightDir = normalize(lightVecPoint);

        float rangeFactor = 1.0 - smoothstep(0.8 * u_pointLightRadii[i], u_pointLightRadii[i], distancePoint);
        if (rangeFactor == 0.0) {
            continue;
        }

        float attenuationPoint = 1.0 / (
            u_pointLightConstantAtts[i] +
            u_pointLightLinearAtts[i] * distancePoint +
            u_pointLightQuadraticAtts[i] * (distancePoint * distancePoint)
        );
        attenuationPoint = clamp(attenuationPoint, 0.0, 1.0);

        // Diffuse component
        float pointDiffuseIntensity = max(dot(fragmentNormal, pointLightDir), 0.0);

        // Specular component
        vec3 halfVec = normalize(pointLightDir + viewDir); // Halfway vector
        float pointSpecularIntensity = pow(max(0.0, dot(fragmentNormal, halfVec)), shininess) * u_specularStrength;

        // Add both diffuse and specular contributions, applying attenuation
        totalPointLight += (baseColor.rgb * u_pointLightColors[i] * (pointDiffuseIntensity + pointSpecularIntensity) * attenuationPoint * rangeFactor);
    }
    return totalPointLight;
}

vec3 calculateTotalSpotLighting(
    vec3 fragmentPosition,
    vec3 fragmentNormal,
    vec3 viewDir,
    float shininess,
    vec4 baseColor) {

    vec3 totalSpotLight = vec3(0.0);
    for (int i = 0; i < u_numSpotLights; ++i) {
        vec3 lightVecSpot = u_spotLightPositions[i] - fragmentPosition;
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
        coneFactor = clamp(coneFactor, 0.0, 1.0); // Ensure coneFactor is valid

        // Diffuse component
        float spotDiffuseIntensity = max(dot(fragmentNormal, spotLightDirFromFrag), 0.0);

        // Specular component
        vec3 halfVec = normalize(spotLightDirFromFrag + viewDir); // Halfway vector
        float spotSpecularIntensity = pow(max(0.0, dot(fragmentNormal, halfVec)), shininess) * u_specularStrength;

        // Add both diffuse and specular contributions, applying attenuation and cone factor
        totalSpotLight += (baseColor.rgb * u_spotLightColors[i] * (spotDiffuseIntensity + spotSpecularIntensity) * attenuationSpot * coneFactor);
    }
    return totalSpotLight;
}
