import { ifDateGetTime } from "../../src/lib/if-date-get-time";

describe("ifDateGetTime", () => {
  it("should return input if its a number", () => {
    expect(ifDateGetTime(20)).toEqual(20);
  });

  it("should return input if its an arbitrary string", () => {
    expect(ifDateGetTime("test")).toEqual("test");
  });

  it("should return time if input is date", () => {
    const d = new Date();
    expect(ifDateGetTime(d)).toEqual(d.getTime());
  });

  it("should return time if input is iso string", () => {
    const t = "2023-05-09T12:33:26.688932+00:00";
    expect(ifDateGetTime(t)).toEqual(new Date(t).getTime());
  });
});
