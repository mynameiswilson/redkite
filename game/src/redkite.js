
import { vsprintf } from "sprintf-js";

const RedKite = {
  name: "redkite",

  setup: (ctx) => ({ 
    sectors: SpawnSectors("FFFFHFHFHF2F2F2M2M2M2M2F2F2F2M2M2DDDDDDFFFHHMMMMFFF",3), //eventually move this to some config
    teams: SpawnTeams(ctx),
    actionLog: [],
    autostage: true,        // if we are auto-staging riders (for dev)
    defaultSectorWidth: 3,
  }),


  phases: {

    staging: {      // stage the racers in the start grid
      start: true,
      moves: { StageRider },
      onBegin: (G, ctx) => {
        SetupRacers(G);
      },
      endIf: (G, ctx) => {
        // end staging phase if racers has been filled and the number without a current spot is zero
        return (GetRacers(G).length > 0) && 
                (GetRacers(G).filter(element => element.currentSpot === null).length === 0);
      },
      onEnd: (G, ctx) => {
      
      },
      next: 'selectMoves',
    },

    selectMoves: {
      moves: { SelectCard, PlayCard },
      turn: { moveLimit: 1 },
      onBegin: (G, ctx) => { 
        GetRacers(G).forEach( (racer) => { racer.cardToPlay = null; } );
      },
      endIf: (G, ctx) => { return GetRacers(G).filter(racer => racer.cardToPlay === null).length === 0 },
      next: 'resolveMoves',
    },

    resolveMoves: {
      onBegin: (G, ctx) => {
        // resolve the CARDS TO PLAY
        console.log("RESOLVING MOVES");
    
        // SECTOR / SPOTS visualization
        //    spots 0  1  2
        // sector 0            
        // sector 1 ps pr gs   
        // sector 2 br 
        // sector 3          <-- a 1-sector gap is "closeable" by drafting
        // sector 4 gr 
        // sector 5 
        // sector 6          <-- a 2-sector gap is not.
        // sector 7 bs

        //TODO: add sector-specific rules
        // Mountains: no moves over 5 if you start on or might move through a mountain, no drafting
        // Hills: ??? tbd
        // Descents: minimum of speed 5
        // Cobbles: max speed 7, no drafting

        // LET RIDERS PLAY THEIR CARDS 
        let foundFirstRider = false;
        let lastSectorWithRacer = 0;



        for (let i = G.sectors.length-1; i >=0; i--) {
          for (let spotIndex = 0; spotIndex < G.sectors[i].spots.length; spotIndex++) {
  
            let racer = G.sectors[i].spots[spotIndex];
            if (typeof racer == "object") {                   //if this spot is filled with a racer

              if (!foundFirstRider) {
                ActionLog(G,"%s %s leads the peloton", racer.color, racer.type);
                foundFirstRider = true;
              }

              racer.drafting = false;                       //reset drafting status for rider
              let targetSpot = [...racer.currentSpot];
              targetSpot[0] += racer.cardToPlay;            //apply card value to move rider to new sector
              
              PlaceRacerInSector(G,targetSpot[0],racer);
              ActionLog(G,"%s %s has played %s, moving from %s to %s", racer.color, racer.type, racer.cardToPlay, racer.prevSpot.toString(), racer.currentSpot.toString());
              racer.cardToPlay = null;
            } // if this spot has a RACER
          } //for each SPOT
        } // for each SECTOR

        //APPLY DRAFTING RULES
        console.log("Applying drafting rules")
        for (let i = G.sectors.length-1; i >=2; i--) {
            if (G.sectors[i].spots.some(element => typeof element === "object")) {      //if there is at least one rider in this sector

              if (                                                                      //check for gaps. There is a gap if:
                G.sectors[i-1].spots.every(element => element === 0) &&                 //the prior sector is empty
                G.sectors[i-2].spots.some(element => typeof element === "object") ) {   //and the sector two back has riders 

                  G.sectors[i-2].spots
                    .filter( element => typeof element === "object")
                    .forEach( (racer) => {
                      racer.drafting = true;
                      PlaceRacerInSector(G,i-1,racer);
                      ActionLog(G,"%s %s is carried along in the draft to Sector %s", racer.color, racer.type, racer.currentSpot[0]);
                  });

              } // end if is there a one-sector gap back to next rider

            } // end if is there a rider in this sector

        } // for each SECTOR


        //APPLY FATIGUE TO EACH GROUP LEADER
        console.log("Applying fatigue")
        let weAreSheltered = false;
        for (let i = G.sectors.length-1; i > 0; i--) {                            //for each sector
          if (G.sectors[i].spots.some(element => typeof element === "object")) {  // if there are riders in this sector
            lastSectorWithRacer = i;            
            if (!weAreSheltered) {                                                  // and they are not sheltered
              G.sectors[i].spots.forEach( racer => {                              // for each racer
                if (typeof racer === "object") {
                  console.log("%s %s is tiring at the front", racer.color, racer.type);
                  racer.deck.push(1); //toss a fatigue card in there              // shuffle a "1" fatigue card into their deck
                }
              });
              weAreSheltered = true;                                              // and mark next sector as sheltered
            }
          } else weAreSheltered = false;                                          // if there are NO riders, there is no shelter in this sector
        }

        //scroll view, ensure last rider in race is in there
        document.getElementById('sector'+(lastSectorWithRacer-1)).scrollIntoView();

      },
      endIf: (G, ctx) => {
        return GetRacers(G).filter(element => element.cardToPlay !== null).length === 0;
      },
      moves: { },
      next: 'selectMoves',
    },

  },

  ai: {
    enumerate: (G, ctx) => {
      let moves = [];
      /*for (let i = 0; i < 9; i++) {
        if (G.cells[i] === null) {
          moves.push({ move: 'clickCell', args: [i] });
        }
      }*/
      return moves;
    },
  },

  endIf: (G, ctx) => {
    if (IsVictory(G.sectors)) {
      return { winner: ctx.currentPlayer };
    }
    if (IsDraw(G.sectors)) {
      return { draw: true };
    }
  },

};


