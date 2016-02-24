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

    changePoint(newPos){
        this.p2 = newPos
        return this
    }

    svg(){console.error("svg() was called on an abstract Shape !")}
    draw(ctx){console.error("draw() was called on an abstract Shape !")}
}

export class Rect extends Shape {
    draw(ctx){
        ctx.beginPath()
        ctx.rect(this.left(), this.top(), this.width(), this.height())
        ctx.fill()
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

    draw(ctx){
        ctx.save()
        ctx.beginPath()
        ctx.translate(this.cx()-this.rx(), this.cy()-this.ry())
        ctx.scale(this.rx(), this.ry())
        ctx.arc(1, 1, 1, 0, 2*Math.PI, false)
        ctx.fill()
        ctx.restore()
    }

    svg(){
        return `<ellipse cx="${this.cx()}" cy="${this.cy()}" rx="${this.rx()}" ry="${this.ry()}">`
    }
}
