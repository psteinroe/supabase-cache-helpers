import { denormalize } from "../../src/filter/denormalize";
import { parseSelectParam } from "../../src/lib/parse-select-param";

describe("denormalize", () => {
  it("should work with nested alias", () => {
    const paths = parseSelectParam(
      "note_id(test,relation_id,rel:relation_id(test))",
    );

    expect(
      denormalize(paths, {
        test: "123",
        some: "456",
        value: "789",
        "note_id.test": "123",
        "note_id.relation_id": "id",
        "note_id.relation_id.test": "345",
      }),
    ).toEqual({
      note_id: {
        test: "123",
        relation_id: "id",
        rel: {
          test: "345",
        },
      },
    });
  });

  it("should work with multiple aliased fkeys to the same table", () => {
    const paths = parseSelectParam(
      "created_by:employee!created_by_employee_id(display_name),updated_by:employee!updated_by_employee_id(display_name)",
    );

    expect(
      denormalize(paths, {
        "employee!created_by_employee_id.display_name": "one",
        "employee!updated_by_employee_id.display_name": "two",
      }),
    ).toEqual({
      created_by: {
        display_name: "one",
      },
      updated_by: {
        display_name: "two",
      },
    });
  });

  it("should set null if relation is null", () => {
    expect(
      denormalize(
        [
          {
            declaration: "assignee:assignee_id.id",
            alias: "assignee.id",
            path: "assignee_id.id",
          },
        ],
        {
          assignee_id: null,
        },
      ),
    ).toEqual({
      assignee: null,
    });
  });

  it("should work with json array of objects", () => {
    expect(
      denormalize(
        [
          {
            declaration: "id",
            path: "id",
          },
          {
            declaration: "template:template_id.id",
            alias: "template.id",
            path: "template_id.id",
          },
          {
            declaration: "template:template_id.buttons",
            alias: "template.buttons",
            path: "template_id.buttons",
          },
        ],
        {
          id: "741c29ab-e03d-4b97-8d51-954579effa10",
          "template_id.id": "da6d45ca-6644-437a-8a58-0da73ecda566",
          "template_id.buttons.0.url": "https://hellomateo.de",
          "template_id.buttons.0.text": "Visit us",
          "template_id.buttons.0.type": "call_to_action",
          "template_id.buttons.0.subtype": "url",
          "template_id.buttons.1.text": "Call us",
          "template_id.buttons.1.type": "call_to_action",
          "template_id.buttons.1.subtype": "phone_number",
          "template_id.buttons.1.phone_number": "+420123456789",
        },
      ),
    ).toEqual({
      id: "741c29ab-e03d-4b97-8d51-954579effa10",
      template: {
        id: "da6d45ca-6644-437a-8a58-0da73ecda566",
        buttons: [
          {
            url: "https://hellomateo.de",
            text: "Visit us",
            type: "call_to_action",
            subtype: "url",
          },
          {
            text: "Call us",
            type: "call_to_action",
            subtype: "phone_number",
            phone_number: "+420123456789",
          },
        ],
      },
    });
  });

  it("should work with json column", () => {
    expect(
      denormalize(
        [
          {
            declaration: "id",
            path: "id",
          },
          {
            declaration: "segments:segment.id",
            alias: "segments.id",
            path: "segment.id",
          },
          {
            declaration: "segments:segment.name",
            alias: "segments.name",
            path: "segment.name",
          },
          {
            declaration: "segments:segment.counts",
            alias: "segments.counts",
            path: "segment.counts",
          },
          {
            declaration: "segments:segment.channel_type",
            alias: "segments.channel_type",
            path: "segment.channel_type",
          },
        ],
        {
          id: "1c09d6c3-9a77-4e49-8193-8bb7430dd3f0",
          "segment.0.id": "85bc6e0a-2b24-4b2b-9563-9d8e59a13c31",
          "segment.0.name": "Test Segment",
          "segment.0.counts.contacts_total": 4,
          "segment.0.counts.contacts_with_marketing_opt_in": 0,
          "segment.0.counts.contacts_with_transactional_opt_in": 1,
          "segment.0.channel_type": "whatsapp",
        },
      ),
    ).toEqual({
      id: "1c09d6c3-9a77-4e49-8193-8bb7430dd3f0",
      segments: [
        {
          id: "85bc6e0a-2b24-4b2b-9563-9d8e59a13c31",
          name: "Test Segment",
          channel_type: "whatsapp",
          counts: {
            contacts_total: 4,
            contacts_with_marketing_opt_in: 0,
            contacts_with_transactional_opt_in: 1,
          },
        },
      ],
    });
  });

  it("should set empty array if relation is empty array", () => {
    expect(
      denormalize(
        [
          {
            declaration: "tags:tag.id",
            alias: "tags.id",
            path: "tag.id",
          },
          {
            declaration: "tags:tag.name",
            alias: "tags.name",
            path: "tag.name",
          },
          {
            declaration: "tags:tag.color",
            alias: "tags.color",
            path: "tag.color",
          },
        ],
        {
          tag: [],
        },
      ),
    ).toEqual({
      tags: [],
    });
  });
});
