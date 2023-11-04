export function print(history, locksTable, datasTable, withSeparator = false) {
  console.log(history);
  console.log(locksTable);
  console.log(
    datasTable.map((x) => {
      return { ...x, history: JSON.stringify(x.history) };
    })
  );

  if (withSeparator) console.log("\n-----------------------\n");
}
