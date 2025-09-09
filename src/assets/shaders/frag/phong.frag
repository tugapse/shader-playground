#version 300 es
precision highp float;

@INCLUDE_LIGHT_HEADER

    uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform sampler2D u_mainTex;
uniform sampler2D u_normalMap;
uniform float u_emmission;
uniform float u_id;
uniform float u_sid;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_position;

in vec3 v_tangent;
in vec3 v_bitangent;

out vec4 fragColor;

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;

  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = vec4(sampledTexColor.rgb * u_matColor.rgb,
                        (u_matColor.a * sampledTexColor.a));

  @INCLUDE_LIGHT_FUNC

      // --- Final Color Output ---
      // Clamp the final lit color to the [0.0, 1.0] range before outputting.
      // fragColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
      fragColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);

  if (u_id > 0.0) {
    fragColor = vec4(u_id / 255.0, 0.0, 0.0, 1.0);
  }
}
