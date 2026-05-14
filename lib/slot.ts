const symbols = ["🍒", "🔥", "💀", "⭐", "🍀", "🧊", "❤️"];

export function spinSlot() {
  return Array.from({ length: 3 }, () => {
    const index = Math.floor(Math.random() * symbols.length);
    return symbols[index];
  });
}

export function calculateDamage(symbols: string[]) {
  const [a, b, c] = symbols;

  if (a === b && b === c) {
    if (a === "⭐") return 300;
    if (a === "💀") return 150;
    if (a === "🔥") return 100;
    if (a === "🍀") return 120;
    if (a === "🧊") return 90;
    if (a === "❤️") return 80;

    return 50;
  }

  if (a === b || b === c || a === c) {
    return 30;
  }

  return 10;
}