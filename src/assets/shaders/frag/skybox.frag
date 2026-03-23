#version 300 es

precision mediump float;

uniform samplerCube u_mainTex;
uniform vec4 u_matColor;
uniform vec4 u_horizonColor;
uniform float u_horizonStart;
uniform float u_horizonHeight;
uniform float u_gradient;
uniform float u_exposure;

in vec3 v_viewDirection;

out vec4 fragColor;

void main() {

  vec4 textColor = texture(u_mainTex, normalize(v_viewDirection));
  vec4 finalColor = textColor * u_matColor;
  finalColor = finalColor * u_matColor;
  fragColor = clamp(finalColor, 0.0, 1.0);
}
