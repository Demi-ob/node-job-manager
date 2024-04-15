export function generateRandom10DigitString() {
  return Math.random().toString(36).substring(2, 12);
}

export function generateDateWithoutSeconds() {
  return new Date().toLocaleDateString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateQueueJobId(uniquePrefix: string) {
  return `${uniquePrefix}_${generateDateWithoutSeconds()}`;
}
