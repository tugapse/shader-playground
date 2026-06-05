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

void main() {
  vec3 viewDir = normalize(v_viewDirection);

  float y = viewDir.y;
  vec3 gradientColor = vec3(0.0);

  if (y > 0.0) {
    float p = pow(y, u_exponent);
    gradientColor = mix(u_horizonColor.rgb, u_skyColor.rgb, p);
  } else {
    float p = pow(-y, u_exponent);
    gradientColor = mix(u_horizonColor.rgb, u_groundColor.rgb, p);
  }

  // Sample the cubemap texture and blend it over the procedural gradient
  vec4 texColor = texture(u_mainTex, viewDir) * u_matColor;
  
  // Multiply the texture and the gradient together to truly mix their colors!
  // We scale by 1.5 to prevent the combination from becoming too dark.
  vec3 mixedColor = gradientColor * texColor.rgb * 1.5;
  vec3 blendedColor = mix(gradientColor, mixedColor, texColor.a);

  vec4 finalColor = vec4(blendedColor, 1.0);

  if (u_useSun == 1) {
    // Tint the sky with the light color to simulate atmosphere
    finalColor.rgb *= u_sunColor.rgb;

    // Calculate sun
    vec3 sunDir = normalize(u_sunDirection);
    float sunDot = max(0.0, dot(viewDir, sunDir));
    float sunCore = smoothstep(u_sunSize - u_sunFalloff, u_sunSize, sunDot);
    float sunGlow = pow(sunDot, 120.0) * 0.5; // Wide atmospheric glow
    
    // Additive blending for the sun
    finalColor.rgb += u_sunColor.rgb * (sunCore + sunGlow);

    // Calculate moon
    if (u_useMoon == 1) {
      vec3 moonDir = normalize(u_moonDirection);
      float moonDot = max(0.0, dot(viewDir, moonDir));
      float moonCore = smoothstep(u_moonSize - u_moonFalloff, u_moonSize, moonDot);
      
      // Calculate 3D sphere normal for the moon to get perfectly curved phases
      float d2 = 1.0 - moonDot * moonDot;
      float R2 = 1.0 - u_moonSize * u_moonSize;
      float z = sqrt(max(0.0, R2 - d2));
      vec3 N = normalize(viewDir + moonDir * (z - moonDot));
      
      // Illuminate the moon sphere using the phase angle
      float phaseAngle = u_moonPhase * 6.2831853;
      vec3 moonRight = normalize(cross(vec3(0.0, 1.0, 0.0001), moonDir));
      vec3 L = normalize(moonDir * cos(phaseAngle) + moonRight * sin(phaseAngle));
      
      float moonLighting = smoothstep(-0.5, 0.5, dot(N, L));
      
      // Add a faint earthshine so the dark side isn't completely black
      float earthshine = 0.02;
      vec3 moonBodyColor = u_moonColor.rgb * mix(earthshine, 1.0, moonLighting);
      
      float moonGlow = pow(moonDot, 200.0) * 0.05 * (0.5 + 0.5 * cos(phaseAngle)); // Fade glow on dark side

      // Block the sky behind the solid moon, then add the moon body and glow
      finalColor.rgb = mix(finalColor.rgb, moonBodyColor, moonCore) + u_moonColor.rgb * moonGlow;
    }
  }

  fragColor = clamp(finalColor, 0.0, 1.0);
}
