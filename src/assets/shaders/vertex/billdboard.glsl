#version 300 es

// Standard matrices for camera projection and view
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

// This u_worldMatrix should ONLY contain the billboard's translation and scale.
// The rotation will be handled in this shader to make it face the camera.
uniform mat4 u_worldMatrix;

// Assuming your billboard quad uses these attributes
in vec3 a_position; // Typically a simple quad: e.g., (-0.5,-0.5,0) to (0.5,0.5,0)
in vec2 a_uv;

out vec2 v_uv;

void main() {
  // 1. Get the world position of the billboard's origin (center)
  // We extract the translation component from the object's u_worldMatrix.
  // This is where the billboard will be placed in the 3D world.
  vec3 billboardWorldPosition = (u_worldMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

  // 2. Get the camera's world-space rotation (from the inverse of the view matrix)
  // This inverseViewMatrix's upper-left 3x3 submatrix represents the camera's
  // rotation in world space. By using it, we orient the billboard to face the camera.
  mat4 inverseViewMatrix = inverse(u_viewMatrix);

  // Extract the 3x3 rotation component of the inverse view matrix.
  // We create a new 4x4 matrix with this rotation and zero out the translation part.
  mat4 billboardRotationMatrix = mat4(
      inverseViewMatrix[0][0], inverseViewMatrix[0][1], inverseViewMatrix[0][2], 0.0,
      inverseViewMatrix[1][0], inverseViewMatrix[1][1], inverseViewMatrix[1][2], 0.0,
      inverseViewMatrix[2][0], inverseViewMatrix[2][1], inverseViewMatrix[2][2], 0.0,
      0.0, 0.0, 0.0, 1.0
  );

  // 3. Transform the local vertex position (a_position)
  // First, apply any scaling that was part of u_worldMatrix (already handled by u_worldMatrix's setup
  // if you apply scale before translation/rotation on CPU).
  // Then, apply the camera-facing rotation to the vertex.
  // Finally, add the billboard's world position.
  vec4 finalPosition = billboardRotationMatrix * vec4(a_position, 1.0);
  finalPosition.xyz += billboardWorldPosition; // Add the world translation

  // 4. Transform the final world position into clip space
  gl_Position = u_projectionMatrix * u_viewMatrix * finalPosition;

  // Pass UV coordinates directly to the fragment shader
  v_uv = a_uv;

  // For billboards, we typically don't need v_normal, v_position, v_tangent, v_bitangent
  // as lighting is often simplified or done differently (e.g., emissive texture).
  // If you needed basic lighting, v_position could be passed and v_normal would typically
  // be (0,0,1) in billboard's local space then transformed by the billboardRotationMatrix.
}
