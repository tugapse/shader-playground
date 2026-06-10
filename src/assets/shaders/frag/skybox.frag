#version 300 es

precision mediump float;

uniform samplerCube u_mainTex;
uniform vec4 u_matColor;

// Procedural sky uniforms
uniform vec4 u_skyColor;
uniform vec4 u_horizonColor;
uniform vec4 u_groundColor;
uniform float u_exponent;

// Sun uniforms
uniform int u_useSun;
uniform vec3 u_sunDirection;
uniform vec4 u_sunColor;
uniform float u_sunSize;    // e.g., 0.995
uniform float u_sunFalloff; // e.g., 0.05

// Moon uniforms
uniform int u_useMoon;
uniform vec3 u_moonDirection;
uniform vec4 u_moonColor;
uniform float u_moonSize;
uniform float u_moonFalloff;
uniform float u_moonPhase;

in vec3 v_viewDirection;

out vec4 fragColor;

@INCLUDE_FUNC


vec3 drawStars(vec3 currentSkyColor, vec3 viewDir) {
    if (viewDir.y < 0.0) {
        return currentSkyColor;
    }

    // 1. Maintain grid space resolution
    vec3 starCoord = viewDir * 160.0; 
    vec3 i = floor(starCoord);
    vec3 f = fract(starCoord);
    
    // 2. Point mask for sub-pixel sharpness
    float distToCenter = length(f - vec3(0.5));
    float pointMask = smoothstep(0.4, 0.0, distToCenter);

    // 3. FIXED: BULLETPROOF NIGHT DETECTION
    // We check the sun's Y direction vector. 
    // If the sun is below the horizon (u_sunDirection.y < 0.0), nightFactor becomes 1.0.
    float nightFactor = smoothstep(0.1, -0.2, u_sunDirection.y); 
    
    // Drop the exponent down to 14.0 at night to force a massive field of stars to show up
    float dynamicExponent = mix(45.0, 14.0, nightFactor);
    
    float rawNoise = hash3D(i);
    float starMask = pow(rawNoise, dynamicExponent) * pointMask; 

    // 4. Galactic Clustering
    float densityMask = calculateMoonTexture(viewDir, 1.5);
    densityMask = smoothstep(0.4, 0.7, densityMask);
    starMask *= mix(0.15, 1.0, densityMask);

    // 5. Environmental and Atmospheric Fading
    float horizonFade = smoothstep(0.04, 0.25, viewDir.y); 
    
    // Force maximum intensity (8.0) when the sun goes down so they brightly pierce the dark canvas
    float dynamicIntensity = mix(0.5, 8.0, nightFactor);
    float finalStarIntensity = starMask * horizonFade * dynamicIntensity;

    // 6. Chromatic Variation Tinting
    float colorSeed = hash3D(i + vec3(12.34, 56.78, 90.12));
    
    vec3 icyBlue    = vec3(0.75, 0.88, 1.00);
    vec3 warmAmber  = vec3(1.00, 0.92, 0.78);
    vec3 cleanWhite = vec3(0.98, 0.98, 1.00);
    
    vec3 starColor = cleanWhite;
    if (colorSeed < 0.35) {
        starColor = mix(cleanWhite, icyBlue, 0.5);   
    } else if (colorSeed > 0.75) {
        starColor = mix(cleanWhite, warmAmber, 0.4); 
    }

    // 7. Perfect Composite Mix
    vec3 starLayer = starColor * finalStarIntensity;
    return max(currentSkyColor, starLayer);
}
// --- EXTRACTED CELESTIAL FUNCTIONS ---

