precision mediump float;
uniform vec4 u_matColor;
varying vec2 v_uv;
uniform vec2 u_uvScale;


void main() {
  vec2 uv = v_uv * u_uvScale;
  gl_FragColor = u_matColor - vec4(fract(uv) ,1,1);
}
