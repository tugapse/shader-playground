

export class Vec4{

  public static readonly ZERO=new Vec4(0,0,0,0);
  public static readonly ONE=new Vec4(0,0,0,0);


    constructor(public x:number,public y:number,public z:number,public w:number ){ }
    public add<T>(vec1:Vec4,vec2:Vec4):T{
      return new Vec4( vec1.x+vec2.x,vec1.y+vec2.y,vec1.z+vec2.z,vec1.w+vec2.w ) as T;
    }
}

export class Vec3 extends Vec4{
    constructor(public override x:number,public override y:number,public override z:number){
      super(x,y,z,0)
    }
}

export class Vec2 extends Vec4{
    constructor(public override x:number,public override y:number){
      super(x,y,0,0)
    }
}
