#version 300 es

uniform mat3 u_worldInverseTransposeMatrix;
uniform mat4 u_mvpMatrix;

in vec3 a_position;
in vec3 a_normal;

out vec3 v_normal;
out vec3 v_position;

void main() {
  v_position = a_position;
  gl_Position =  u_mvpMatrix * vec4(a_position, 1.0);
}
