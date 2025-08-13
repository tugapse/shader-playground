precision mediump float;
uniform vec4 u_matColor;
varying vec2 v_uv;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;


void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  gl_FragColor = texture2D(u_mainTex, uv) * u_matColor;
}
