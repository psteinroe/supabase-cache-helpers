import { PostgrestBuilder } from "@supabase/postgrest-js";
import {
    sortSearchParams,
    encodeObject,
    isObject,
    OrderDefinition,
} from "./lib";
import {
    PostgrestQueryParser,
    PostgrestQueryParserOptions,
} from "./postgrest-query-parser";

export class PostgrestParser<Result> extends PostgrestQueryParser {
    private readonly _url: URL;
    private readonly _headers: { [key: string]: string };
    private readonly _body: object | undefined;
    private readonly _method: "GET" | "HEAD" | "POST" | "PATCH" | "DELETE";

    public readonly queryKey: string;
    public readonly bodyKey: string | undefined;
    public readonly count: string | null;
    public readonly schema: string;
    public readonly table: string;
    public readonly isHead: boolean | undefined;
    public readonly limit: number | undefined;
    public readonly offset: number | undefined;
    public readonly orderBy: OrderDefinition[] = [];
    public readonly orderByKey: string;

    constructor(
        fb: PostgrestBuilder<Result>,
        public readonly opts?: PostgrestQueryParserOptions
    ) {
        super(new URL(fb["url"]).searchParams.toString(), opts);

        this._url = new URL(fb["url"]);
        this._headers = { ...fb["headers"] };
        this._body = isObject(fb["body"]) ? { ...fb["body"] } : undefined;
        this._method = fb["method"];

        this.queryKey = sortSearchParams(this._url.searchParams).toString();

        this.table = (this._url.toString().split("/rest/v1/").pop() as string)
            .split("?")
            .shift() as string;

        if (this._body) {
            this.bodyKey = encodeObject(this._body as Record<string, unknown>);
        }

        // 'Prefer': return=minimal|representation,count=exact|planned|estimated
        const preferHeaders: Record<string, string> = (
            this._headers["Prefer"] ?? ""
        )
            .split(",")
            .reduce<Record<string, string>>((prev, curr) => {
                const s = curr.split("=");
                return {
                    ...prev,
                    [s[0]]: s[1],
                };
            }, {});
        this.count = preferHeaders["count"] ?? null;

        this.schema = fb["schema"] as string;

        this.isHead = this._method === "HEAD";

        const limit = this._url.searchParams.get("limit");
        this.limit = limit ? Number(limit) : undefined;
        const offset = this._url.searchParams.get("offset");
        this.offset = offset ? Number(offset) : undefined;

        this._url.searchParams.forEach((value, key) => {
            const split = key.split(".");
            if (split[split.length === 2 ? 1 : 0] === "order") {
                // separated by ,
                const orderByDefs = value.split(",");
                orderByDefs.forEach((def) => {
                    const [column, ascending, nullsFirst] = def.split(".");
                    this.orderBy.push({
                        ascending: ascending === "asc",
                        column,
                        nullsFirst: nullsFirst === "nullsfirst",
                        foreignTable: split.length === 2 ? split[0] : undefined,
                    });
                });
            }
        });
        this.orderByKey = this.orderBy
            .map(
                ({ column, ascending, nullsFirst, foreignTable }) =>
                    `${foreignTable ? `${foreignTable}.` : ""}${column}:${ascending ? "asc" : "desc"
                    }.${nullsFirst ? "nullsFirst" : "nullsLast"}`
            )
            .join("|");
    }
}
