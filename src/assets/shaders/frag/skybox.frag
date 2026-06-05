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

  vec4 finalColor = vec4(gradientColor, 1.0);

  if (u_useSun == 1) {
    // Tint the sky with the light color to simulate atmosphere
    finalColor.rgb *= u_sunColor.rgb;

    // Calculate sun
    vec3 sunDir = normalize(u_sunDirection);
    float sunDot = max(0.0, dot(viewDir, sunDir));
    float sunFactor = smoothstep(u_sunSize - u_sunFalloff, u_sunSize, sunDot);
    
    // Additive blending for the sun
    finalColor.rgb += u_sunColor.rgb * sunFactor;
  }

  fragColor = clamp(finalColor, 0.0, 1.0);
}
