import React from "react";
import { render } from "react-dom";
import { Client } from "boardgame.io/react";
import RedKite from "./redkite";
import Parcours from "./parcours";


const App = Client({
  game:  RedKite,
  board: Parcours,
  numPlayers: 4,
  //enhancer: applyMiddleware(logger),
  enhancer: (window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()),
});

render(<App />, document.getElementById("root"));
