import { createLocksTable, clearLocksTable } from "./resources/locksTable.js";
import { getTransactions } from "./resources/transactions.js";
import { verifyLock, verifyUnlockLock } from "./resources/locks.js";

export function createHistory(instructions) {
  let locksTable = createLocksTable(instructions);
  let transactions = getTransactions(instructions);

  let history = [];
  instructions.forEach((i, index) =>
    setTimeout(() => {
      if (i.type === "C") {
        history = [...history, i];
        transactions = transactions.map((x) =>
          x.name !== i.transaction ? x : { name: x.name, commited: true }
        );
      } else {
        switch (verifyLock(i, locksTable, transactions)) {
          case "S":
            history = [...history, i];
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
              i,
            ];
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
              i,
            ];
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
                    transaction: i.transaction,
                  },
                  {
                    type: i.type === "R" ? "LS" : "LE",
                    data: i.data,
                    transaction: i.transaction,
                  },
                  i,
                ];
              } else {
                if (i.type === "W")
                  locksTable = [
                    ...locksTable.filter((x) => x.data !== i.data),
                    {
                      data: i.data,
                      type: "E",
                      transactions: [i.transaction],
                    },
                  ];
                else
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

                history = [
                  ...history,
                  {
                    type: "US",
                    data: i.data,
                    transaction: i.transaction,
                  },
                  {
                    type: i.type === "R" ? "LS" : "LE",
                    data: i.data,
                    transaction: i.transaction,
                  },
                  i,
                ];
              }
            } else
              throw `Deadlock: {data: ${i.data}, type: ${i.type}, transaction: ${i.transaction}`;

            break;
        }
      }

      console.log(history);
      console.log(locksTable);
      console.log("\n-----------------------\n");
    }, index * 1500)
  );

  setTimeout(() => {
    const clr = clearLocksTable(locksTable);

    history = [...history, ...clr[0]];
    locksTable = clr[1];

    console.log(history);
    console.log(locksTable);
  }, instructions.length * 1500);
}
