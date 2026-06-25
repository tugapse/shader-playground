/* eslint-disable */
// @ts-nocheck
export class ShaderSources {
  public static readonly frag = {
    handle: 'assets/shaders/editor/handle/handle.frag',
    entity: 'assets/shaders/editor/picker/entity.frag',
    color: 'assets/shaders/frag/color.frag',
    debug: 'assets/shaders/frag/debug.frag',
    depth_only: 'assets/shaders/frag/depth-only.frag',
    entity_picker: 'assets/shaders/frag/entity-picker.frag',
    phong: 'assets/shaders/frag/phong.frag',
    screen_blit: 'assets/shaders/frag/screen-blit.frag',
    skybox: 'assets/shaders/frag/skybox.frag',
    unlit: 'assets/shaders/frag/unlit.frag',
    fog: 'assets/shaders/functions/fog.frag',
    functions: 'assets/shaders/functions/functions.frag',
    light_header: 'assets/shaders/functions/light-header.frag',
    light: 'assets/shaders/functions/light.frag',
    light_old: 'assets/shaders/functions/light_old.frag',
    retro: 'assets/shaders/post-processing/retro.frag',
  };
  public static readonly vertex = {
    handle: 'assets/shaders/editor/handle/handle.vert',
    entity: 'assets/shaders/editor/picker/entity.vert',
    billdboard: 'assets/shaders/vertex/billdboard.vert',
    fullscreen: 'assets/shaders/vertex/fullscreen.vert',
    screen_quad: 'assets/shaders/vertex/screen-quad.vert',
    shadow_caster: 'assets/shaders/vertex/shadow-caster.vert',
    skybox: 'assets/shaders/vertex/skybox.vert',
    vertex: 'assets/shaders/vertex/vertex.vert',
  };
}
