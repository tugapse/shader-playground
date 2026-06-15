#version 300 es

precision mediump float;

// --- GLOBAL SAMPLERS & ENVIRONMENT ---
uniform samplerCube u_mainTex;
uniform vec4 u_matColor;
uniform float u_time;

// --- PROCEDURAL SKY UNIFORMS ---
uniform vec4 u_skyColor;
uniform vec4 u_horizonColor;
uniform vec4 u_groundColor;
uniform float u_exponent;

// --- SUN UNIFORMS ---
uniform int u_useSun;
uniform vec3 u_sunDirection;
uniform vec4 u_sunColor;
uniform float u_sunSize;    
uniform float u_sunFalloff; 

// --- MOON UNIFORMS ---
uniform int u_useMoon;
uniform vec3 u_moonDirection;
uniform vec4 u_moonColor;
uniform float u_moonSize;
uniform float u_moonFalloff;
uniform float u_moonPhase;
uniform float u_moonEarthshine;
uniform float u_moonTerminatorSoftness;
uniform int u_moonEnableRotation;
uniform float u_moonRotationSpeed;

// --- CLOUDS UNIFORMS ---
uniform int u_useClouds;
uniform float u_cloudSeed;
uniform float u_cloudTiling;
uniform float u_weatherCondition;
uniform float u_cloudSparsity;
uniform float u_windCloudSpeed;
uniform float u_cloudSpeed;
uniform int u_cloudRepetition;

// --- STARS UNIFORMS ---
uniform float u_starIntensity;
uniform float u_starScale;
uniform float u_starSparsity;
uniform float u_starSpeed;

in vec3 v_viewDirection;
out vec4 fragColor;

// --- EXTERNAL NOISE/UTILITY MACRO ---
@INCLUDE_FUNC

// --- GLOBAL WEATHER COMMUNICATOR INTERFACE ---
float g_cloudAlpha = 0.0;
vec3 g_cloudColor  = vec3(0.0);

// --- FUNCTION PROTOTYPES ---
vec3 drawStars(vec3 currentSkyColor, vec3 viewDir);
vec3 drawClouds(vec3 currentSkyColor, vec3 viewDir);
vec3 drawSun(vec3 viewDir);
vec3 drawMoon(vec3 currentSkyColor, vec3 viewDir);

// --- MAIN PIPELINE EXECUTION ---
void main() {
  vec3 viewDir = normalize(v_viewDirection);

  float y = viewDir.y;
  vec3 gradientColor = vec3(0.0);

  float absY = abs(y);
  float p = pow(absY, u_exponent);
  vec3 targetColor = (y > 0.0) ? u_skyColor.rgb : u_groundColor.rgb;
  gradientColor = mix(u_horizonColor.rgb, targetColor, p);

  vec3 finalColor = gradientColor;

  finalColor = drawStars(finalColor, viewDir);
  finalColor = drawClouds(finalColor, viewDir); 

  // Sun is only visible when it's above the horizon
  if (u_useSun == 1 && u_sunDirection.y > -0.2) {
    float sunOcclusion = 1.0 - (g_cloudAlpha * 0.95); 
    finalColor += drawSun(viewDir) * sunOcclusion;
  }

  if (u_useMoon == 1 && u_moonDirection.y > -0.2) {
    finalColor = drawMoon(finalColor, viewDir);
  }

  fragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}

// --- RENDERING SUBSYSTEM IMPLEMENTATIONS ---

