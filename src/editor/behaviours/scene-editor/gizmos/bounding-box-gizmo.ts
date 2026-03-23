import { BoundingBox, RendererBehaviour, Vector3 } from "@engine";
import { Color } from "@engine/core/color";
import { Colors } from "@engine/core/colors";

export class BoundingBoxGizmo {
  /** The color of the bounding box for the selected entity. */
  public selectedBoundingBoxColor: Color = Colors.gray;
  /** The line width for the selected entity's bounding box. */
  public selectedBoundingBoxLineWidth = 3.0;

  constructor(private renderer: RendererBehaviour) {}

  /**
   * Draws the wireframe of a bounding box.
   * @param boundingBox The bounding box to draw.
   * @param spacing An optional padding to add around the box.
   */
  drawBoundingBox(boundingBox: BoundingBox, spacing = 0.1) {

    const { min_x, min_y, min_z, max_x, max_y, max_z } = boundingBox;

    // looking from front
    // top left far left quad
    const topLeftFar = new Vector3(min_x - spacing, max_y + spacing, min_z - spacing);
    const topLeftNear = new Vector3(min_x - spacing, max_y + spacing, max_z + spacing);
    const bottomLeftFar = new Vector3(min_x - spacing, min_y - spacing, min_z - spacing);
    const bottomLeftNear = new Vector3(min_x - spacing, min_y - spacing, max_z + spacing);

    this.renderer.drawLine(topLeftFar, topLeftNear);
    this.renderer.drawLine(bottomLeftFar, bottomLeftNear);
    this.renderer.drawLine(topLeftFar, bottomLeftFar);
    this.renderer.drawLine(topLeftNear, bottomLeftNear);

    // top right far right quad
    const topRightFar = new Vector3(max_x + spacing, max_y + spacing, min_z - spacing);
    const topRightNear = new Vector3(max_x + spacing, max_y + spacing, max_z + spacing);
    const bottomRightFar = new Vector3(max_x + spacing, min_y - spacing, min_z - spacing);
    const bottomRightNear = new Vector3(max_x, min_y - spacing, max_z + spacing);

    this.renderer.drawLine(topRightFar, topRightNear);
    this.renderer.drawLine(bottomRightFar, bottomRightNear);
    this.renderer.drawLine(topRightFar, bottomRightFar);
    this.renderer.drawLine(topRightNear, bottomRightNear);

    // horizontal lines
    this.renderer.drawLine(topLeftFar, topRightFar);
    this.renderer.drawLine(topLeftNear, topRightNear);
    this.renderer.drawLine(bottomLeftFar, bottomRightFar);
    this.renderer.drawLine(bottomLeftNear, bottomRightNear);

  }

}
