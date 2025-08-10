import { Mesh } from './mesh'
import { Vec3 } from './vec';


export class GlEntity{

  public scale:Vec3=Vec3.ONE;
  public rotation:Vec3=Vec3.ONE

  constructor(public name:String, public position: Vec3, public mesh:Mesh){

  }
}
