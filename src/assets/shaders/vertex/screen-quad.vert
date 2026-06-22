#version 300 es
out vec2 v_uv;

// Generate a full-screen triangle using the gl_VertexID trick
void main() {
    // Calculate vertices entirely on the GPU
    float x = float((gl_VertexID & 1) << 2) - 1.0;
    float y = float((gl_VertexID & 2) << 1) - 1.0;
    
    // Map the -1.0 to 1.0 NDC space to 0.0 to 1.0 UV space
    v_uv = vec2(x * 0.5 + 0.5, y * 0.5 + 0.5);
    
    gl_Position = vec4(x, y, 0.0, 1.0);
}