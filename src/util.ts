/**
 * Creates a promise that resolves after a specified duration.
 *
 * This method can be used to introduce a delay in code execution. The promise
 * will resolve after the specified time has elapsed, effectively creating a pause.
 *
 * @param {number} time - The duration in milliseconds for which the promise should wait before resolving.
 * @returns {Promise<void>} A promise that resolves after the specified duration.
 *
 * @example
 * // Using the wait function to introduce a delay
 * wait(2000).then(() => {
 *   console.log('2 seconds have passed');
 * });
 */
export const wait = (time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
