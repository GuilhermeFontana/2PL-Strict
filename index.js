import ps from "prompt-sync";
const prompt = ps();

import data from "./src/files/historys.json" assert { type: "json" };
import { createHistory } from "./src/runHistory.js";

const input = Number(prompt(`Escolha uma história (1-${data.length}): `));

if (input < 1 || input > data.length) console.log("Opção inválida");
else createHistory(data[input - 1].instructions);
