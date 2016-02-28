import {Point} from './point.js'
import {Disk} from './shapes.js'

export class Drawable {
    constructor(isHole=false){
        this.isHole = isHole ? true : false
    }

    draw(ctx, texture){
        if (this.isHole){
            this.holeDraw(ctx)
        } else {
            this.textureDraw(ctx, texture)
        }
    }
}

export class Drawing extends Drawable {
    constructor(firstPoint, size, isHole=false, shape=Disk){
        super(isHole)
        this.points = [firstPoint]
        this.shape = shape
        this.lw = size
    }

    /* Bounding box */
    left(){return this.points.sort((a,b) => a.x - b.x)[0].x}
    right(){return this.points.sort((a,b) => b.x - a.x)[0].x}
    top(){return this.points.sort((a,b) => a.y - b.y)[0].y}
    bottom(){return this.points.sort((a,b) => b.y - a.y)[0].y}

    changePoint(newPos){
        this.points.push(newPos)
        return this
    }

    _eachPoint(func){
        let l = new Point(this.lw/2, this.lw/2)
        var p1 = this.points[0]
        this.points.forEach(p2 => {
            p1.to(p2, this.lw/2, p => {
                func(new this.shape(p.sub(l), p.add(l)))
            })
            p1 = p2
        })
    }

    area(){
        return this.points.length*this.lw*this.lw
    }

    needRedraw(){
        return false
    }

    holeDraw(ctx){
        this._eachPoint(shape => shape.holeDraw(ctx))
    }

    textureDraw(ctx, tex){
        this._eachPoint(shape => shape.textureDraw(ctx, tex))
    }
}
