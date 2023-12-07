import { wait } from "../util";

jest.useFakeTimers();

describe("wait function", () => {
  it("should resolve after specified time", async () => {
    const promise = wait(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });
});
