#version 300 es

layout(std140) uniform CameraBlock {
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
};

uniform mat4 u_modelMatrix;

in vec4 a_position;

void main() {
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_position;
}