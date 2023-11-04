export function getDatas(instructions) {
  return instructions
    .map((x) => x.data)
    .filter((value, index, array) => !!value && array.indexOf(value) === index)
    .map((x) => {
      const value = Math.floor(Math.random() * 10 + 1);

      return {
        name: x,
        value,
        history: [{ newValue: value, transaction: 0 }],
      };
    });
}

export function getValue(instruction, datasTable) {
  return datasTable.filter((x) => x.name === instruction.data)[0].value;
}

export function setValue(instruction, datasTable) {
  return datasTable.map((x) =>
    x.name !== instruction.data
      ? x
      : {
          name: x.name,
          value: instruction.value,
          history: [{ newValue: x.value, transaction: instruction.transaction }, ...x.history],
        }
  );
}
