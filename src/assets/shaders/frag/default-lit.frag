#version 300 es
precision highp float;

uniform int u_fogEnabled; 

uniform sampler2D u_mainTex;
uniform vec4 u_matColor;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform float u_emmission;
uniform float u_id;
uniform float u_sid;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_position;
in vec3 v_tangent;
in vec3 v_bitangent;
in vec4 v_lightSpacePosition;

out vec4 fragColor;

@INCLUDE_UTIL_FUNC
@INCLUDE_LIGHT_FUNC
@INCLUDE_FOG_FUNC
void main() {
    vec2 uv = (v_uv * u_uvScale) + u_uvOffset;
    vec4 sampledTexColor = texture(u_mainTex, uv);
    
    // We add a tiny offset (0.0001) to avoid pow(0, ...) undefined behavior in some older drivers
    vec3 linearTexColor = pow(sampledTexColor.rgb + 0.0001, vec3(2.2));
    vec3 linearMatColor = pow(u_matColor.rgb + 0.0001, vec3(2.2)); 
    
    vec4 baseColor = vec4(linearTexColor * linearMatColor, (u_matColor.a * sampledTexColor.a));

    // Lighting calculation (math is now accurately happening in linear space)
    vec3 totalLitColorRGB = calculateTotalLitColor(baseColor.rgb, uv);

    vec4 finalColor = vec4(clamp(totalLitColorRGB, 0.0, 1.0), baseColor.a);
    vec3 foggedRGB = finalColor.rgb;

    // Fog application (fog math also blends much better in linear space)
    if (u_fogEnabled == 1) {
        vec3 mainLightDir = u_numDirectionalLights > 0 ? u_directionalLightDirections[0] : vec3(0.0);
        vec3 mainLightCol = u_numDirectionalLights > 0 ? u_directionalLightColors[0] : vec3(0.0);
        
        foggedRGB = applyFog(
            finalColor.rgb, 
            v_fogDistance, 
            v_position, 
            u_cameraPosition, 
            u_numDirectionalLights, 
            mainLightDir, 
            mainLightCol
        );
    }
  
    // 4. Gamma Correction: Convert the final linear color back to sRGB for the monitor
    vec3 gammaCorrectedRGB = pow(foggedRGB, vec3(1.0 / 2.2));
    
    fragColor = vec4(gammaCorrectedRGB, finalColor.a);
}