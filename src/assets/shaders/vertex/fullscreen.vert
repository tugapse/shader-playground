#version 300 es

uniform mat4 u_mvpMatrix;
uniform float u_time;
uniform vec2 u_screenResolution;

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_position;


void main() {
  v_uv = a_uv;
  v_normal = a_normal;
  v_position = a_position;

  gl_Position =   vec4(a_position, 1.0);
}
