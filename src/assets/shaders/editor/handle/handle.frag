#version 300 es

precision mediump float;
in vec3 v_position;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_position,1.0);
}
