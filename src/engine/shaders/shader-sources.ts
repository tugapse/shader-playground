/* eslint-disable */
// @ts-nocheck
export class ShaderSources {
  public static readonly frag = {
    entity_picker: 'assets/shaders/editor/entity-picker.frag',
    handle: 'assets/shaders/editor/handle/handle.frag',
    entity: 'assets/shaders/editor/picker/entity.frag',
    color: 'assets/shaders/frag/color.frag',
    default_lit: 'assets/shaders/frag/default-lit.frag',
    default_unlit: 'assets/shaders/frag/default-unlit.frag',
    depth_only: 'assets/shaders/frag/depth-only.frag',
    screen_blit: 'assets/shaders/frag/screen-blit.frag',
    skybox: 'assets/shaders/frag/skybox.frag',
    fog: 'assets/shaders/functions/fog.frag',
    functions: 'assets/shaders/functions/functions.frag',
    light_header: 'assets/shaders/functions/light-header.frag',
    light: 'assets/shaders/functions/light.frag',
    light_old: 'assets/shaders/functions/light_old.frag',
    retro: 'assets/shaders/post-processing/retro.frag',
    bitangent: 'assets/shaders/tools/bitangent.frag',
    normal: 'assets/shaders/tools/normal.frag',
    tangent: 'assets/shaders/tools/tangent.frag',
    uv: 'assets/shaders/tools/uv.frag',
  };
  public static readonly vertex = {
    handle: 'assets/shaders/editor/handle/handle.vert',
    entity: 'assets/shaders/editor/picker/entity.vert',
    default: 'assets/shaders/vertex/default.vert',
    fullscreen: 'assets/shaders/vertex/fullscreen.vert',
    screen_quad: 'assets/shaders/vertex/screen-quad.vert',
    shadow_caster: 'assets/shaders/vertex/shadow-caster.vert',
    skybox: 'assets/shaders/vertex/skybox.vert',
  };
}
