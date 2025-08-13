uniform mat4 u_mvpMatrix;
uniform float u_time;
uniform vec2 u_screenResolution;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_position;


void main() {
  v_uv = a_uv;

  v_normal = a_normal;
  v_position = a_position;

  gl_Position =  u_mvpMatrix * vec4(a_position, 1.0);
}
