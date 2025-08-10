import { GlEntity } from "./entity";

export abstract class EntityBehaviour {

  constructor(public parent: GlEntity){}

  public initialize():void{}
  public update(ellapsed:number):void{}
  public draw():void{}
}
