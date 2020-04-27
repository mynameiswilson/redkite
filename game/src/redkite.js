
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
        console.log("SELECT CARD: Is Racer 0 same as Rider 0?", racer[0] == G.teams[0].riders[0]);
        racer.deck = ctx.random.Shuffle(racer.deck);
        racer.cardToPlay = racer.deck.pop();
      }
    });

  /*let playerRacers = G.racers.filter(racer => racer.player == player);
  if (playerRacers != undefined) {
    playerRacers.map( (racer) => {
      //racer.deck = ctx.random.Shuffle(racer.deck);
      racer.cardToPlay = racer.deck.pop();
    });
  }*/
}

function PlayCard(G, ctx) {
  G.deck++;
  G.hand[ctx.currentPlayer]--;
}

function StageRider() {

}

function SpawnTeams(ctx) {
  console.log("SPAWNING TEAMS");
  const colors = ['black','blue','green','pink'];
  let teams = [];
  colors.forEach( (c,idx) => {
    teams.push({'player': (idx < ctx.numPlayers) ? idx : null,  'color':c,'riders':[SpawnSprinter(), SpawnRouleur()]});
  });
  return teams;
}

function SpawnSprinter() {
  return { "type" : "sprinter" , "deck" : [2,2,2,3,3,3,4,4,4,5,5,5,9,9,9], "cardToPlay": null };
}

function SpawnRouleur() {
  return { "type" : "rouleur" , "deck" : [ 3,3,3,4,4,4,5,5,5,6,6,6,7,7,7], "cardToPlay": null };
}


const RedKite = {
  name: "redkite",

  setup: (ctx) => ({ 
    teams: SpawnTeams(ctx),
    racers: [],
  }),

  phases: {

    staging: {      // stage the racers in the start grid
      start: true,
      moves: { StageRider },
      next: 'selectMoves',
      onEnd: (G, ctx) => {
        console.log("STAGING onEND: Is Racer 0 same as Rider 0?", G.racers[0] == G.teams[0].riders[0]);
      }
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
        G.racers.sort( (a,b) => ( a.currentSpot < b.currentSpot ) ? 1 : -1);
//        ctx.events.setPhase("selectMoves");
      },
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