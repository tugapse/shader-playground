#version 300 es

precision mediump float;

// New uniform for the cubemap sampler
uniform samplerCube u_mainTex;

in vec3 v_viewDirection; // Changed from v_position, as view direction is better for sampling cubemaps

out vec4 fragColor;

void main() {

  fragColor = texture(u_mainTex, normalize(v_viewDirection));
}