export default RedKite;

function PlaceRacerInSector(G,sectornum,racer) {

  if (sectornum > 0 || !G.sectors[sectornum]) {

    let placed = false;
    for (let i = 0; i < G.sectors[sectornum].spots.length; i++) {
      if (G.sectors[sectornum].spots[i] === 0) {
        racer.prevSpot = [...racer.currentSpot];                    //save previous spot
        racer.currentSpot = [sectornum,i];                          //set currentSpot to our current sector and spot #
        G.sectors[sectornum].spots[i] = racer;                      //carry this over into the sectors array
        G.sectors[racer.prevSpot[0]].spots[racer.prevSpot[1]] = 0; //vacate out prior spot
        placed = true;
      }
      if (placed) break;
    }

    if (!placed) { 
      console.log("Couldn't place %s %s in sector %i, moving back", racer.color, racer.type, sectornum);
      ActionLog(G,"%s %s can't fit in Sector %i, slots in behind.", racer.color, racer.type, sectornum);
      PlaceRacerInSector(G,sectornum-1,racer);  //couldn't make it happen in this sector, move back one
    }
  } else console.log("can't place rider in sector %i, it doesn't exist", sectornum)
}


function ActionLog(G,action, ...replacements) {
  if (G) G.actionLog.push(vsprintf(action,replacements))
    else console.log("Must pass G to ActionLog");
}


function SpawnSectors(sectormap, defaultSectorWidth) {
  console.log("SPAWNING SECTORS");
  let sectors = sectormap.match(/\S\d?/g);  // eventually move this to a config or user option

  sectors = sectors.map( sector => {

    let newSector = Array.from(sector);
    
    if (newSector.length === 1) {  newSector.push(defaultSectorWidth) }
    else newSector[1] = parseInt(newSector[1])
    
    newSector = {
      'type':  newSector[0],
      'width': newSector[1],
      'spots': Array(newSector[1]).fill(0),
    }
    
    return newSector;
  });

  return sectors;
}

function SpawnTeams(ctx) {
  console.log("SPAWNING TEAMS");
  const colors = ['black','blue','green','pink'];
  let teams = [];
  colors.forEach( (c,idx) => {
    teams.push({
      'player':       (idx < ctx.numPlayers) ? idx : null,  
      'color':        c,
      'riders':       [SpawnSprinter(), SpawnRouleur()],
    });
  });
  return teams;
}

function SpawnSprinter() {
  return { "type" : "sprinter" , "deck" : [2,2,2,3,3,3,4,4,4,5,5,5,9,9,9], "cardToPlay": null, "currentSpot": null, drafting: false };
}

function SpawnRouleur() {
  return { "type" : "rouleur" , "deck" : [ 3,3,3,4,4,4,5,5,5,6,6,6,7,7,7], "cardToPlay": null, "currentSpot": null, drafting: false };
}

function GetRacers(G) {
  let racers = [];

  G.sectors.forEach( 
  (sector) => { 
    sector.spots.forEach( (spot) => { 
      if (typeof spot == "object") racers.push (spot);
    });
  }) 

  return racers; 
        
}

function SetupRacers(G) {
  console.log("SETTING UP RACERS");
  G.teams.forEach((team,i)=> {      //for each team drop their rider into the racers collection     
    team.riders.forEach((rider,j) => {
        rider.color = team.color;       //copy color and player # down to the rider level for ease of use
        rider.player = team.player;
        if (G.autostage) {
          rider.currentSpot = [i,j];
          G.sectors[i].spots[j] = rider;
        } 
      });
  });

}

// Return true if `cells` is in a winning configuration.
function IsVictory(sectors) {
  return false; 
}

// Return true if all `cells` are occupied.
function IsDraw(sectors) {
  //return sectors.filter(c => c === null).length === 0;
}

function SelectCard(G, ctx, player) {
  console.log("SELECTING CARDS for PLAYER ", player);

  GetRacers(G).forEach( (racer, i) => {
      if (racer.player === player) {
        racer.deck = ctx.random.Shuffle(racer.deck);
        racer.cardToPlay = racer.deck[0];
        racer.deck = racer.deck.slice(1); 
      }
    });
}

function PlayCard(G, ctx) {
  G.deck++;
  G.hand[ctx.currentPlayer]--;
}

function StageRider(G, ctx, spot) {
    
    GetRacers(G).find(racer => (racer.player === ctx.currentPlayer && racer.currentSpot === null)).currentSpot = spot;

}


