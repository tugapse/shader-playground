#version 300 es
precision mediump float;
in vec2 v_texCoord;
uniform sampler2D u_screenTexture;
out vec4 fragColor;

void main() {
    // Sample the rendered scene texture
    vec4 texColor = texture(u_screenTexture, v_texCoord);
    
    // TEMPORARY DEBUG: Boost the red channel to guarantee we see the blit output
    // If this runs, your whole screen will tint red where the texture is drawn.
    fragColor = vec4(v_texCoord, texColor.b, 1.0);
}