float calculateShadowFactor(sampler2DShadow shadowMap, vec4 shadowCoord, vec2 shadowMapSize) {
    // Perform perspective divide
    vec3 projCoords = shadowCoord.xyz / shadowCoord.w;

    // Transform to [0, 1] range
    projCoords = projCoords * 0.5 + 0.5;

    // Don't shadow fragments outside of the light's frustum
    if (projCoords.z > 1.0) {
        return 1.0;
    }

    float shadow = 0.0;
    vec2 texelSize = 1.0 / shadowMapSize;

    // 3x3 PCF Kernel
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            // textureProj performs the projection, texture lookup, and depth comparison
            // all in one go. The result is 0.0 (in shadow) or 1.0 (lit).
            // We use shadowCoord.w as the reference depth.
            shadow += texture(
                shadowMap,
                vec3(projCoords.xy + vec2(x, y) * texelSize, projCoords.z)
            );
        }
    }

    // Average the results
    return shadow / 9.0;
}
