import { MeshData } from "omega-game-engine";
import { BoundingBox, BoundingSphere } from "./bounding-box";

export class EMeshData extends MeshData {



  /**
   * Calculates the bounding box for this mesh using its internal vertices.
   *
   * @returns A BoundingBox object, or null if the mesh has no vertices.
   */
  get_bounding_box(): BoundingBox | null {
    if (this.vertices.length === 0) {
      return null;
    }

    // Initialize min and max values with the first vertex
    let min_x = this.vertices[0][0];
    let max_x = this.vertices[0][0];
    let min_y = this.vertices[0][1];
    let max_y = this.vertices[0][1];
    let min_z = this.vertices[0][2];
    let max_z = this.vertices[0][2];

    // Iterate through each vertex array
    for (const vertex of this.vertices) {
      const x = vertex[0];
      const y = vertex[1];
      const z = vertex[2];

      // Update min and max values
      min_x = Math.min(min_x, x);
      max_x = Math.max(max_x, x);
      min_y = Math.min(min_y, y);
      max_y = Math.max(max_y, y);
      min_z = Math.min(min_z, z);
      max_z = Math.max(max_z, z);
    }

    return new BoundingBox(min_x, max_x, min_y, max_y, min_z, max_z);
  }

  /**
 * Calculates a bounding sphere for this mesh using its internal vertices.
 * The sphere's center is the mesh's centroid.
 *
 * @returns A BoundingSphere object, or null if the mesh has no vertices.
 */
  get_bounding_sphere(): BoundingSphere | null {
    if (this.vertices.length === 0) {
      return null;
    }

    // First, calculate the centroid of the mesh
    let sum_x = 0;
    let sum_y = 0;
    let sum_z = 0;
    for (const vertex of this.vertices) {
      sum_x += vertex[0];
      sum_y += vertex[1];
      sum_z += vertex[2];
    }
    const numVertices = this.vertices.length;
    const center_x = sum_x / numVertices;
    const center_y = sum_y / numVertices;
    const center_z = sum_z / numVertices;

    // Then, find the maximum distance from the centroid to any vertex
    let max_radius_squared = 0;
    for (const vertex of this.vertices) {
      const dx = vertex[0] - center_x;
      const dy = vertex[1] - center_y;
      const dz = vertex[2] - center_z;
      const distance_squared = dx * dx + dy * dy + dz * dz;
      max_radius_squared = Math.max(max_radius_squared, distance_squared);
    }
    const radius = Math.sqrt(max_radius_squared);

    return new BoundingSphere(center_x, center_y, center_z, radius);
  }

}
