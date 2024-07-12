import { groupPathsRecursive } from "../../src/lib/group-paths-recursive";

describe("groupPathsRecursive", () => {
  it("should recursively group paths", () => {
    expect(
      groupPathsRecursive([
        { declaration: "something", path: "something" },
        { declaration: "the", path: "the" },
        { declaration: "note_id", path: "note_id" },
        { declaration: "user", path: "user" },
        { declaration: "queries", path: "queries" },
        { declaration: "note_id.test", path: "note_id.test" },
        { declaration: "note_id.relation_id", path: "note_id.relation_id" },
        {
          declaration: "note_id.relation_id.test",
          path: "note_id.relation_id.test",
        },
        { path: "test", declaration: "test" },
        { path: "some", declaration: "some" },
        { path: "value", declaration: "value" },
      ]),
    ).toEqual([
      {
        declaration: "something",
        path: "something",
      },
      {
        declaration: "the",
        path: "the",
      },
      {
        declaration: "note_id",
        path: "note_id",
      },
      {
        declaration: "user",
        path: "user",
      },
      {
        declaration: "queries",
        path: "queries",
      },
      {
        declaration: "note_id",
        path: "note_id",
        paths: [
          {
            declaration: "test",
            path: "test",
          },
          {
            declaration: "relation_id",
            path: "relation_id",
          },
          {
            declaration: "relation_id",
            path: "relation_id",
            paths: [{ declaration: "test", path: "test" }],
          },
        ],
      },
      {
        path: "test",
        declaration: "test",
      },
      {
        path: "some",
        declaration: "some",
      },
      {
        path: "value",
        declaration: "value",
      },
    ]);
  });
});
