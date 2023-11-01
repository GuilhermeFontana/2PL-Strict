//#region Export
export function createHistory(instructions) {
  let locksTable = createTableLocks(instructions);
  let transactions = getTransactions(instructions);

  let history = [];
  instructions.forEach((i) => {
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
                : { data: x.data, type: i.type === "R" ? "S" : "E", transactions: [i.transaction] }
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
          }

          break;
      }
    }
  });

  console.log(history);
  console.log(locksTable);

  locksTable.forEach((x) => {
    if (x.transactions) {
      x.transactions.forEach((t) => {
        history = [
          ...history,
          {
            type: "U" + x.type,
            data: x.data,
            transaction: t,
          },
        ];
      });
    }
  });

  locksTable = locksTable.map((x) => {
    return { ...x, transactions: [] };
  });

  console.log(locksTable);
}
//#endregion Export

//#region Not-Export

function createTableLocks(instructions) {
  return instructions
    .map((x) => x.data)
    .filter((value, index, array) => !!value && array.indexOf(value) === index)
    .map((x) => {
      return {
        data: x,
        type: null,
        transactions: [],
      };
    });
}

function getTransactions(instructions) {
  return instructions
    .map((x) => x.transaction)
    .filter((value, index, array) => !!value && array.indexOf(value) === index)
    .map((x) => {
      return {
        name: x,
        commited: false,
      };
    });
}

/**
 *
 * L: Liberado, pode bloquear
 * B: Bloqueado por outro
 * S: Bloqueado, por mim
 * U: Bloqueado, por mim, e necessário upgrade
 *
 */
function verifyLock(instruction, locksTable, transactions) {
  const lock = locksTable.filter((x) => x.data === instruction.data)[0];

  if (!lock.type) return "L";

  if (lock.type === "E") return lock.transactions[0] === instruction.transaction ? "S" : "B";

  if (instruction.type === "R")
    return lock.transactions.some((x) => x === instruction.transaction) ? "S" : "L";
  else {
    if (lock.transactions.length > 1) return "B";

    return lock.transactions[0] === instruction.transaction ? "U" : "B";
  }
}

/**
 *
 * L: Pode liberar
 * B: Bloqueado
 */
function verifyUnlockLock(instruction, lock, transactions) {
  if (lock.type === "E")
    return transactions.filter((x) => x.name === lock.transactions[0])[0].commited ? "L" : "B";

  return lock.transactions
    .filter((x) => x !== instruction.transaction)
    .filter((x) => !transactions.filter((t) => t.name === x)[0].commited).length
    ? "B"
    : "L";
}

//#endregion Not-Export
