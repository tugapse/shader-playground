#version 300 es
in vec2 a_position; // Full screen quad coords (-1 to 1)
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}