#version 300 es

uniform mat4 u_mvpMatrix;
uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat3 u_worldInverseTransposeMatrix;

uniform float u_time;
uniform vec2 u_screenResolution;

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

in vec3 a_tangent;
in vec3 a_bitangent;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_position;
out vec3 v_position_view;

out vec3 v_tangent;
out vec3 v_bitangent;

void main() {
  v_position = (u_worldMatrix * vec4(a_position, 1.0)).xyz;
  v_position_view = (u_viewMatrix * u_worldMatrix * vec4(a_position, 1.0)).xyz;
  v_normal = u_worldInverseTransposeMatrix * a_normal;
  v_tangent = u_worldInverseTransposeMatrix * a_tangent;
  v_bitangent = u_worldInverseTransposeMatrix * a_bitangent;
  v_uv = a_uv;
  gl_Position =  u_mvpMatrix * vec4(a_position, 1.0);
  gl_PointSize = 10.0;
}
