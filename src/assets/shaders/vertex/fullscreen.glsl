attribute vec3 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position.xy * 0.5 + 0.5;
  gl_Position =  vec4(a_position.x, a_position.y + animationOffset, a_position.z, 1.0);
}
