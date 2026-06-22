#version 300 es
uniform mat4 u_modelMatrix; // This now holds the Light-Space MVP matrix
in vec4 a_position;

void main() {
    gl_Position = u_modelMatrix * a_position;
}