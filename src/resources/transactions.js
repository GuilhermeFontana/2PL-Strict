export function getTransactions(instructions) {
  return instructions
    .map((x) => x.transaction)
    .filter((value, index, array) => !!value && array.indexOf(value) === index)
    .map((x) => {
      return {
        name: x,
        commited: false,
        blocked: {
          status: false,
          transactions: [],
        },
      };
    });
}
