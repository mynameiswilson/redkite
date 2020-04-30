import React from 'react';
import PropTypes from 'prop-types';
//import Sector from './sector';
import './parcours.css';


class Parcours extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    G: PropTypes.any.isRequired,
    ctx: PropTypes.any.isRequired,
    moves: PropTypes.any.isRequired,
    playerID: PropTypes.string,
    isMultiplayer: PropTypes.bool,
  };

  onClick = (whatGotClicked, id) => {

    if (whatGotClicked === "spot" && this.props.ctx.phase == "staging") {
      this.props.moves.StageRider(id);
      this.props.events.endTurn();   // move to moveLimit?
    }

    if (whatGotClicked === "cardSelect" && id != undefined) {
      this.props.moves.SelectCard(id);
    }
  }

  render() {
    return (
      <div>
        <div id="parcours" className="panel">
          <ul>
              {
                this.props.G.sectors.map((sector, id) => 
                    <Sector  sector={sector} G={this.props.G} key={id.toString()} handleClick={this.onClick} id={id} />
                )
              }      
          </ul>
        </div>

        <div className="panel">
          <div id="gameState">Phase: { this.props.ctx.phase } </div>
          <div id="teams">
            {
                this.props.G.teams.map( (team, i) => 
                  <Team handleClick={this.onClick} key={i} id={i} team={team} racers={this.props.G.racers.filter(racer => racer.player == team.player)} />
                )
            }
          </div>
        </div>
      </div>
    )
  }
}

export default Parcours;

class Team extends React.Component {
  constructor(props) {
    super(props);
    //this.state = {date: new Date()};
    this.className = "team " + props.team.color.toString();
    this.player = props.team.player;
  }

  render() {
    return (
      <div className={this.className}>
        <li>Team: {this.props.team.color} ({this.props.id})</li>
        <li><button onClick={() => this.props.handleClick('cardSelect',this.props.team.player)}>Select a Card</button></li>
        {
          this.props.racers.filter(racer => racer.player == this.props.team.player)
                .map( (racer,i) => 
                <Racer key={i} racer={racer} />
                )
        } 
      </div>
    );

  }

}

const Racer = ({ racer }) => {
  return (
    <li>{ racer.color[0]+racer.type[0] }: {racer.cardToPlay}</li>
  );
}

const Sector = ({ G, handleClick, sector, id }) => {
  // sector should have sector.type and sector.width
  //let spots = [1,2,3];    // eventually move this to the SpawnSectors 
  let spots = [];

  for (let i=0; i<sector.width; i++) {
    spots.push(
        <Spot 
            G={G} 
            sector={id}
            num={i} 
            key={id.toString()+i.toString()} 
            handleClick={handleClick}
            /> 
      )
  }

  return (
    <li className={'sector ' + sector.type.toString()}>
      {sector.type}
      {spots}
    </li>
  );
}

const Spot = ({ G, handleClick, sector, num }) => {
  let text = "";
  let className = "";
  let occupant = (G.racers) ? G.racers.find( element => element.currentSpot.join() == Array(sector,num).join()) : null;
  
  if (occupant != undefined) {
    text = occupant.color[0] + occupant.type[0];
    className = occupant.color;
  }

  return (
    <input type="text" onClick={() => handleClick('spot',Array(sector,num))} readOnly racer="0" className={className.toString()} value={text.toString()}/>
  );
}
