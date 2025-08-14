#version 300 es

precision mediump float;
uniform vec4 u_matColor;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = u_matColor;
}
