#version 300 es
precision highp float;

void main() {
    // The main purpose of this shader is to render the depth
    // to the framebuffer. Since we are using a depth texture,
    // we don't need to write anything to fragColor. The depth
    // value is automatically stored by the GPU.
    // So, this main function can be empty.
}
