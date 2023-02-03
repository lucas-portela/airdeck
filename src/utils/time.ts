export const waitTimeout = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));
