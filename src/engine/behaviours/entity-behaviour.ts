import { GlEntity } from "../entities/entity";

export abstract class EntityBehaviour {

  public parent!:GlEntity;
  constructor(){}

  public initialize():void{}
  public update(ellapsed:number):void{}
  public draw():void{}
  public destroy():void{}
}
