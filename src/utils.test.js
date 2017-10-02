// @flow

import { move, remove, flatten } from "./utils.js";

const getKey = d => d.name;
const children = "ch";

test("move to the root after the leaf", () => {
  expect(
    move({
      data: { name: "0", ch: [{ name: "1" }, { name: "2" }] },
      getKey,
      children,
      from: "1",
      to: "0",
      after: "2"
    })
  ).toEqual({
    name: "0",
    ch: [{ name: "2" }, { name: "1" }]
  });
});

test("move to the group after the leaf", () => {
  expect(
    move({
      data: {
        name: "0",
        ch: [
          { name: "1", ch: [{ name: "2" }] },
          { name: "3", ch: [{ name: "4" }, { name: "5" }] }
        ]
      },
      getKey,
      children,
      from: "2",
      to: "3",
      after: "4"
    })
  ).toEqual({
    name: "0",
    ch: [
      { name: "1", ch: [] },
      { name: "3", ch: [{ name: "4" }, { name: "2" }, { name: "5" }] }
    ]
  });
});

test("move in the beginning of the group if the leaf is empty", () => {
  expect(
    move({
      data: {
        name: "0",
        ch: [
          { name: "1", ch: [{ name: "2" }] },
          { name: "3", ch: [{ name: "4" }] }
        ]
      },
      getKey,
      children,
      from: "2",
      to: "3",
      after: ""
    })
  ).toEqual({
    name: "0",
    ch: [
      { name: "1", ch: [] },
      { name: "3", ch: [{ name: "2" }, { name: "4" }] }
    ]
  });
});

test("remove leaf", () => {
  expect(
    remove({
      data: { name: "0", ch: [{ name: "1" }] },
      getKey,
      children,
      removing: "1"
    })
  ).toEqual({ name: "0", ch: [] });
});

test("remove group", () => {
  expect(
    remove({
      data: { name: "0", ch: [{ name: "1", ch: [{ name: "2" }] }] },
      getKey,
      children,
      removing: "1"
    })
  ).toEqual({ name: "0", ch: [] });
});

test("not remove root", () => {
  expect(
    remove({
      data: { name: "0", ch: [] },
      getKey,
      children,
      removing: "0"
    })
  ).toEqual({ name: "0", ch: [] });
});

test("flatten", () => {
  const leaf2 = { name: "2" };
  const leaf3 = { name: "3" };
  const group1 = { name: "1", ch: [leaf2] };
  const root = { name: "0", ch: [group1, leaf3] };
  expect(
    flatten({
      data: root,
      getKey,
      children
    })
  ).toEqual([
    {
      key: "0",
      parents: [],
      data: root
    },
    {
      key: "1",
      parents: ["0"],
      data: group1
    },
    {
      key: "2",
      parents: ["0", "1"],
      data: leaf2
    },
    {
      key: "3",
      parents: ["0"],
      data: leaf3
    }
  ]);
});
