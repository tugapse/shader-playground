#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_screenTexture;
out vec4 fragColor;

void main() {
    // Sample the rendered scene texture
    vec4 texColor = texture(u_screenTexture, v_uv);
    fragColor = vec4(texColor.rgb, 1.0);
}