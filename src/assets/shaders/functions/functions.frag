uniform vec3 u_FogColor;
uniform float u_FogDensity;
uniform int u_fogType; 
uniform float u_FogHeightFalloff; 
uniform float u_FogBaseHeight;    

float calculateLinearFogFactor(float distance, float fogStart, float fogEnd) {
    float fogFactor = (distance - fogStart) / (fogEnd - fogStart);
    return clamp(fogFactor, 0.0, 1.0);
}

float calculateExponentialFogFactor(float distance, float fogDensity) {
    float fogFactor = 1.0 - exp(-distance * fogDensity);
    return clamp(fogFactor, 0.0, 1.0);
}

float calculateExponentialSquaredFogFactor(float distance, float fogDensity) {
    float fogFactor = 1.0 - exp(-pow(distance * fogDensity, 2.0));
    return clamp(fogFactor, 0.0, 1.0);
}

vec3 applyLinearFog(vec3 originalColor, vec3 fogColor, float distance, float fogStart, float fogEnd) {
    float fogFactor = calculateLinearFogFactor(distance, fogStart, fogEnd);
    return mix(originalColor, fogColor, fogFactor);
}

vec3 applyExponentialFog(vec3 originalColor, vec3 fogColor, float distance, float fogDensity) {
    float fogFactor = calculateExponentialFogFactor(distance, fogDensity);
    return mix(originalColor, fogColor, fogFactor);
}

vec3 applyExponentialSquaredFog(vec3 originalColor, vec3 fogColor, float distance, float fogDensity) {
    float fogFactor = calculateExponentialSquaredFogFactor(distance, fogDensity);
    return mix(originalColor, fogColor, fogFactor);
}

vec3 applyFog(vec3 originalColor, float distance, vec3 fragPos, vec3 camPos, int numLights, vec3 lightDir, vec3 lightColor) {
    vec3 effectiveFogColor = u_FogColor;

    if (numLights > 0) {
        vec3 viewDir = normalize(fragPos - camPos);
        vec3 lDir = normalize(-lightDir);
        
        float sunInscatter = max(0.0, dot(viewDir, lDir));
        sunInscatter = pow(sunInscatter, 8.0);
        
        effectiveFogColor += lightColor * sunInscatter;
    }

    float heightDelta = max(0.0, fragPos.y - u_FogBaseHeight);
    float heightDensityFactor = exp(-heightDelta * u_FogHeightFalloff);
    float effectiveDensity = u_FogDensity * heightDensityFactor;

    if (u_fogType == 2) {
        return applyExponentialSquaredFog(originalColor, effectiveFogColor, distance, effectiveDensity);
    } else if (u_fogType == 0) {
        return applyLinearFog(originalColor, effectiveFogColor, distance, 1.0 / (effectiveDensity + 0.001), 2.0 / (effectiveDensity + 0.001)); 
    } else {
        return applyExponentialFog(originalColor, effectiveFogColor, distance, effectiveDensity);
    }
}

float rand(vec2 c){
    return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float hash3D(vec3 p) {
    float xy = rand(p.xy);
    return rand(vec2(xy, p.z));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(hash3D(i + vec3(0.0, 0.0, 0.0)), hash3D(i + vec3(1.0, 0.0, 0.0)), u.x),
                   mix(hash3D(i + vec3(0.0, 1.0, 0.0)), hash3D(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(hash3D(i + vec3(0.0, 0.0, 1.0)), hash3D(i + vec3(1.0, 0.0, 1.0)), u.x),
                   mix(hash3D(i + vec3(0.0, 1.0, 1.0)), hash3D(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

