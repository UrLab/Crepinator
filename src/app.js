import $ from 'jquery';
import {Point} from './point.js';
import {Disk, Rect} from './shapes.js';
import {Drawing} from './draw.js';


class PancakeDesigner {
    constructor(root) {
        this.root = root
        this.canvas = root.find('canvas')[0]
        this.width = $(this.canvas).attr('width')
        this.height = $(this.canvas).attr('height')
        this.texture = new Image()
        this.texture.src = "texture.jpg"

        /* Mouse gesture events */
        this.tool = "rect"
        this.click = false

        /* Graphics */
        this.current_shape = undefined
        this.shapes = []
        
        /* Install events */
        $(this.canvas).on('mousedown', evt => this.clickDown(evt))
        $(this.canvas).on('mousemove', evt => this.move(evt))
        $(this.canvas).on('mouseup', evt => this.clickUp(evt))
        $(this.canvas).on('mouseout', evt => this.clickUp(evt));
        
        ['rect', 'disk', 'pen25', 'pen50', 'pen100'].map(t => {
            root.find(`.tool-${t}`).on('click', evt => this.tool = t)
        });
        root.find('.tool-clear').on('click', evt => {
            if (confirm("Effacer le dessin ?")){this.clear()}
        })
        root.find('.tool-print').on('click', this.stl())
        root.find('.tool-undo').on('click', evt => this.undo())
    
        console.info(`Pancake Designer ${this.width}x${this.height} ready !`)
    }

    ctx(){
        return this.canvas.getContext('2d')
    }

    clear(){
        this.shapes = []
        this.redraw()
    }

    undo(){
        this.shapes.pop()
        this.redraw()
    }

    redraw(){
        let ctx = this.ctx()
        ctx.clearRect(0, 0, this.width, this.height)
        this.shapes.map(s => s.textureDraw(ctx, this.texture))
    }

    stl(){
        let img = this.ctx().getImageData(0, 0, this.width, this.height)
        window.img = img
    }

    print(){
        var name = "";
        while (name.trim().length == 0){
            name = prompt("Nomme ta crèpe")
        }
    }

    getMousePos(evt){
        let rect = this.canvas.getBoundingClientRect();
        return new Point(evt.clientX-rect.left, evt.clientY-rect.top)
    }

    clickDown(evt){
        let pos = this.getMousePos(evt);
        switch (this.tool){
            case "rect": this.current_shape = new Rect(pos, pos); break;
            case "disk": this.current_shape = new Disk(pos, pos); break;
            case "pen25": this.current_shape = new Drawing(pos, 25); break;
            case "pen50": this.current_shape = new Drawing(pos, 50); break;
            case "pen100": this.current_shape = new Drawing(pos, 100); break;
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
            this.redraw()
        }
    }

    move(evt){
        if (this.click){
            let pos = this.getMousePos(evt),
                ctx = this.ctx(),
                s = this.current_shape;
            if (s.needRedraw()){
                ctx.clearRect(s.left(), s.top(), s.width(), s.height())
                this.shapes.filter(k => s.overlap(k))
                           .map(k => k.textureDraw(ctx, this.texture))
            }
            s.changePoint(pos).textureDraw(ctx, this.texture)
        }
    }
}

window.$ = $
window.jQuery = $
window.PancakeDesigner = PancakeDesigner
