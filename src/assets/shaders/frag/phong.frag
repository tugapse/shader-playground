#version 300 es
precision highp float;

uniform int u_fogEnabled;
uniform vec3 u_FogColor;
uniform float u_FogDensity;
uniform int u_fogType; // 0 for Linear, 1 for Exp, 2 for Exp2
uniform float u_FogHeightFalloff; // How fast fog drops off with height (e.g., 0.1)
uniform float u_FogBaseHeight;    // Baseline height where fog is at max density

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
in vec4 v_lightSpacePosition;
in float v_fogDistance;

out vec4 fragColor;

// All lighting uniforms and functions;
@INCLUDE_LIGHT_FUNC
@INCLUDE_FUNC

void main() {
  vec2 uv = fract(v_uv * u_uvScale) + u_uvOffset;
  vec4 sampledTexColor = texture(u_mainTex, uv);
  vec4 baseColor = vec4(sampledTexColor.rgb * u_matColor.rgb, (u_matColor.a * sampledTexColor.a));

  vec3 totalLitColorRGB = calculateTotalLitColor(baseColor.rgb, uv);

  vec4 finalColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
  vec3 foggedRGB = finalColor.rgb;

  if (u_fogEnabled == 1) {
    vec3 effectiveFogColor = u_FogColor;

    // Sun Inscattering (Atmospheric Glow)
    if (u_numDirectionalLights > 0) {
      // Direction from camera to fragment
      vec3 viewDir = normalize(v_position - u_cameraPosition);
      // Direction to the main sun/light
      vec3 lightDir = normalize(-u_directionalLightDirections[0]);
      
      // Calculate how directly we are looking into the sun
      float sunInscatter = max(0.0, dot(viewDir, lightDir));
      
      // Exponent controls the size of the glow (higher = smaller, sharper sun glow)
      sunInscatter = pow(sunInscatter, 8.0);
      
      // Blend the sun color into the fog color based on the inscattering factor
      vec3 sunGlowColor = u_directionalLightColors[0] * sunInscatter;
      effectiveFogColor += sunGlowColor;
    }

    // Exponential Height Fog
    // Modify density based on the fragment's Y height relative to a base height.
    // As height increases, density decreases exponentially.
    float heightDelta = max(0.0, v_position.y - u_FogBaseHeight);
    float heightDensityFactor = exp(-heightDelta * u_FogHeightFalloff);
    float effectiveDensity = u_FogDensity * heightDensityFactor;

    foggedRGB = applyFog(finalColor.rgb, effectiveFogColor, v_fogDistance, effectiveDensity, u_fogType);
  }
  fragColor = vec4(foggedRGB, finalColor.a);
}
