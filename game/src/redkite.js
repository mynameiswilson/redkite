
const RedKite = {
  name: "redkite",

  setup: (ctx) => ({ 
    sectors: SpawnSectors("FFFFHFHFHF2F2F2M2M2M2M2F2F2F2M2M2DDDDDDFFFHHMMMMFFF",3), //eventually move this to some config
    teams: SpawnTeams(ctx),
    racers: [],
    autostage: true,        // if we are auto-staging riders (for dev)
    defaultSectorWidth: 3,
  }),

  phases: {

    staging: {      // stage the racers in the start grid
      start: true,
      moves: { StageRider },
      onBegin: (G) => {
        G.racers = SetupRacers(G);
      },
      //endIf: (G, ctx) => G.racers.filter(element => element.currentSpot === null).length == 0,
      endIf: (G, ctx) => {
        // end staging phase if racers has been filled and the number without a current spot is zero
        return G.racers.length > 0 && G.racers.filter(element => element.currentSpot === null).length == 0;
      },
      onEnd: (G, ctx) => {
        //console.log("STAGING onEND: Is Racer 0 same as Rider 0?", G.racers[0] == G.teams[0].riders[0]);
      },
      next: 'selectMoves',
    },

    selectMoves: {
      moves: { SelectCard, PlayCard },
      turn: { moveLimit: 1 },
      onBegin: (G, ctx) => { 
        G.racers.forEach( (racer) => { racer.cardToPlay = null; } );
      },
      endIf: (G, ctx) => { return G.racers.filter(racer => racer.cardToPlay === null).length == 0 },
      next: 'resolveMoves',
    },

    resolveMoves: {
      onBegin: (G, ctx) => {
        // resolve the CARDS TO PLAY
        console.log("RESOLVING MOVES");
        //sort racers, because we will move from front to back
        G.racers.sort( (a,b) => ( a.currentSpot < b.currentSpot ) ? 1 : -1);

        let targetSpot = [];
        //execute moves
        G.racers.forEach( (racer) => {
          racer.prevSpot = racer.currentSpot;
          targetSpot = [...racer.currentSpot];

          targetSpot[0] += racer.cardToPlay;                //move rider to new sector
          targetSpot[1] = G.sectors.targetSpot[0].width-1;  //automatically move them to the end spot of that sector
          //replace above line with logic that slots them into a free spot if available.
          //if not, place in prior sector ... if prior sector full, continue on down

          //check to see if targetSpot is already filled. if so, move to 
          console.log("%s %s has moved %i from %o to %o", racer.color, racer.type, racer.cardToPlay, racer.currentSpot.toString(), targetSpot.toString());

//          console.log("currentSpot spot ", JSON.parse(JSON.stringify(racer.prevSpot)));  
//          console.log("target spot ", JSON.parse(JSON.stringify(targetSpot)));  
//          racer.currentSpot[0] += racer.cardToPlay;
          racer.cardToPlay = null;
          //TODO NEXT: correctly resolve player moves w/ sector and spot numbers
        });
      },
      endIf: (G, ctx) => {
        return G.racers.filter(element => element.cardToPlay !== null).length == 0;
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


function SpawnSectors(sectormap, defaultSectorWidth) {
  console.log("SPAWNING SECTORS");
  let sectors = sectormap.match(/\S\d?/g);  // eventually move this to a config or user option

  sectors = sectors.map( sector => {
    let newSector = Array.from(sector);
    if (newSector.length == 1) {  newSector.push(defaultSectorWidth) };
    newSector = {'type':newSector[0],'width':newSector[1]};
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
      'currentSpot':  null,
      'cardToPlay':   null,
    });
  });
  return teams;
}

function SpawnSprinter() {
  return { "type" : "sprinter" , "deck" : [2,2,2,3,3,3,4,4,4,5,5,5,9,9,9], "cardToPlay": null };
}

function SpawnRouleur() {
  return { "type" : "rouleur" , "deck" : [ 3,3,3,4,4,4,5,5,5,6,6,6,7,7,7], "cardToPlay": null };
}

function SetupRacers(G) {
  console.log("SETTING UP RACERS");
  let racers = [];
  G.teams.forEach((team,i)=> {      //for each team drop their rider into the racers collection 
    team.riders.forEach((rider,j) => {
        rider.color = team.color;
        rider.player = team.player;
        rider.currentSpot = (G.autostage) ? Array(i,j) : null;
        racers.push(rider);
      });
  });
  console.log(racers.length + ' RACERS ENTERED');
  return racers;

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

  G.racers.forEach( (racer, i) => {
      if (racer.player == player) {
        racer.deck = ctx.random.Shuffle(racer.deck);
        racer.cardToPlay = racer.deck.pop();
      }
    });
}

function PlayCard(G, ctx) {
  G.deck++;
  G.hand[ctx.currentPlayer]--;
}

function StageRider(G, ctx, spot) {
    G.racers.find(racer => (racer.player == ctx.currentPlayer && racer.currentSpot === null)).currentSpot = spot;
}


