#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_screenTexture;
uniform float u_time;
uniform float u_distortionStrength; // Try 0.15
uniform float u_aberrationSpread;   // Try 0.008

void main() {
    // 1. CRT Barrel Distortion
    // Shift UVs to center (-0.5 to 0.5) to calculate radial distance
    vec2 centeredUv = v_uv - 0.5;
    float distanceSquared = dot(centeredUv, centeredUv);
    
    // Distort UVs based on distance from center
    vec2 distortedUv = v_uv + centeredUv * (distanceSquared * u_distortionStrength);

    // 2. Chromatic Aberration
    // Sample the RGB channels at slightly different horizontal offsets
    float r = texture(u_screenTexture, distortedUv - vec2(u_aberrationSpread, 0.0)).r;
    float g = texture(u_screenTexture, distortedUv).g;
    float b = texture(u_screenTexture, distortedUv + vec2(u_aberrationSpread, 0.0)).b;

    // 3. Scanlines (using sine wave over the Y axis)
    // Multiply by a large number (like 800) to create thin horizontal lines
    float scanline = sin(distortedUv.y * 800.0 + u_time * 5.0) * 0.04;

    // Combine into final color, darkening slightly with the scanline
    fragColor = vec4(1.0,0.1,0.1, 1.0);
}