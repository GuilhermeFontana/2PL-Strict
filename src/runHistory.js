import inspector from "inspector";

import { createLocksTable, clearLocksTable } from "./resources/locksTable.js";
import { getTransactions } from "./resources/transactions.js";
import { verifyLock, verifyUnlockLock } from "./resources/locks.js";
import { getDatas, getValue, setValue } from "./resources/datas.js";
import { print } from "./utils/print.js";
import { sleep } from "./utils/sleep.js";

export async function createHistory(instructions) {
  const DELAY = inspector.url() ? 0 : 1.5;

  let transactions = getTransactions(instructions);
  let locksTable = createLocksTable(instructions);
  let datasTable = getDatas(instructions);

  let history = [];
  while (transactions.some((t) => !t.commited)) {
    for (const i of instructions.filter(
      (x) => !transactions.filter((t) => t.name === x.transaction)[0].commited
    )) {
      if (transactions.filter((t) => t.name === i.transaction)[0].blocked.status) continue;

      if (i.type === "C") {
        history = [...history, i];
        transactions = transactions.map((x) =>
          x.name !== i.transaction ? x : { name: x.name, commited: true }
        );
        print(history, locksTable, datasTable, true);

        await sleep(DELAY);
        continue;
      }

      switch (verifyLock(i, locksTable, transactions)) {
        case "S":
          if (i.type === "R") history = [...history, { ...i, value: getValue(i, datasTable) }];
          else {
            datasTable = setValue(i, datasTable);
            history = [...history, i];
          }

          break;
        case "U":
          locksTable = locksTable.map((x) => (x.data !== i.data ? x : { ...x, type: "E" }));

          history = [
            ...history,
            {
              type: "LE",
              data: i.data,
              transaction: i.transaction,
            },
          ];

          if (i.type === "R") history = [...history, { ...i, value: getValue(i, datasTable) }];
          else {
            datasTable = setValue(i, datasTable);
            history = [...history, i];
          }

          break;
        case "L":
          const lockL = locksTable.filter((x) => x.data === i.data)[0];
          if (!lockL.type)
            locksTable = locksTable.map((x) =>
              x.data !== i.data
                ? x
                : {
                    data: x.data,
                    type: i.type === "R" ? "S" : "E",
                    transactions: [i.transaction],
                  }
            );
          else
            locksTable = locksTable.map((x) =>
              x.data !== i.data ? x : { ...x, transactions: [...x.transactions, i.transaction] }
            );

          history = [
            ...history,
            {
              type: i.type === "R" ? "LS" : "LE",
              data: i.data,
              transaction: i.transaction,
            },
          ];

          if (i.type === "R") history = [...history, { ...i, value: getValue(i, datasTable) }];
          else {
            datasTable = setValue(i, datasTable);
            history = [...history, i];
          }

          break;
        case "B":
          const lockB = locksTable.filter((x) => x.data === i.data)[0];
          if (verifyUnlockLock(i, lockB, transactions) == "L") {
            if (lockB.type === "E") {
              locksTable = locksTable.map((x) =>
                x.data !== i.data
                  ? x
                  : {
                      data: x.data,
                      type: i.type === "R" ? "S" : "E",
                      transactions: [i.transaction],
                    }
              );

              history = [
                ...history,
                {
                  type: "UE",
                  data: i.data,
                  transaction: lockB.transactions[0],
                },
                {
                  type: i.type === "R" ? "LS" : "LE",
                  data: i.data,
                  transaction: i.transaction,
                },
              ];

              if (i.type === "R") history = [...history, { ...i, value: getValue(i, datasTable) }];
              else {
                datasTable = setValue(i, datasTable);
                history = [...history, i];
              }
            } else {
              lockB.transactions.forEach((x) => {
                history = [
                  ...history,
                  {
                    type: "US",
                    data: i.data,
                    transaction: x,
                  },
                ];
              });

              history = [
                ...history,
                {
                  type: i.type === "R" ? "LS" : "LE",
                  data: i.data,
                  transaction: i.transaction,
                },
              ];

              if (i.type === "W") {
                locksTable = [
                  ...locksTable.filter((x) => x.data !== i.data),
                  {
                    data: i.data,
                    type: "E",
                    transactions: [i.transaction],
                  },
                ];

                history = [...history, { ...i, value: getValue(i, datasTable) }];
              } else
                locksTable = [
                  ...locksTable.filter((x) => x !== i.data),
                  {
                    ...lockB,
                    transactions: [
                      ...lockB.transactions.filter(
                        (x) => !transactions.filter((t) => t.name === x)[0].commited
                      ),
                      i.transaction,
                    ],
                  },
                ];

              datasTable = setValue(i, datasTable);
              history = [...history, i];
            }
          } else {
            transactions = transactions.map((x) =>
              x.name !== i.transaction
                ? x
                : {
                    ...x,
                    blocked: {
                      status: true,
                      transactions: lockB.transactions.filter((x) => x !== i.transaction),
                    },
                  }
            );

            history = history.filter((x) => x.transaction !== i.transaction);

            locksTable = locksTable.map((x) => {
              if (!x.transactions.some((t) => t === i.transaction)) return x;

              const aux = x.transactions.filter((t) => t !== i.transaction);
              return aux.length
                ? { ...x, transactions: aux }
                : { data: x.data, type: null, transactions: [] };
            });

            console.log(
              `Deadlock: {data: ${i.data}, type: ${i.type}, transaction: ${i.transaction}}`
            );

            datasTable = datasTable.map((x) => {
              const newHistory = x.history.filter((x) => x.transaction !== i.transaction);
              return {
                name: x.name,
                value: newHistory[0].newValue,
                history: newHistory,
              };
            });
          }

          break;
      }

      print(history, locksTable, datasTable, true);
      await sleep(DELAY);
    }
    const clr = clearLocksTable(locksTable);

    history = [...history, ...clr[0]];
    locksTable = clr[1];

    transactions = transactions.map((x) =>
      x.commited
        ? x
        : {
            ...x,
            blocked: {
              status: false,
              transactions: [],
            },
          }
    );
  }

  console.log(instructions);
  print(history, locksTable, datasTable);
  // console.log(transactions);
}
