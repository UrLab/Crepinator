export class Point {
    constructor(x=0, y=0){
        this.x = parseInt(x, 10)
        this.y = parseInt(y, 10)
    }

    dist(other){
        let dx = this.x - other.x,
            dy = this.y - other.y;
        return Math.sqrt(dx*dx + dy*dy)
    }

    add(other){
        return new Point(this.x + other.x, this.y + other.y)
    }

    sub(other){
        return new Point(this.x - other.x, this.y - other.y)
    }

    mul(scalar){
        return new Point(this.x*scalar, this.y*scalar)
    }

    eq(other){
        return other && this.x == other.x && this.y == other.y
    }

    to(other, step, func){
        let d = other.sub(this),
            l = this.dist(other);
        var p1, p2 = undefined;
        for (var i=0; i<=l; i+=step){
            p1 = this.add(d.mul(i/l))
            if (! p1.eq(p2)){
                func(p1)
            }
            p2 = p1
        }
    }

    str(){
        return `(${this.x} ${this.y})`
    }
}