vec3 drawStars(vec3 currentSkyColor, vec3 viewDir) {
    if (viewDir.y < 0.0) {
        return currentSkyColor;
    }

    // =========================================================================
    // CONFIGURATION PROPERTIES (STARFIELD SYSTEM)
    // =========================================================================
    const float c_starClusterFreq = 2.9;                          // Frequency scale of the cosmic galaxy banding patterns
    const float c_starClusterCut  = 0.35;                          // Contrast threshold cutoff defining empty space dark voids
    const vec3 c_rotationAxis     = vec3(0.1961, 0.8825, 0.0981); // Pre-normalized 3D directional vector axis of Earth's tilt

    float angle = u_time * u_starSpeed;
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    mat3 rotationMatrix = mat3(
        oc * c_rotationAxis.x * c_rotationAxis.x + c,                    oc * c_rotationAxis.x * c_rotationAxis.y - c_rotationAxis.z * s, oc * c_rotationAxis.x * c_rotationAxis.z + c_rotationAxis.y * s,
        oc * c_rotationAxis.x * c_rotationAxis.y + c_rotationAxis.z * s, oc * c_rotationAxis.y * c_rotationAxis.y + c,                    oc * c_rotationAxis.y * c_rotationAxis.z - c_rotationAxis.x * s,
        oc * c_rotationAxis.x * c_rotationAxis.z - c_rotationAxis.y * s, oc * c_rotationAxis.y * c_rotationAxis.z + c_rotationAxis.x * s, oc * c_rotationAxis.z * c_rotationAxis.z + c
    );

    vec3 rotatedViewDir = rotationMatrix * viewDir;

    vec3 moonDir = normalize(u_moonDirection);
    float moonDot = max(0.0, dot(viewDir, moonDir));
    float d2 = 1.0 - moonDot * moonDot;
    float R2 = 1.0 - u_moonSize * u_moonSize;
    
    if (u_useMoon == 1 && d2 <= R2) {
        return currentSkyColor;
    }

    vec3 starCoord = rotatedViewDir * u_starScale; 
    vec3 i = floor(starCoord);
    vec3 f = fract(starCoord);
    
    float distToCenter = length(f - vec3(0.5));
    float pointMask = smoothstep(0.4, 0.0, distToCenter);

    float nightFactor = smoothstep(0.1, -0.2, u_sunDirection.y); 
    float dynamicExponent = mix(45.0, u_starSparsity, nightFactor);
    
    float rawNoise = hash3D(i);
    float starMask = pow(rawNoise, dynamicExponent) * pointMask; 

    if (starMask <= 0.0) {
        return currentSkyColor;
    }

    float densityNoise = calculateMoonTexture(rotatedViewDir, c_starClusterFreq);
    float densityMask = smoothstep(c_starClusterCut, c_starClusterCut + 0.3, densityNoise);
    starMask *= mix(0.1, 1.0, densityMask);

    float horizonFade = smoothstep(0.04, 0.25, viewDir.y); 
    float dynamicIntensity = mix(0.5, u_starIntensity, nightFactor);
    float finalStarIntensity = starMask * horizonFade * dynamicIntensity;

    float colorSeed = hash3D(i + vec3(12.34, 56.78, 90.12));
    vec3 icyBlue    = vec3(0.75, 0.88, 1.00);
    vec3 warmAmber  = vec3(1.00, 0.92, 0.78);
    vec3 cleanWhite = vec3(0.98, 0.98, 1.00);
    
    vec3 starColor = cleanWhite;
    starColor = mix(starColor, mix(cleanWhite, icyBlue, 0.5), step(colorSeed, 0.35));
    starColor = mix(starColor, mix(cleanWhite, warmAmber, 0.4), step(0.75, colorSeed));

    return max(currentSkyColor, starColor * finalStarIntensity);
}

