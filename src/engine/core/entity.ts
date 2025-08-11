import { EntityBehaviour } from './entity-behaviour';
import { Vec3 } from './vec';


export class GlEntity {


  public behaviours: EntityBehaviour[] = []
  public active :boolean = true;

  constructor(public name: String, public position: Vec3,
    public scale: Vec3 = Vec3.ONE,
    public rotation: Vec3 = Vec3.ONE) {

  }

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
