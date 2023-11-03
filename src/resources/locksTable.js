export function createLocksTable(instructions) {
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

export function clearLocksTable(locksTable) {
  let history = [];
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
    return {
      data: x.data,
      type: null,
      transactions: [],
    };
  });

  return [history, locksTable];
}
