class Shape {
    constructor(posmin, posmax){
        this.xmin = posmin.x;
        this.ymin = posmin.y;
        this.xmin = posmax.x;
        this.ymin = posmax.y;
    }

    left(){return Math.min(this.xmin, this.xmax)}
    right(){return Math.max(this.xmin, this.xmax)}
    top(){return Math.min(this.ymin, this.ymax)}
    bottom(){return Math.max(this.ymin, this.ymax)}
    width(){return this.right() - this.left()}
    height(){return this.bottom() - this.top()}

    changeMax(newPos){
        this.xmax = newPos.x;
        this.ymax = newPos.y;
        return this;
    }

    svg(){console.error("svg() was called on an abstract Shape !");}
    draw(ctx){console.error("draw() was called on an abstract Shape !");}
}

export class Rect extends Shape {
    draw(ctx){
        ctx.beginPath();
        ctx.fillRect(this.left(), this.top(), this.width(), this.height());
    }

    svg(){
        return `<rect x="${this.left()}" y="${this.top()}" width="${this.width()} height=${this.height()}"/>`;
    }
}

export class Disk extends Shape {
    rx(){return parseInt(this.width() / 2)}
    ry(){return parseInt(this.height() / 2)}
    cx(){return parseInt((this.left() + this.right())/2)}
    cy(){return parseInt((this.top() + this.bottom())/2)}

    draw(ctx){
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.cx()-this.rx(), this.cy()-this.ry());
        ctx.scale(this.rx(), this.ry());
        ctx.arc(1, 1, 1, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }

    svg(){
        return `<ellipse cx="${this.cx()}" cy="${this.cy()}" rx="${this.rx()}" ry="${this.ry()}">`;
    }
}
