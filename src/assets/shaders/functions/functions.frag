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

// Function to calculate exponential squared (Exp2) fog factor
float calculateExponentialSquaredFogFactor(float distance, float fogDensity) {
    // Calculates an Exp2 fog factor.
    // Produces less fog close to the camera and a thicker, more natural falloff in the distance.
    float fogFactor = 1.0 - exp(-pow(distance * fogDensity, 2.0));
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

// New function to apply exponential squared (Exp2) fog to a color
vec3 applyExponentialSquaredFog(vec3 originalColor, vec3 fogColor, float distance, float fogDensity) {
    float fogFactor = calculateExponentialSquaredFogFactor(distance, fogDensity);
    return mix(originalColor, fogColor, fogFactor);
}

// General function to apply fog based on type (0: Linear (using distance * 0.5 and distance * 1.5 as temporary start/end), 1: Exp, 2: Exp2)
vec3 applyFog(vec3 originalColor, vec3 fogColor, float distance, float fogDensity, int fogType) {
    if (fogType == 2) {
        return applyExponentialSquaredFog(originalColor, fogColor, distance, fogDensity);
    } else if (fogType == 0) {
        // Placeholder linear values. Usually, start/end are separate uniforms.
        return applyLinearFog(originalColor, fogColor, distance, 1.0 / (fogDensity + 0.001), 2.0 / (fogDensity + 0.001)); 
    } else {
        // Default to Exp
        return applyExponentialFog(originalColor, fogColor, distance, fogDensity);
    }
}

float rand(vec2 c){
    return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// --- NEW PROCEDURAL 3D LUNAR TEXTURE FUNCTIONS ---

// 3D hash expanding your existing 2D rand function
float hash3D(vec3 p) {
    float xy = rand(p.xy);
    return rand(vec2(xy, p.z));
}

// Smooth 3D Value Noise
float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    // Smoothstep interpolation curve
    vec3 u = f * f * (3.0 - 2.0 * f);

    // Mix the 8 corners of the 3D voxel cube
    return mix(mix(mix(hash3D(i + vec3(0.0, 0.0, 0.0)), hash3D(i + vec3(1.0, 0.0, 0.0)), u.x),
                   mix(hash3D(i + vec3(0.0, 1.0, 0.0)), hash3D(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(hash3D(i + vec3(0.0, 0.0, 1.0)), hash3D(i + vec3(1.0, 0.0, 1.0)), u.x),
                   mix(hash3D(i + vec3(0.0, 1.0, 1.0)), hash3D(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

// Fractional Brownian Motion to build structural plains and craters
float calculateMoonTexture(vec3 normal, float frequency) {
    vec3 p = normal * frequency;
    float value = 0.0;
    float amplitude = 0.5;
    
    // 3 octaves gives structured dark plains and subtle surface dust
    for (int i = 0; i < 3; i++) {
        value += amplitude * noise3D(p);
        p *= 2.5; // Lacunarity
        amplitude *= 0.5; // Gain
    }
    return value;
}