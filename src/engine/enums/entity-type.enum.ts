/**
  An enumeration representing the different types of entities in the engine.
 * The numerical values are used for serialization and identification.
 */
export enum EntityType {
  /**
    A static entity, which typically does not move and is primarily used for level geometry.
   */
  STATIC = -1,
  /**
    An ambient light source, providing non-directional, uniform lighting.
   */
  LIGHT_AMBIENT = 0,
  /**
    A directional light source, simulating light from a distant source like the sun.
   */
  LIGHT_DIRECTIONAL = 1,
  /**
    A point light source, emitting light in all directions from a single point.
   */
  LIGHT_POINT = 2,
  /**
    A spotlight, which casts a cone of light in a specific direction.
   */
  LIGHT_SPOT = 3,
  /**
    A camera entity, used to render the scene from a specific perspective.
   */
  CAMERA = 4,
  /**
    A scene entity, acting as the root container for all other entities.
   */
  SCENE = 5,
}