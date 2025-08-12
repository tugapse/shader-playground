uniform mat4 u_mvpMatrix;
attribute vec2 a_position;
varying vec2 v_position;
varying vec2 v_uv;


void main() {
    gl_Position =  u_mvpMatrix * vec4(a_position, 0, 1.0);

    // Pass the position to the fragment shader
    v_position = a_position;

    // Calculate a texture coordinate (UV) from 0.0 to 1.0
    v_uv = a_position * 0.5 + 0.5;
}
