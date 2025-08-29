#version 300 es

in vec3 a_position;
in mat4 aInstanceModelMatrix; // This attribute will advance once per instance

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 v_position;

void main(void) {
  v_position = a_position;
  gl_Position =      uProjectionMatrix * uViewMatrix * aInstanceModelMatrix * vec4(a_position,0);
}
