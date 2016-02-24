import $ from 'jquery';
import {Disk, Rect} from './shapes.jsx';

class Position {
    constructor(x=0, y=0){
        this.x = parseInt(x, 10)
        this.y = parseInt(y, 10)
    }

    str(){
        return `(${this.x} ${this.y})`
    }
}

class PancakeDesigner {
    constructor(root) {
        this.root = root
        this.canvas = root.find('canvas')[0]
        this.width = $(this.canvas).attr('width')
        this.height = $(this.canvas).attr('height')

        /* Mouse gesture events */
        this.tool = this.root.find('.tool')[0].value
        this.click = false

        /* Graphics */
        this.current_shape = undefined
        this.shapes = []
        
        /* Install events */
        $(this.canvas).on('mousedown', evt => this.clickDown(evt))
        $(this.canvas).on('mousemove', evt => this.move(evt))
        $(this.canvas).on('mouseup', evt => this.clickUp(evt))
        $(this.canvas).on('mouseout', evt => this.clickUp(evt))
        root.find('.tool').on('change', evt => this.tool = evt.target.value)
        root.find('.clear').on('click', evt => this.clear())
    
        console.info(`Pancake Designer ${this.width}x${this.height} ready !`)
    }

    ctx(){
        return this.canvas.getContext('2d')
    }

    clear(){
        this.shapes = []
        this.redraw()
    }

    redraw(){
        let ctx = this.ctx()
        ctx.clearRect(0, 0, this.width, this.height)
        this.shapes.map(s => s.draw(ctx))
    }

    svg(){
        let shapes = this.shapes.map(s => s.svg()).join('\n');
        return `<svg width="${this.width}" height="${this.height}">${shapes}</svg>`
    }

    getMousePos(evt){
        let rect = this.canvas.getBoundingClientRect();
        let res = new Position(evt.clientX-rect.left, evt.clientY-rect.top)
        return res
    }

    clickDown(evt){
        let pos = this.getMousePos(evt);
        switch (this.tool){
            case "rect":   this.current_shape = new Rect(pos, pos); break;
            case "circle": this.current_shape = new Disk(pos, pos); break;
        }
        this.click = true
    }

    clickUp(evt){
        if (this.click){
            if (this.current_shape.area() > 1){
                this.shapes.push(this.current_shape)
            }
            this.click = false
            this.current_shape = undefined
            this.redraw(this.ctx())
            this.root.find('.svg').text(this.svg())
        }
    }

    move(evt){
        if (this.click){
            let pos = this.getMousePos(evt),
                ctx = this.ctx(),
                s = this.current_shape;
            ctx.clearRect(s.left(), s.top(), s.width(), s.height())
            this.shapes.filter(k => s.overlap(k)).map(k => k.draw(ctx))
            s.changePoint(pos).draw(ctx)
        }
    }
}

window.$ = $
window.PancakeDesigner = PancakeDesigner
