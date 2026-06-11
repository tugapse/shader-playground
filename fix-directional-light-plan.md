# Plan to Fix Multiple Directional Lights

## The Issue

The light engine currently only renders a single directional light due to limitations hardcoded in the lighting fragment shader (`src/assets/shaders/functions/light.frag`).

Specifically:
1. The shader defines the maximum number of directional lights to 1:
   ```glsl
   #define MAX_DIRECTIONAL_LIGHTS 1
   ```
2. The directional lighting logic does not loop over the available directional lights (`u_numDirectionalLights`). Instead, it strictly accesses index `[0]` for directions and colors:
   ```glsl
   vec3 lightDir = normalize(-u_directionalLightDirections[0]);
   ...
   totalLitColorRGB += (diffuse + specular) * u_directionalLightColors[0] * shadowFactor;
   ```

Because of this, any additional directional lights added to the scene are completely ignored by the final lighting calculation.

Also, the shadow mapping logic in `MeshRendererBehaviour` currently only passes the light MVP matrix (`v_lightSpacePosition`) for the **first** directional light found in the scene. If we add multiple directional lights, only the primary one should cast shadows using the existing setup.

## The Solution

To support multiple directional lights, we need to apply the following changes:

### 1. Update `src/assets/shaders/functions/light.frag`
*   Increase the limit of `MAX_DIRECTIONAL_LIGHTS` to a reasonable amount, such as `5` (which matches `light-header.frag`).
*   Wrap the directional lighting calculation in a `for` loop over `u_numDirectionalLights`.
*   Calculate the `shadowFactor` for the first light (`i == 0`), while defaulting the shadow factor to `1.0` for any subsequent directional lights.

**Proposed Shader Change:**
```glsl
// Change constant to 5
#define MAX_DIRECTIONAL_LIGHTS 5

...

// Replace the hardcoded [0] directional lighting logic with:
for (int i = 0; i < u_numDirectionalLights; ++i) {
  vec3 lightDir = normalize(-u_directionalLightDirections[i]);
  float ndotl = dot(finalNormal, lightDir);
  float diffuseIntensity = max(ndotl, 0.0);
  vec3 halfVec = normalize(lightDir + viewDir);
  
  float currentShadowFactor = 1.0;
  // Apply shadows only to the primary directional light
  if (i == 0) {
    currentShadowFactor = is_in_shadow_pcf(v_lightSpacePosition, finalNormal, lightDir);
  }

  float specularIntensity =
      pow(max(0.0, dot(finalNormal, halfVec)), shininess) * u_specularStrength;
  vec3 diffuse = baseColor * diffuseIntensity;
  vec3 specular = vec3(1.0) * specularIntensity; 
  totalLitColorRGB += (diffuse + specular) * u_directionalLightColors[i] * currentShadowFactor;
}
```

### 2. Re-generate Shader Sources
After editing the `.frag` files in `src/assets/shaders`, we need to run the auto-generation script to update the built-in shader sources string used by the engine runtime:

```bash
node generate-shaders.js
```
This updates `src/engine/shaders/shader-sources.ts`.

With these changes, the engine will correctly loop through and draw multiple directional lights while preserving shadow mapping for the primary light source.