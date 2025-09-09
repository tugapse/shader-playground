#version 300 es
uniform mat4 u_mvpMatrix;
in vec4 a_position;
void main() { gl_Position = u_mvpMatrix * a_position; }
