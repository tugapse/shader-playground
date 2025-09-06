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

/*#INCLUDE_FUNC*/

void main() {

  float posY = (v_viewDirection.y - u_horizonStart);
  float fade = smoothstep(u_horizonStart, u_horizonHeight + u_gradient, (posY));

  vec4 textColor = texture(u_mainTex, normalize(v_viewDirection));
  vec4 finalColor = textColor* u_matColor;

  // if (v_viewDirection.y < u_horizonStart) {
  //   finalColor = finalColor * u_horizonColor * fade;
  // } else {
  //   finalColor = finalColor * mix(u_horizonColor, u_matColor, fade);
  // }

  finalColor = finalColor * u_matColor;
  finalColor = mix(finalColor , u_horizonColor, fade);

  fragColor = clamp(finalColor, 0.0, 1.0);
}
