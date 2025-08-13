import { EntityBehaviour } from "../behaviours/entity-behaviour";
import { Transform } from "../core/transform";



export class GlEntity {


  public behaviours: EntityBehaviour[] = []
  public active :boolean = true;

  constructor(public name: String, public transform:Transform) { }

  public initialize(){
    for(const behaviour of this.behaviours){
      behaviour.initialize();
    }
  }

  public update(ellapsed: number): void {
    if(!this.active) return;

    for(const behaviour of this.behaviours){
      behaviour.update(ellapsed);
    }
  }

  public draw(): void {
    if(!this.active) return;

    for(const behaviour of this.behaviours){
      behaviour.draw();
    }
  }

  public destroy(){
    for(const behaviour of this.behaviours){
      behaviour.destroy();
    }
  }
}