vec3 drawClouds(vec3 currentSkyColor, vec3 viewDir) {

    if(u_useClouds == 0){
        return currentSkyColor;
    }

    if (viewDir.y < -0.01) {
        return currentSkyColor;
    }

    // =========================================================================
    // CONFIGURATION PROPERTIES (METEOROLOGICAL SYSTEM)
    // =========================================================================
    int rep = 1 + u_cloudRepetition;
    float c_weatherCondition = u_weatherCondition;     // Testing driver loop state (0.0 = Clear, 1.0 = Heavy Storm)
    float c_cloudTiling      = u_cloudTiling;                       // Size/frequency scale of the cloud fractal structures
    vec3 c_cloudSeed         = vec3(200.0  , 128.54 / (100.0 + u_time) , 954.31) + u_time *  u_cloudSpeed; // 3D generation coordinate translation offsets (Procedural Seed)
    float c_maxOpacityClear  = 0.75;                        // Alpha opacity limit clamping factor during standard clear days
    float c_maxOpacityStorm  = 0.98;                        // Alpha opacity limit clamping factor during heavy dark storms
    const float c_zenithPatchWeight= 0.8;                         // Opacity blending mix weight of the overhead zenith dome cap

    // Configurable Color Parameters
    vec3 c_cloudColorDay  = mix(vec3(1.0), u_sunColor.rgb, 0.3);  // Main daylight color highlight profile edge
    vec3 c_cloudShadowDay = u_horizonColor.rgb * 0.8;             // Base undershade color profile for fair weather clouds
    vec3 c_cloudColorRain  = mix(u_horizonColor.rgb * 1.5, vec3(0.75, 0.77, 0.80), 0.3); // Rain highlight color configuration matrix
    vec3 c_cloudShadowRain = mix(u_horizonColor.rgb * 0.8, vec3(0.45, 0.47, 0.50), 0.3); // Rain undershade color configuration matrix

    // =========================================================================

    vec2 cloudUV = viewDir.xz / (viewDir.y + 0.001);
    vec2 windOffset = vec2(u_time * u_windCloudSpeed, u_time * u_windCloudSpeed);
    cloudUV = (cloudUV * c_cloudTiling) + windOffset;

    vec3 pPlanar = vec3(cloudUV.x, 0.0, cloudUV.y) + c_cloudSeed;
    float nPlanar  = 0.500 * noise3D(pPlanar); pPlanar *= 2.05;
    for(int i = 0; i < rep; i++){
        nPlanar       += 0.250 * noise3D(pPlanar); pPlanar *= 1.02;
    }
    nPlanar       += 0.125 * noise3D(pPlanar);
    
    float baseCloudNoise = nPlanar / 0.875;

    vec3 pSpherical = (viewDir * (c_cloudTiling * 2.5)) + vec3(windOffset.x, 0.0, windOffset.y) + c_cloudSeed;
    float nSpherical  = 0.500 * noise3D(pSpherical); pSpherical *= 2.05;
    nSpherical       += 0.250 * noise3D(pSpherical);
    float zenithNoise = nSpherical / 0.750;

    float zenithWeight = pow(viewDir.y, 3.0); 
    float cloudNoise = mix(baseCloudNoise, zenithNoise, zenithWeight * c_zenithPatchWeight);

    float baseDensity = mix(0.75, 0.15, c_weatherCondition);
    float dynamicDensity = clamp(baseDensity + u_cloudSparsity * (1.0 - baseDensity), 0.0, 0.98);
    float dynamicSharpness = mix(0.35, 0.15, c_weatherCondition);
    float cloudCoverage = smoothstep(dynamicDensity, dynamicDensity + dynamicSharpness, cloudNoise);

    float edgeFade = smoothstep(0.01, 0.15, viewDir.y);
    g_cloudAlpha = cloudCoverage * edgeFade;

    if (g_cloudAlpha <= 0.0) {
        return currentSkyColor;
    }

    vec3 currentShadow    = mix(c_cloudShadowDay, c_cloudShadowRain, c_weatherCondition);
    vec3 currentHighlight = mix(c_cloudColorDay, c_cloudColorRain, c_weatherCondition);
    g_cloudColor = mix(currentShadow, currentHighlight, smoothstep(0.2, 0.8, cloudNoise));

    float dynamicMaxOpacity = mix(c_maxOpacityClear, c_maxOpacityStorm, c_weatherCondition);
    return mix(currentSkyColor, g_cloudColor, g_cloudAlpha * dynamicMaxOpacity);
}

vec3 drawSun(vec3 viewDir) {
    // =========================================================================
    // CONFIGURATION PROPERTIES (HELIOCENTRIC LOGIC SUB-SYSTEM)
    // =========================================================================
    const float c_coronaGlowPower = 180.0;                       // Sharpness falloff rate exponent of the tight corona flare halo
    const float c_coronaGlowScale = 0.65;                        // Intensity scale brightness factor of the tight corona halo
    const float c_wideGlarePower  = 12.0;                         // Sharpness falloff rate exponent of the broad screen lens flood
    const float c_wideGlareScale  = 0.25;                         // Intensity scale brightness factor of the broad screen lens flood
    const float c_raySymmetryFreq1= 9.0;                          // Sharpness pattern frequency speed pass 1 for solar ray needles
    const float c_raySymmetryFreq2= 15.0;                         // Sharpness pattern frequency speed pass 2 for structural solar beams
    const float c_raySymmetryFreq3= 4.0;                          // Cross modulation masking frequency mapping break gaps between rays
    const float c_rayFalloffPower = 450.0;                        // Compression distance curve multiplier scaling starburst projections
    const float c_rayIntensityScale = 0.45;                       // Shimmer emission strength scale factor for the directional beams

    vec3 sunDir = normalize(u_sunDirection);
    float sunDot = max(0.0, dot(viewDir, sunDir));
    
    if (sunDot < 0.7) {
        return vec3(0.0);
    }

    float sunCore = smoothstep(u_sunSize - u_sunFalloff, u_sunSize, sunDot);
    float sunGlow = pow(sunDot, c_coronaGlowPower) * c_coronaGlowScale; 
    float wideGlare = pow(sunDot, c_wideGlarePower) * c_wideGlareScale; 
    
    vec3 rayProj = cross(viewDir, sunDir);
    float rayAngle = atan(rayProj.y, rayProj.x);
    float rayPattern = sin(rayAngle * c_raySymmetryFreq1) * sin(rayAngle * c_raySymmetryFreq2 + 1.2) * cos(rayAngle * c_raySymmetryFreq3);
    float sunRays = max(0.0, rayPattern) * pow(sunDot, c_rayFalloffPower) * c_rayIntensityScale;
    
    vec3 coreColor = vec3(1.0, 0.98, 0.95);      
    vec3 edgeColor = vec3(1.0, 0.65, 0.28);      
    vec3 outerHazeColor = vec3(0.92, 0.42, 0.3); 
    
    vec3 mixedSunColor = mix(edgeColor, coreColor, sunCore);
    vec3 finalGlowColor = mix(outerHazeColor, mixedSunColor, smoothstep(0.0, 0.3, sunGlow + sunCore));
    
    return (sunCore * coreColor) + 
           (sunGlow * finalGlowColor) + 
           (sunRays * edgeColor) + 
           (wideGlare * outerHazeColor * u_sunColor.rgb);
}



