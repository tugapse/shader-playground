import { GlEntity } from "./entity";

export abstract class EntityBehaviour {

  constructor(public parent: GlEntity){}

  public abstract initialize():void;
  public abstract update(ellapsed:number):void;
  public abstract draw():void;
}