vec3 calculateSunDisc(vec3 viewDir) {
    vec3 sunDir = normalize(u_sunDirection);
    float sunDot = max(0.0, dot(viewDir, sunDir));
    
    // 1. Core Disc & Base Soft Glow
    float sunCore = smoothstep(u_sunSize - u_sunFalloff, u_sunSize, sunDot);
    float sunGlow = pow(sunDot, 180.0) * 0.65; // Intense inner corona
    float wideGlare = pow(sunDot, 12.0) * 0.25; // Wide camera/eye glare flood
    
    // 2. Procedural Sun Rays (High-Frequency Shimmer)
    // We create a structural coordinate space around the sun's center vector
    vec3 rayProj = cross(viewDir, sunDir);
    float rayAngle = atan(rayProj.y, rayProj.x);
    
    // Mix multiple sine frequencies to create staggered, natural-looking solar needles
    float rayPattern = sin(rayAngle * 9.0) * sin(rayAngle * 15.0 + 1.2) * cos(rayAngle * 4.0);
    // Tighten the rays so they only project outward from the glowing corona
    float sunRays = max(0.0, rayPattern) * pow(sunDot, 450.0) * 0.45;
    
    // 3. Dynamic Color Corona Ramp (Hot White Core -> Vibrant Yellow -> Soft Crimson Haze)
    vec3 coreColor = vec3(1.0, 0.98, 0.95);      // Blinding white center
    vec3 edgeColor = vec3(1.0, 0.65, 0.28);      // Intense solar yellow/orange
    vec3 outerHazeColor = vec3(0.92, 0.42, 0.3); // Warm atmospheric red/pink scattering
    
    // Blend the color profile based on radial distance from center
    vec3 mixedSunColor = mix(edgeColor, coreColor, sunCore);
    vec3 finalGlowColor = mix(outerHazeColor, mixedSunColor, smoothstep(0.0, 0.3, sunGlow + sunCore));
    
    // 4. Final Composite Assembly
    vec3 sunOutput = (sunCore * coreColor) + 
                     (sunGlow * finalGlowColor) + 
                     (sunRays * edgeColor) + 
                     (wideGlare * outerHazeColor * u_sunColor.rgb);
                     
    return sunOutput;
}
vec3 drawMoon(vec3 currentSkyColor, vec3 viewDir) {
    vec3 moonDir = normalize(u_moonDirection);
    float moonDot = max(0.0, dot(viewDir, moonDir));
    
    float d2 = 1.0 - moonDot * moonDot;
    float R2 = 1.0 - u_moonSize * u_moonSize;
    
    float phaseAngle = u_moonPhase * 6.2831853;
    float phaseFade = 0.3 + 0.7 * max(0.0, cos(phaseAngle));

    // 1. Tiny atmospheric halo
    float haloOuterRadius = R2 + 0.0015;
    vec3 colorOut = currentSkyColor;
    if (d2 > R2 && d2 < haloOuterRadius) {
        float haloFactor = 1.0 - ((d2 - R2) / (haloOuterRadius - R2));
        colorOut = mix(currentSkyColor, u_horizonColor.rgb, 0.4 * haloFactor * phaseFade);
    }

    if (d2 > R2) {
        return colorOut;
    }

    // 2. Inside the sphere
    float moonCore = smoothstep(u_moonSize - u_moonFalloff, u_moonSize, moonDot);
    
    float z = sqrt(max(0.0, R2 - d2));
    vec3 N = normalize(viewDir + moonDir * (z - moonDot));
    
    vec3 moonRight = normalize(cross(vec3(0.0, 1.0, 0.0001), moonDir));
    vec3 L = normalize(moonDir * cos(phaseAngle) + moonRight * sin(phaseAngle));
    float moonLighting = smoothstep(-0.5, 0.5, dot(N, L));
    
    // 3. Procedural lunar terrain generation
    float baseNoise = calculateMoonTexture(N, 3.5);
    float detailNoise = calculateMoonTexture(N + vec3(baseNoise * 0.15), 12.0);
    float combinedNoise = mix(baseNoise, detailNoise, 0.35);
    
    float mariaMask = smoothstep(0.25, 0.55, combinedNoise);
    vec3 moonBaseColor = mix(u_moonColor.rgb * 0.3, u_moonColor.rgb * 1.1, mariaMask);
    
    float craterRim = smoothstep(0.68, 0.72, detailNoise) * 0.25;
    moonBaseColor += vec3(craterRim);
    
    float earthshine = 0.02;
    vec3 moonBodyColor = moonBaseColor * mix(earthshine, 1.0, moonLighting);

    // --- NEW: ATMOSPHERIC HAZE FADING ---
    // Calculate thick air scattering based on how close the moon is to the horizon
    // Higher exponent (e.g., 2.0) confines heavy fading exclusively near the ground line
    float horizonHaze = pow(1.0 - max(0.0, viewDir.y), 2.0);
    
    // Base amount of sky tint overlayed over the moon regardless of height (e.g., 15%)
    // plus extra fading when dipping close to the horizon haze
    float atmosphericThickness = mix(0.15, 0.65, horizonHaze);
    
    // Partially wash out the moon's details with the ambient sky color
    moonBodyColor = mix(moonBodyColor, currentSkyColor, atmosphericThickness);

    // 4. Blend transparency mask cleanly by phase illumination
    float edgeLightingFactor = smoothstep(0.4, 0.6, cos(phaseAngle) * 0.5 + 0.5);
    float moonAlpha = moonCore * mix(earthshine, 1.0, edgeLightingFactor);

    return mix(colorOut, moonBodyColor, moonAlpha);
}
// --- MAIN FRAGMENT SHADER ---
void main() {
  vec3 viewDir = normalize(v_viewDirection);

  // Calculate clean procedural background gradient
  float y = viewDir.y;
  vec3 gradientColor = vec3(0.0);

  if (y > 0.0) {
    float p = pow(y, u_exponent);
    gradientColor = mix(u_horizonColor.rgb, u_skyColor.rgb, p);
  } else {
    float p = pow(-y, u_exponent);
    gradientColor = mix(u_horizonColor.rgb, u_groundColor.rgb, p);
  }

  // Set the default sky background
  vec3 finalColor = gradientColor;

  // --- NEW: PROCEDURAL STARFIELD RENDER STEP ---
  // Generate background stars over the sky gradient before adding planets/sun layers
  finalColor = drawStars(finalColor, viewDir);

  // 1. If the sun is active, tint the atmospheric background color safely
  if (u_useSun == 1) {
    finalColor *= u_sunColor.rgb;
  }

  // 2. Compute and blend the moon directly over the background
  if (u_useSun == 1 && u_useMoon == 1) {
    finalColor = drawMoon(finalColor, viewDir);
  }

  // 3. Additively apply the Sun flare element onto the image last
  if (u_useSun == 1) {
    finalColor += calculateSunDisc(viewDir);
  }

  fragColor = clamp(vec4(finalColor, 1.0), 0.0, 1.0);
}