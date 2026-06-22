#version 300 es

precision highp float;

// 1. The shared Camera UBO
layout(std140) uniform CameraBlock {
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
};

in vec3 a_position;
out vec3 v_viewDirection;

void main() {
  // 2. STRIP THE TRANSLATION
  // We cast the view matrix down to a mat3 to drop the XYZ position data, 
  // then back to a mat4. This forces the skybox to only rotate, never move.
  mat4 viewRotationOnly = mat4(mat3(u_viewMatrix));

  // 3. Calculate the clip-space position
  vec4 pos = u_projectionMatrix * viewRotationOnly * vec4(a_position, 1.0);

  // 4. THE DEPTH TRICK
  // We set Z equal to W (pos.xyww). When WebGL does the perspective divide (W/W), 
  // the depth becomes exactly 1.0 (the maximum possible depth). 
  // This guarantees the skybox renders behind absolutely everything else.
  gl_Position = pos.xyww;

  // The local vertex position serves as the direction vector for the cubemap
  v_viewDirection = a_position;
}