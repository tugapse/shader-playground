/**
 * An enumeration of common uniform variable names used in shaders.
 *
 * These strings are used to link JavaScript variables to their corresponding uniforms in GLSL shaders,
 * ensuring consistency and preventing typos.
 */
export enum ShaderUniformsEnum {
  /**
   * General Uniforms
   */
  U_TIME = "u_time",
  /**
   * The screen resolution, which can be used for various purposes such as calculating the aspect ratio or determining the size of a texture.
   *
   * @type {string}
   */
  U_SCREEN_RESOLUTION = "u_screenResolution",
  /**
   * The model-view-projection (MVP) matrix, which is used to transform vertices from object space to screen space.
   *
   * @type {string}
   */
  U_MVP_MATRIX = "u_mvpMatrix",
  /**
   * The model matrix, which is used to transform vertices from object space to world space.
   *
   * @type {string}
   */
  U_MODEL_MATRIX = "u_modelMatrix",
  /**
   * The normal matrix, which is used to transform normals from tangent space to world space.
   *
   * @type {string}
   */
  U_NORMAL_MATRIX = "u_normalMatrix",
  /**
   * The world matrix, which is used to transform vertices from object space to world space.
   *
   * @type {string}
   */
  U_WORLD_MATRIX = "u_worldMatrix",
  /**
   * The inverse transpose of the world matrix, which is used for various purposes such as transforming normals or calculating the dot product.
   *
   * @type {string}
   */
  U_WORLD_INVERSE_TRANSPOSE_MATRIX = "u_worldInverseTransposeMatrix",

  /**
   * The material color, which can be used to tint the object's appearance.
   *
   * @type {string}
   */
  U_MAT_COLOR = "u_matColor",
  /**
   * The UV scale factor, which can be used to distort or stretch the texture coordinates.
   *
   * @type {string}
   */
  U_UV_SCALE = "u_uvScale",
  /**
   * The UV offset, which can be used to shift the texture coordinates.
   *
   * @type {string}
   */
  U_UV_OFFSET = "u_uvOffset",
  /**
   * The specular strength, which can be used to control the amount of shine on a surface.
   *
   * @type {string}
   */
  U_SPECULAR_STRENGTH = "u_specularStrength",
  /**
   * The roughness value, which can be used to control the amount of detail in a texture.
   *
   * @type {string}
   */
  U_ROUGHNESS = "u_roughness",

  /**
   * The main texture sampler, which can be used to sample colors from a texture.
   *
   * @type {string}
   */
  U_MAIN_TEX = "u_mainTex",
  /**
   * The normal map sampler, which can be used to sample normals from a texture.
   *
   * @type {string}
   */
  U_NORMAL_MAP = "u_normalMap",
  /**
   * The strength value for the normal map, which can be used to control the amount of detail in a texture.
   *
   * @type {string}
   */
  U_NORMAL_MAP_STRENGTH = "u_normalMapStrength",

  /**
   * The camera position, which can be used for various purposes such as calculating the direction of light or determining the perspective of a view.
   *
   * @type {string}
   */
  U_CAMERA_POSITION = "u_cameraPosition",

  /**
   * The attribute name for the position vector, which can be used to pass vertex data to a shader.
   *
   * @type {string}
   */
  A_POSITION = "a_position",
  /**
   * The attribute name for the normal vector, which can be used to pass vertex data to a shader.
   *
   * @type {string}
   */
  A_NORMAL = "a_normal",
  /**
   * The attribute name for the UV coordinates, which can be used to pass texture data to a shader.
   *
   * @type {string}
   */
  A_UV = "a_uv",
  /**
   * The attribute name for the tangent vector, which can be used to pass vertex data to a shader.
   *
   * @type {string}
   */
  A_TANGENT = "a_tangent",
  /**
   * The attribute name for the bitangent vector, which can be used to pass vertex data to a shader.
   *
   * @type {string}
   */
  A_BITANGENT = "a_bitangent",

