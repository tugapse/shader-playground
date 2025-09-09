#version 300 es

precision mediump float;
uniform vec4 u_matColor;
uniform float u_id;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = u_matColor;
  if (u_id > 0.0) {
    fragColor = vec4(u_id / 255.0, 0.0, 0.0, 1.0);
  }
}
