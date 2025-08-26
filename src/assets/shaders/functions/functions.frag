// Function to calculate linear fog factor
float calculateLinearFogFactor(float distance, float fogStart, float fogEnd) {
    // Calculates a linear fog factor based on distance, start, and end points.
    // The factor will be 0.0 (no fog) when distance <= fogStart
    // and 1.0 (full fog) when distance >= fogEnd.
    float fogFactor = (distance - fogStart) / (fogEnd - fogStart);
    return clamp(fogFactor, 0.0, 1.0);
}

// Function to calculate exponential fog factor
float calculateExponentialFogFactor(float distance, float fogDensity) {
    // Calculates an exponential fog factor.
    // Higher density means fog appears closer and thicker.
    // The factor increases exponentially with distance.
    float fogFactor = 1.0 - exp(-distance * fogDensity);
    return clamp(fogFactor, 0.0, 1.0);
}

// New function to apply linear fog to a color
vec3 applyLinearFog(vec3 originalColor, vec3 fogColor, float distance, float fogStart, float fogEnd) {
    // Calculates the linear fog factor and mixes the original color with the fog color.
    float fogFactor = calculateLinearFogFactor(distance, fogStart, fogEnd);
    return mix(originalColor, fogColor, fogFactor);
}

// New function to apply exponential fog to a color
vec3 applyExponentialFog(vec3 originalColor, vec3 fogColor, float distance, float fogDensity) {
    // Calculates the exponential fog factor and mixes the original color with the fog color.
    float fogFactor = calculateExponentialFogFactor(distance, fogDensity);
    return mix(originalColor, fogColor, fogFactor);
}
