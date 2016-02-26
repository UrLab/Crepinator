import Point from './point.js'

class Shape {
    constructor(p1, p2){
        this.p1 = p1
        this.p2 = p2
    }

    left(){return Math.min(this.p1.x, this.p2.x)}
    right(){return Math.max(this.p1.x, this.p2.x)}
    top(){return Math.min(this.p1.y, this.p2.y)}
    bottom(){return Math.max(this.p1.y, this.p2.y)}
    width(){return this.right() - this.left()}
    height(){return this.bottom() - this.top()}
    area(){return this.width() * this.height()}

    overlap(other){
        return (this.left() <= other.left() && other.left() < this.right()) ||
               (other.left() <= this.left() && this.left() < other.right());
    }

    changePoint(newPos){
        this.p2 = newPos
        return this
    }

    _makePath(ctx){
        console.error("_makePath() was called on an abstract Shape !")
    }
    
    needRedraw(){
        return true
    }

    draw(ctx){
        ctx.save()
        ctx.beginPath()
        this._makePath(ctx)
        ctx.fill()
        ctx.restore()
    }

    textureDraw(ctx, texture){
        ctx.save()
        ctx.beginPath()
        this._makePath(ctx)
        ctx.clip()
        ctx.drawImage(texture, 0, 0);
        ctx.restore()
    }
}

export class Rect extends Shape {
    _makePath(ctx){
        ctx.rect(this.left(), this.top(), this.width(), this.height())
    }
}

export class Disk extends Shape {
    rx(){return parseInt(this.width() / 2)}
    ry(){return parseInt(this.height() / 2)}
    cx(){return parseInt((this.left() + this.right())/2)}
    cy(){return parseInt((this.top() + this.bottom())/2)}

    _makePath(ctx){
        if (this.rx() > 0 && this.ry() > 0){
            ctx.save()
            ctx.translate(this.cx()-this.rx(), this.cy()-this.ry())
            ctx.scale(this.rx(), this.ry())
            ctx.arc(1, 1, 1, 0, 2*Math.PI, false)
            ctx.restore()
        }
    }
}
