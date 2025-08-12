uniform mat4 u_mvpMatrix;
uniform float u_time;
uniform vec2 u_screenResolution;


attribute vec3 a_position;
varying vec2 v_uv;


void main() {
  v_uv = a_position.xy * 0.5 + 0.5;
  gl_Position =  u_mvpMatrix * vec4(a_position,1.0);
}
