precision mediump float;
varying vec2 v_position;

void main() {
    // Convert the position from -1.0 to 1.0 range to a 0.0 to 1.0 range for color
    vec2 color = v_position * 0.5 + 0.5;

    // Use the coordinates as color values
    gl_FragColor = vec4(color.x, color.y, 0.0, 1.0);
}
