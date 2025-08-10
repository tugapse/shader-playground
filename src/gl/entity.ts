import { Behaviour } from './behaviour';
import { Mesh } from './mesh'
import { Vec3 } from './vec';


export class GlEntity {

  public scale: Vec3 = Vec3.ONE;
  public rotation: Vec3 = Vec3.ONE
  public behaviours:Behaviour[] = []

  constructor(public name: String, public position: Vec3,  public mesh: Mesh) {

  }

  public update(elapsed: number): void {

  }

  public draw():void{

  }

}
