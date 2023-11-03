/**
 *
 * L: Liberado, pode bloquear
 * B: Bloqueado por outro
 * S: Bloqueado, por mim
 * U: Bloqueado, por mim, e necessário upgrade
 *
 */
export function verifyLock(instruction, locksTable, transactions) {
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
export function verifyUnlockLock(instruction, lock, transactions) {
  if (lock.type === "E")
    return transactions.filter((x) => x.name === lock.transactions[0])[0].commited ? "L" : "B";

  return lock.transactions
    .filter((x) => x !== instruction.transaction)
    .filter((x) => !transactions.filter((t) => t.name === x)[0].commited).length
    ? "B"
    : "L";
}
