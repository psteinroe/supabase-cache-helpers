import { PostgrestClient } from '@supabase/postgrest-js';
import { execFileSync } from 'node:child_process';
import { randomInt, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

export type Project = { id: number; owner_id: string; name: string };
export type Task = {
  id: number;
  owner_id: string;
  project_id: number;
  title: string;
  active: boolean;
  rank: number;
};
export type Database = {
  public: {
    Tables: {
      vue_query_projects: {
        Row: Project;
        Insert: Project;
        Update: Partial<Project>;
        Relationships: [];
      };
      vue_query_tasks: {
        Row: Task;
        Insert: Task;
        Update: Partial<Task>;
        Relationships: [
          {
            foreignKeyName: 'vue_query_tasks_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'vue_query_projects';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
  };
};

export const columns = 'id,owner_id,project_id,title,active,rank';

/** Only the local CLI's loopback stack is allowed; never read cloud credentials. */
export function fixture(root = resolve(__dirname, '../../../..')) {
  const binary = resolve(
    root,
    'node_modules/supabase/bin',
    process.platform === 'win32' ? 'supabase.exe' : 'supabase',
  );
  const status = JSON.parse(
    execFileSync(binary, ['status', '-o', 'json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  ) as { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string };
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(
      new URL(status.API_URL).hostname,
    )
  ) {
    throw new Error('Integration tests require a loopback Supabase URL');
  }
  if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY)
    throw new Error('Missing local Supabase keys');

  const client = (token: string) =>
    new PostgrestClient<Database>(`${status.API_URL}/rest/v1`, {
      headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${token}` },
    });
  const admin = client(status.SERVICE_ROLE_KEY);
  const users: string[] = [];
  const base = randomInt(10_000, 100_000_000);
  const ids = {
    project: base,
    otherProject: base + 1,
    secondProject: base + 2,
    first: base + 11,
    second: base + 12,
    inactive: base + 13,
    foreign: base + 14,
    foreignSecond: base + 15,
    inserted: base + 16,
    upserted: base + 17,
  };

  async function auth(path: string, method: string, body?: unknown) {
    const result = await fetch(`${status.API_URL}/auth/v1${path}`, {
      method,
      headers: {
        apikey: status.ANON_KEY,
        Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!result.ok)
      throw new Error(
        `Local auth fixture ${method} ${path.split('/')[1]} failed (${result.status})`,
      );
    return result.json();
  }

  async function user() {
    const email = `vue-query-${randomUUID()}@example.test`;
    const password = randomUUID();
    const created = (await auth('/admin/users', 'POST', {
      email,
      password,
      email_confirm: true,
    })) as { id: string };
    users.push(created.id);
    const session = (await auth('/token?grant_type=password', 'POST', {
      email,
      password,
    })) as { access_token: string };
    if (!session.access_token)
      throw new Error('Local sign-in did not return an access token');
    return {
      id: created.id,
      email,
      password,
      db: client(session.access_token),
    };
  }

  return {
    ids,
    publicConfig: { url: status.API_URL, anonKey: status.ANON_KEY },
    admin,
    user,
    anon: client(status.ANON_KEY),
    task(owner: string, id: number, rank: number, active = true): Task {
      return {
        id,
        owner_id: owner,
        project_id: ids.project,
        title: `task-${id}`,
        rank,
        active,
      };
    },
    async reset(a: string, b: string) {
      // Unique fixture owners keep other local data and parallel test runs intact.
      await admin
        .from('vue_query_tasks')
        .delete()
        .in('owner_id', [a, b])
        .throwOnError();
      await admin
        .from('vue_query_projects')
        .delete()
        .in('owner_id', [a, b])
        .throwOnError();
      await admin
        .from('vue_query_projects')
        .insert([
          { id: ids.project, owner_id: a, name: 'Project A' },
          { id: ids.otherProject, owner_id: b, name: 'Secret project B' },
          { id: ids.secondProject, owner_id: a, name: 'Second project A' },
        ])
        .throwOnError();
      await admin
        .from('vue_query_tasks')
        .insert([
          this.task(a, ids.first, 10),
          this.task(a, ids.second, 30),
          this.task(a, ids.inactive, 40, false),
          {
            ...this.task(b, ids.foreign, 20),
            project_id: ids.otherProject,
            title: 'Secret task B',
          },
          {
            ...this.task(b, ids.foreignSecond, 50),
            project_id: ids.otherProject,
            title: 'Another secret B',
          },
        ])
        .throwOnError();
    },
    async cleanup() {
      for (const id of users) await auth(`/admin/users/${id}`, 'DELETE');
    },
  };
}
