import React from 'react';
import PropTypes from 'prop-types';
//import Sector from './sector';
import './parcours.css';


class Parcours extends React.Component {
  constructor(props) {
    super(props);
    this.sectors = this.SpawnSectors();
    this.SetupStartGrid();
  }

  static propTypes = {
    G: PropTypes.any.isRequired,
    ctx: PropTypes.any.isRequired,
    moves: PropTypes.any.isRequired,
    playerID: PropTypes.string,
    isMultiplayer: PropTypes.bool,
  };

  onClick = (whatGotClicked , id) => {
    if (whatGotClicked === "spot" && this.props.ctx.phase == "staging") {
      this.StageRider(id);
      this.props.events.endTurn();
      console.log( "Riders to be placed: ", this.props.G.racers.filter(element => element.currentSpot === null).length );
      if (this.props.G.racers.filter(element => element.currentSpot === null).length === 0) {
        console.log("ALL RACERS PLACED!");
        this.props.events.endPhase();
      }
    }

    if (whatGotClicked === "cardSelect" && id != undefined) {
      this.props.moves.SelectCard(id);
    }
  }

  getCurrentPlayerUnstagedRacers = (racers) => {
    return racers.player == this.props.ctx.currentPlayer && racers.currentSpot === null;
  }

  StageRider = (spot) => {
    let racer = this.props.G.racers.find(this.getCurrentPlayerUnstagedRacers);
    //this.props.moves.StageRider();
    if (racer !== false) {
      racer.currentSpot = spot;
    }
  }

  SetupStartGrid() {
    console.log("SETTING UP START GRID");
    this.props.G.teams.forEach((team,i)=> {      //for each team drop their rider into the racers collection 
      team.riders.forEach((rider,j) => {
          rider.color = team.color;
          rider.player = team.player;
          rider.currentSpot = null;
          this.props.G.racers.push(rider);
        });
    });
    console.log(this.props.G.racers.length + ' RACERS ENTERED');

  }

  SpawnSectors() {
    console.log("SPAWNING SECTORS");
    let secs = Array.from("FFFFHFHFHFFFMMMMFFFMMDDDDDDFFFHHMMMMFFF"); // eventually move this to a config or user option
    return secs;
  }

  render() {
    return (
      <div>
        <div id="parcours" className="panel">
          <ul>
              {
                this.sectors.map((sector, id) => 
                    <Sector G={this.props.G} key={id.toString()} handleClick={this.onClick} id={id.toString()} type={sector.toString()} />
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

const Team = ({ handleClick, team, racers, id }) => {
  let className = "team " + team.color.toString();
  //let racers = this.props.G.racers.filter(racer => racer.player == team.player);
  return (
    <div className={className}>
      <li>Team: {team.color} ({id})</li>
      <li><button onClick={() => handleClick('cardSelect',team.player)}>Select a Card</button></li>
      {
        racers.filter(racer => racer.player == team.player)
              .map( (racer,i) => 
              <Racer key={i} racer={racer} />
              )
      }
    </div>
    );
}

const Racer = ({ racer }) => {
  return (
    <li>{ racer.color[0]+racer.type[0] }: {racer.cardToPlay}</li>
  );
}

const Sector = ({ G, handleClick, type, id }) => {
  let spots = [1,2,3];    // eventually move this to the SpawnSectors 

  return (
    <li className={'sector ' + type.toString()}>
      {type}
      { 
        spots.map((spot,i) => 
        <Spot 
              G={G} 
              id={id.toString()+i.toString()} 
              key={id.toString()+i.toString()} 
              handleClick={handleClick}
              /> 
        )
      }
    </li>
  );
}

const Spot = ({ G, handleClick, id }) => {
  let text = "";
  let className = "";
  let occupant = G.racers.find( element => element.currentSpot == id );
  
  if (occupant != undefined) {
    text = occupant.color[0] + occupant.type[0];
    className = occupant.color;
  }

  return (
    <input type="text" onClick={() => handleClick('spot',id)} readOnly racer="0" className={className.toString()} value={text.toString()}/>
  );
}
