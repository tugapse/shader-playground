import { Camera } from "./camera";
import { GlEntity } from "./entity";
import { Vec3 } from "./vec";

export class Scene extends GlEntity{
  private static _currentScene:Scene;
  public static get currentScene(){ return this._currentScene}

  private _camera: Camera
  private _objects:GlEntity[];


  public get camera(): Camera{ return this._camera}
  public get objects():GlEntity[]{return this._objects}

  constructor(private gl : WebGLRenderingContext){
    super("Scene",Vec3.ZERO);
    this._camera =  new Camera("Camera",Vec3.ZERO);
    this._objects = []
    Scene._currentScene = this;
  }

  public override update(ellapsed:number):void {
    for( const object of this.objects){
      object.update(ellapsed);
    }
  }

  public override draw():void {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    for( const object of this.objects){
      object.draw();
    }
  }

  public getObject(name:string){
    return this.objects.find(o=>o.name === name);
  }

}
