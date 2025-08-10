import { EntityBehaviour } from './entity-behaviour';
import { Mesh } from './mesh'
import { Vec3 } from './vec';


export class GlEntity {


  public behaviours: EntityBehaviour[] = []

  constructor(public name: String, public position: Vec3,
    public scale: Vec3 = Vec3.ONE,
    public rotation: Vec3 = Vec3.ONE) {

  }

  public update(elapsed: number): void {

  }

  public draw(): void {

  }

}
