#version 300 es
precision highp float;

uniform float u_entity_id;
out vec4 fragColor;

void main() { fragColor = vec4(u_entity_id / 255.0, 0.0, 0.0, 1.0); }