  /**
   * The ambient light color, which can be used to simulate indirect lighting in a scene.
   *
   * @type {string}
   */
  U_AMBIENT_LIGHT = "u_ambientLight",
  /**
   * The number of directional lights in the scene.
   *
   * @type {number}
   */
  U_NUM_DIRECTIONAL_LIGHTS = "u_numDirectionalLights",
  /**
   * The direction of the first directional light, which can be used to calculate the lighting for a surface.
   *
   * @type {string}
   */
  U_DIRECTIONAL_LIGHT_DIRECTIONS = "u_directionalLightDirections[0]",
  /**
   * The color of the first directional light, which can be used to simulate direct lighting in a scene.
   *
   * @type {string}
   */
  U_DIRECTIONAL_LIGHT_COLORS = "u_directionalLightColors[0]",
  /**
   * The number of point lights in the scene.
   *
   * @type {number}
   */
  U_NUM_POINT_LIGHTS = "u_numPointLights",
  /**
   * The position of the first point light, which can be used to calculate the lighting for a surface.
   *
   * @type {string}
   */
  U_POINT_LIGHT_POSITIONS = "u_pointLightPositions[0]",
  /**
   * The color of the first point light, which can be used to simulate direct lighting in a scene.
   *
   * @type {string}
   */
  U_POINT_LIGHT_COLORS = "u_pointLightColors[0]",
  /**
   * The constant attenuation factor for the first point light, which can be used to control the amount of light emitted by a source.
   *
   * @type {string}
   */
  U_POINT_LIGHT_CONSTANT_ATTS = "u_pointLightConstantAtts[0]",
  /**
   * The linear attenuation factor for the first point light, which can be used to control the rate at which a light's intensity decreases with distance.
   *
   * @type {string}
   */
  U_POINT_LIGHT_LINEAR_ATTS = "u_pointLightLinearAtts[0]",
  /**
   * The quadratic attenuation factor for the first point light, which can be used to control the amount of light emitted by a source in relation to its position.
   *
   * @type {string}
   */
  U_POINT_LIGHT_QUADRATIC_ATTS = "u_pointLightQuadraticAtts[0]",
  /**
   * The number of spot lights in the scene.
   *
   * @type {number}
   */
  U_NUM_SPOT_LIGHTS = "u_numSpotLights",
  /**
   * The position of the first spot light, which can be used to calculate the lighting for a surface.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_POSITIONS = "u_spotLightPositions[0]",
  /**
   * The direction of the first spot light, which can be used to determine whether a point is within the spotlight's cone of illumination.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_DIRECTIONS = "u_spotLightDirections[0]",
  /**
   * The color of the first spot light, which can be used to simulate direct lighting in a scene.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_COLORS = "u_spotLightColors[0]",
  /**
   * The cosine of the inner angle of the first spot light's cone, which can be used to determine whether a point is within the spotlight's cone of illumination.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_INNER_CONE_COS = "u_spotLightInnerConeCos[0]",
  /**
   * The cosine of the outer angle of the first spot light's cone, which can be used to determine whether a point is within the spotlight's cone of illumination.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_OUTER_CONE_COS = "u_spotLightOuterConeCos[0]",
  /**
   * The constant attenuation factor for the first spot light, which can be used to control the amount of light emitted by a source.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_CONSTANT_ATTS = "u_spotLightConstantAtts[0]",
  /**
   * The linear attenuation factor for the first spot light, which can be used to control the rate at which a light's intensity decreases with distance.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_LINEAR_ATTS = "u_spotLightLinearAtts[0]",
  /**
   * The quadratic attenuation factor for the first spot light, which can be used to control the amount of light emitted by a source in relation to its position.
   *
   * @type {string}
   */
  U_SPOT_LIGHT_QUADRATIC_ATTS = "u_spotLightQuadraticAtts[0]",

  /**
   * --- Shadow Mapping ---
   */
  /**
   * The MVP matrix used for shadow mapping, which can be used to project a surface's geometry onto the light's plane.
   *
   * @type {string}
   */
  U_LIGHT_MVP_MATRIX = "u_lightMVPMatrix",
  /**
   * The shadow map texture, which stores information about the shadows cast by objects in a scene.
   *
   * @type {string}
   */
  U_SHADOW_MAP = "u_shadow_map"
}