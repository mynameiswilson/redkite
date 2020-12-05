import React from 'react';
import PropTypes from 'prop-types';
import './parcours.css';

class Parcours extends React.Component {
  static propTypes = {
    G: PropTypes.any.isRequired,
    ctx: PropTypes.any.isRequired,
    moves: PropTypes.any.isRequired,
    playerID: PropTypes.string,
    isMultiplayer: PropTypes.bool,
  };

  onClick = (whatGotClicked, id) => {
      
    if (whatGotClicked === "spot" && this.props.ctx.phase === "staging") {
      this.props.moves.StageRider(id);
      this.props.events.endTurn();   // move to moveLimit?
    }

    if (whatGotClicked === "cardSelect" && id !== undefined) {
      this.props.moves.SelectCard(id);
    }
  }

  render() {

    return (
      <div>
        <div id="parcours" className="panel">
          <div className="scrollWell">
          <ul>
              {
                this.props.G.sectors.map((sector, id) => 
                    <Sector sector={sector} key={id.toString()} handleClick={this.onClick} id={id} />
                )
              }      
          </ul>
          </div>
        </div>

        <div className="panel">
          <div id="gameState">Phase: { this.props.ctx.phase } </div>
          <TeamsList key="teamslist" onClick={this.onClick} G={this.props.G} />
          <ActionLog log={this.props.G.actionLog} key="actionLog" />
        </div>
      </div>
    )
  }
}

export default Parcours;

class ActionLog extends React.Component {
  static propTypes = {
    log: PropTypes.any.isRequired,
  };

  render() {

    let actions = [];

    this.props.log.slice().reverse().forEach(
      (action, i) => actions.push(<li key={i}>{this.props.log.length-i} - {action}</li>)
      );

    return (  
      <div id="actions">
        <strong>Action Log</strong>
        {actions}
      </div>
    );
  }

}

class TeamsList extends React.Component {

  static propTypes = {
    G: PropTypes.any.isRequired,
    onClick: PropTypes.any.isRequired,
  };

  GetRacers = () => {
    let racers = [];

    this.props.G.sectors.forEach( 
        (sector) => { 
          sector.spots.forEach( (spot) => { 
            if (typeof spot == "object") racers.push (spot);
          });
      }) 

    return racers; 
          
  }

  render() {

    this.racers = this.GetRacers();
    let teams = [];

    if (this.props.G.teams) {

      this.props.G.teams.forEach ( (team, i) => {
        let teamRacers = this.racers.filter(racer => racer.color === team.color);
        teams.push(<Team onClick={this.props.onClick} team={team} key={"team"+i.toString()} id={i} teamRacers={teamRacers} />);
      });

    }

    return (  
      <div id="teams">{teams}</div>
    );

  } //render

}

class Team extends React.Component {
  constructor(props) {
    super(props);
    this.className = "team " + props.team.color.toString();
    this.player = props.team.player;
  }

  static propTypes = {
    team: PropTypes.any.isRequired,
    teamRacers: PropTypes.any.isRequired,
    onClick: PropTypes.any.isRequired,
  };

  render() {
      return (
        <div className={this.className}>
          <li>Team: {this.props.team.color} ({this.props.id})</li>
          <li><button onClick={() => this.props.onClick('cardSelect',this.props.team.player)}>Select a Card</button></li>
          {
            this.props.teamRacers
                  .map( (racer,i) => 
                  <Racer key={this.props.team.color.toString() + i} racer={racer} />
                  )
          } 
        </div>
      );

  }

}

const Racer = ({ racer }) => {

  const add = (a, b) => a + b
  let currentEnergy = racer.deck.reduce(add) 
  let averageEnergy = currentEnergy / racer.deck.length;

  return (
    <li>{ racer.color[0]+racer.type[0] }: {racer.cardToPlay}<br/>
    { currentEnergy } / { racer.startEnergy }<br/>
    { averageEnergy.toPrecision(2) }
    </li>
  );
}

const Sector = ({ sector, handleClick, id }) => {
  let spots = [];

  spots = sector.spots.map( 
    (racer,i) => 
      <Spot 
        racer={racer}
        sectorid={id}
        spotid={i} 
        key={id.toString()+i.toString()} 
        handleClick={handleClick}
        /> 
    );

  return (
    <li id={"sector"+id}   className={'sector ' + sector.type.toString()}>
      <div class="label">{sector.type} {id}</div>
      {spots}
    </li>
  );
}

const Spot = ({ racer, sectorid, spotid, handleClick }) => {
  let text = "";
  let className = "";
  
  if (racer.hasOwnProperty("color") && racer.hasOwnProperty("type")) {
    text = racer.color[0] + racer.type[0] + (racer.drafting ? "↠" : "");
    className = racer.color;
  }

  return (
    <input type="text" onClick={() => handleClick('spot',[sectorid,spotid])} readOnly className={className.toString()} value={text.toString()}/>
  );
}
