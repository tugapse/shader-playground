#version 300 es

precision mediump float;

uniform samplerCube u_mainTex;
uniform vec4 u_matColor;

in vec3 v_viewDirection; // Changed from v_position, as view direction is better for sampling cubemaps

out vec4 fragColor;

void main() {

  fragColor = texture(u_mainTex, normalize(v_viewDirection)) * u_matColor;
}
