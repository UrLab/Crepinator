import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import {Disk, Rect} from './shapes.jsx';

class PancakeDesigner extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tool: 'rect',
            click: {on: false, x: 0, y: 0},
            move: {x: 0, y: 0},
            current_shape: undefined,
            shapes: [],
            svg: ""
        };
    }

    redraw(ctx){
        ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.state.shapes.map(s => s.draw(ctx));
    }

    svg(){
        let shapes = this.state.shapes.map(s => s.svg()).join('\n');
        return `<svg width="${this.props.width}" height="${this.props.height}">${shapes}</svg>`
    }

    getMousePos(evt){
        let canvas = evt.target;
        let rect = canvas.getBoundingClientRect();
        return {
            x: parseInt(evt.clientX - rect.left),
            y: parseInt (evt.clientY - rect.top)
        }
    }

    clickDown(evt){
        let pos = this.getMousePos(evt);
        let newShape;
        switch (this.state.tool){
            case "rect":   newShape = new Rect(pos, pos); break;
            case "circle": newShape = new Disk(pos, pos); break;
        }
        this.setState({
            click: {on: true, x: pos.x, y: pos.y},
            move: pos,
            current_shape: newShape
        }); 
    }

    clickUp(evt){
        if (! this.state.click.on){return;}

        let pos = this.getMousePos(evt);
        let ctx = evt.target.getContext('2d');
        this.state.current_shape.draw(ctx);

        let shapes = this.state.shapes;
        shapes.push(this.state.current_shape);

        this.setState({
            click: {on: false, x: pos.x, y: pos.y},
            shapes: shapes,
            current_shape: undefined
        });
        this.redraw(ctx);
    }

    move(evt){
        /* Not holding the mouse, do nothing */
        if (! this.state.click.on){return;}

        /* Where the click ? */
        let pos = this.getMousePos(evt);
        let ctx = evt.target.getContext('2d');

        let s = this.state.current_shape;
        ctx.clearRect(s.left(), s.top(), s.width(), s.height());
        this.setState({
            move: pos,
            current_shape: s.changeMax(pos)
        });
        this.state.current_shape.draw(ctx);
    }
    
    render(){
        return <div>
            <div>
                <select value={this.state.tool}
                        onChange={evt => this.setState({tool: evt.target.value})}>
                    <option value="rect">Rectangle</option>
                    <option value="circle">Rond</option>
                </select>
            </div>
            <canvas width={this.props.width} height={this.props.height}
                    onMouseDown={evt => this.clickDown(evt)}
                    onMouseUp={evt => this.clickUp(evt)}
                    onMouseOut={evt => this.clickUp(evt)}
                    onMouseMove={evt => this.move(evt)}>
            </canvas>
            <hr/>
            <pre>{this.svg()}</pre>
        </div>
    }
}

$(document).ready(() => {
    ReactDOM.render(<PancakeDesigner width={800} height={600}/>,
                    document.getElementById('app'));
});
