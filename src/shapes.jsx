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

    _fill(ctx){
        ctx.fill()
    }

    _makePath(ctx){
        console.error("_makePath() was called on an abstract Shape !")
    }

    svg(){console.error("svg() was called on an abstract Shape !")}
    
    draw(ctx){
        ctx.save()
        ctx.beginPath()
        this._makePath(ctx)
        this._fill(ctx)
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

export class Polyline extends Shape {
    constructor(p1, p2){
        super(p1, p2)
        this.points = [p1, p2]
    }

    right(){return this.points.sort((a,b) => b.x - a.x)[0].x}
    left(){return this.points.sort((a,b) => a.x - b.x)[0].x}
    bottom(){return this.points.sort((a,b) => b.y - a.y)[0].y}
    top(){return this.points.sort((a,b) => a.y - b.y)[0].y}

    changePoint(newPos){
        this.points.push(newPos)
        return this
    }

    _fill(ctx){
        ctx.lineWidth = 10
        ctx.stroke()
    }

    _makePath(ctx){
        this.points.map((p, i) => {
            if (i == 0){
                ctx.moveTo(p.x, p.y)
            } else {
                ctx.lineTo(p.x, p.y)
            }
        });
    }

    svg(){
        return "PROUT"
    }
}

export class Rect extends Shape {
    _makePath(ctx){
        ctx.rect(this.left(), this.top(), this.width(), this.height())
    }

    svg(){
        return `<rect x="${this.left()}" y="${this.top()}" width="${this.width()} height=${this.height()}"/>`
    }
}

export class Disk extends Shape {
    rx(){return parseInt(this.width() / 2)}
    ry(){return parseInt(this.height() / 2)}
    cx(){return parseInt((this.left() + this.right())/2)}
    cy(){return parseInt((this.top() + this.bottom())/2)}

    _makePath(ctx){
        if (this.rx() > 0 && this.ry() > 0){
            ctx.translate(this.cx()-this.rx(), this.cy()-this.ry())
            ctx.scale(this.rx(), this.ry())
            ctx.arc(1, 1, 1, 0, 2*Math.PI, false)
        }
    }

    svg(){
        return `<ellipse cx="${this.cx()}" cy="${this.cy()}" rx="${this.rx()}" ry="${this.ry()}"/>`
    }
}
