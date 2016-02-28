import $ from 'jquery';
import {Point} from './point.js';
import {Disk, Rect} from './shapes.js';
import {Drawing} from './draw.js';

const toolset = {
    rect: pos => new Rect(pos, pos),
    disk: pos => new Disk(pos, pos),
    pen14: pos => new Drawing(pos, 14),
    pen28: pos => new Drawing(pos, 28),
    pen42: pos => new Drawing(pos, 42),
    pen56: pos => new Drawing(pos, 56),
    pen70: pos => new Drawing(pos, 70),

    'rect-o': pos => new Rect(pos, pos, true),
    'disk-o': pos => new Disk(pos, pos, true),
    'pen14-o': pos => new Drawing(pos, 14, true),
    'pen28-o': pos => new Drawing(pos, 28, true),
    'pen42-o': pos => new Drawing(pos, 42, true),
    'pen56-o': pos => new Drawing(pos, 56, true),
    'pen70-o': pos => new Drawing(pos, 70, true),
}

class PancakeDesigner {
    constructor(root) {
        this.root = root
        this.canvas = root.find('canvas')[0]
        this.width = $(this.canvas).attr('width')
        this.height = $(this.canvas).attr('height')
        this.texture = new Image()
        this.texture.src = "texture.jpg"

        /* Mouse gesture events */
        this.tool = "pen42"
        this.click = false

        /* Graphics */
        this.current_shape = undefined
        this.shapes = []
        
        /* Install events */
        $(this.canvas).on('mousedown', evt => this.clickDown(evt))
        $(this.canvas).on('mousemove', evt => this.move(evt))
        $(this.canvas).on('mouseup', evt => this.clickUp(evt))
        $(this.canvas).on('mouseout', evt => this.clickUp(evt));
        
        ['rect', 'disk', 'pen14', 'pen28', 'pen42', 'pen56', 'pen70'].map(t => {
            root.find(`.tool-${t}`).on('click', evt => this.tool = t)
            root.find(`.tool-${t}-o`).on('click', evt => this.tool = `${t}-o`)
        });
        root.find('.tool-clear').on('click', evt => {
            if (confirm("Effacer le dessin ?")){this.clear()}
        })
        root.find('.tool-print').on('click', evt => this.stl())
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
        this.shapes.map(s => s.draw(ctx, this.texture))
    }

    stl(){
        let img = this.ctx().getImageData(0, 0, this.width, this.height)
        let n = img.data.length
        let m = parseInt(n/8)
        if (n % 8 > 0){m++}
        let res = new Array(m)
        for (var i=0; i<m; i++){
            var k = 0
            for (var j=0; j<8 || m*8+j < n; j++){
                k <<= 1
                if (img.data[i*32 + j*4 + 3] > 0){
                    k += 1
                }
            }
            res[i] = k
        }
        $('#output').text(JSON.stringify(res))
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
        console.log(this.tool)
        this.current_shape = toolset[this.tool](this.getMousePos(evt))
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
                           .map(k => k.draw(ctx, this.texture))
            }
            s.changePoint(pos).draw(ctx, this.texture)
        }
    }
}

window.$ = $
window.jQuery = $
window.PancakeDesigner = PancakeDesigner
