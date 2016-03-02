import React from 'react'

class JobView extends React.Component {
    percent(){
        let p = parseInt(25*(this.props.state+this.props.percent/100.0))
        return Math.min(100, p)
    }
    progress_klass(){
        var res = "progress-bar "
        switch (this.props.state){
            case 0:
            case 1:
            case 3: res += "progress-bar-striped active "
        }

        if (this.props.state < 3){
            res += "progress-bar-primary"
        } else if (this.props.state == 3){
            res += "progress-bar-warning"
        } else {
            res += "progress-bar-success"
        }
        return res
    }
    state_name(){
        switch (this.props.state){
            case 0: return "Extrusion du volume"
            case 1: return "Tranchage"
            case 2: return "En attente d'impression"
            case 3: return "Impression"
            default: return "Terminé"
        }
    }

    render(){
        let style = {width: this.percent()+'%'}
        return <div>
            <h3>{this.props.name}<br/><small>{this.state_name()}</small></h3>
            <div className="progress">
                <div className={this.progress_klass()} style={style}></div>
            </div>
        </div>
    }
}

export class QueueView extends React.Component {
    constructor(props){
        super(props)
        this.state = {queue: []}
    }

    componentDidMount() {
        let S = this.props.session
        S.call('get-queue').then(res => this.setState({queue: res}))
        S.subscribe('queue', res => this.setState({queue: res}))
    }

    render(){
        let content = this.state.queue.map(
            x => <li className="list-group-item"><JobView {...x}/></li>)
        return <ul className="list-group">{content}</ul>
    }
}
