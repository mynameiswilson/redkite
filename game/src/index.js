import React from "react";
import { render } from "react-dom";
import { Client } from "boardgame.io/react";
import RedKite from "./redkite";
import Parcours from "./parcours";

const App = Client({
  game:  RedKite,
  board: Parcours,
  numPlayers: 4,
});

render(<App />, document.getElementById("root"));
