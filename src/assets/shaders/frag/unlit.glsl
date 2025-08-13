#version 300 es

precision mediump float;
uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_position;

out vec4 fragColor;

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  fragColor = texture(u_mainTex, uv) * u_matColor;
}
