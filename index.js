import data from "./src/files/historys.json" assert { type: "json" };
import { createHistory } from "./src/runHistory.js";

createHistory(data[0].instructions);

console.log("=====================================================================");

createHistory(data[1].instructions);
// console.log(history);
