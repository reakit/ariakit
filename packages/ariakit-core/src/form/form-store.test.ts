import { set } from "./form-store.ts";

describe("set", () => {
  test("set property", () => {
    const sut = set(Object.create(null), "a", 1);
    expect(sut).toEqual({ a: 1 });
  });

  test("set deep property", () => {
    const sut = set(Object.create(null), "a.b.c", 1);
    expect(sut).toEqual({ a: { b: { c: 1 } } });
  });

  test("set property in existing object", () => {
    const obj = { x: 10, y: 20 };
    const sut = set(obj, "z", 30);
    expect(sut).toEqual({ x: 10, y: 20, z: 30 });
  });

  test("overwrite existing property", () => {
    const obj = { a: { b: 2 } };
    const sut = set(obj, "a.b", 3);
    expect(sut).toEqual({ a: { b: 3 } });
  });

  test("set property in array", () => {
    const arr = [1, 2, 3];
    const sut = set(arr, "1", 20);
    expect(sut).toEqual([1, 20, 3]);
  });

  test("set property with numeric key in object", () => {
    const sut = set(Object.create(null), "a.1.b", 1);
    expect(sut).toEqual({ a: { "1": { b: 1 } } });
  });

  test("set property in empty array", () => {
    const sut = set({ a: { b: ["x"] } }, "a.b.0", "Y");
    expect(sut).toEqual({ a: { b: ["Y"] } });
  });

  // not handled
  // test("set property in deep array", () => {
  //   const sut = set({ a: { b: ["x"] } }, "a.b.0.c", "Y");
  //   expect(sut).toEqual({ a: { b: [{ c: "Y" }] } });
  // });
});