vec3 drawMoon(vec3 currentSkyColor, vec3 viewDir) {
    // =========================================================================
    // CONFIGURATION PROPERTIES (LUNAR ENVIRONMENT SYSTEM)
    // =========================================================================
    const float c_haloRadiusWiden = 0.015;                      // Mathematical thickness boundary radius of the atmospheric ring
    const float c_haloAlphaWeight = 0.1;                         // Ambient light blending transparency factor for phase glow halos
    const float c_textureFreqBase = 3.5;                          // Octave frequency scale mapping primary lunar craters/maria valleys
    const float c_textureFreqDet  = 12.0;                         // Octave frequency scale mapping secondary high-resolution cracks
    const float c_craterRimCutoff = 0.68;                         // Highpass amplitude filter mask clipping crater wall brightness
    const float c_horizonHazePow  = 2.0;                          // Thickness curve attenuation falloff driving dust horizon fading

    vec3 moonDir = normalize(u_moonDirection);
    float moonDot = max(0.0, dot(viewDir, moonDir));
    
    float d2 = 1.0 - moonDot * moonDot;
    float R2 = 1.0 - u_moonSize * u_moonSize;
    
    float phaseAngle = u_moonPhase * 6.2831853;
    float phaseFade = 1.0;

    float haloOuterRadius = R2 + c_haloRadiusWiden;
    vec3 colorOut = currentSkyColor;
    
    if (d2 > R2 && d2 < haloOuterRadius) {
        float haloFactor = 1.0 - ((d2 - R2) / (haloOuterRadius - R2));
        colorOut = mix(currentSkyColor, u_horizonColor.rgb, c_haloAlphaWeight * haloFactor * phaseFade);
    }

    if (d2 > R2) {
        return colorOut;
    }

    float moonCore = smoothstep(u_moonSize - u_moonFalloff, u_moonSize, moonDot);
    
    float z = sqrt(max(0.0, R2 - d2));
    vec3 N = normalize(viewDir + moonDir * (z - moonDot));
    
    vec3 moonRight = normalize(cross(vec3(0.0, 1.0, 0.0001), moonDir));
    vec3 L = normalize(moonDir * cos(phaseAngle) + moonRight * sin(phaseAngle));
    float moonLighting = smoothstep(-u_moonTerminatorSoftness, u_moonTerminatorSoftness, dot(N, L));
    
    vec3 rotatedN = N;
    if (u_moonEnableRotation == 1) {
        float rotAngle = u_time * u_moonRotationSpeed;
        float rSin = sin(rotAngle);
        float rCos = cos(rotAngle);
        rotatedN.xz = vec2(N.x * rCos - N.z * rSin, N.x * rSin + N.z * rCos);
    }
    
    float baseNoise = calculateMoonTexture(rotatedN, c_textureFreqBase);
    float detailNoise = calculateMoonTexture(rotatedN + vec3(baseNoise * 0.15), c_textureFreqDet);
    float combinedNoise = mix(baseNoise, detailNoise, 0.35);
    
    float mariaMask = smoothstep(0.25, 0.55, combinedNoise);
    vec3 moonBaseColor = mix(u_moonColor.rgb * 0.3, u_moonColor.rgb * 1.1, mariaMask);
    
    float craterRim = smoothstep(c_craterRimCutoff, c_craterRimCutoff + 0.04, detailNoise) * 0.25;
    moonBaseColor += vec3(craterRim);
    
    vec3 moonBodyColor = moonBaseColor * mix(u_moonEarthshine, 1.0, moonLighting);

    float horizonHaze = pow(1.0 - max(0.0, viewDir.y), c_horizonHazePow);
    float atmosphericThickness = mix(0.15, 0.65, horizonHaze);
    moonBodyColor = mix(moonBodyColor, currentSkyColor, atmosphericThickness);

    // Corrected phase logic: full moon should be opaque, new moon should be transparent (or have earthshine).
    float edgeLightingFactor = smoothstep(0.4, 0.6, cos(phaseAngle) * 0.5 + 0.5);
    float moonAlpha = moonCore * mix(u_moonEarthshine, 1.0, edgeLightingFactor);

    vec3 completeMoon = mix(colorOut, moonBodyColor, moonAlpha);
    return mix(completeMoon, g_cloudColor, g_cloudAlpha * 0.9);
}   