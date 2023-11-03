import data from "./src/files/historys.json" assert { type: "json" };
import { createHistory } from "./src/runHistory.js";

const history = createHistory(data[0].instructions);
// console.log(history);
