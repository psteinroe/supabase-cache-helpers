import type { Database, fixture } from '../../integration/fixture';
import { authLock } from './auth-lock';
import {
  useDeleteManyMutation,
  useDeleteMutation,
  useInsertMutation,
  useQuery,
  useUpdateMutation,
  useUpsertMutation,
} from '@supabase-cache-helpers/postgrest-vue-query';
import { createClient, type Session } from '@supabase/supabase-js';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import {
  createApp,
  defineComponent,
  h,
  onUnmounted,
  provide,
  ref,
  shallowRef,
} from 'vue';
import './style.css';

declare global {
  interface Window {
    localFixture: ReturnType<typeof fixture>['publicConfig'] & {
      ids: ReturnType<typeof fixture>['ids'];
    };
  }
}

const config = window.localFixture;
if (
  !config ||
  !['127.0.0.1', 'localhost'].includes(new URL(config.url).hostname)
)
  throw new Error('This page requires a loopback test fixture');
const db = createClient<Database>(config.url, config.anonKey, {
  auth: { lock: authLock },
});
const session = shallowRef<Session | null>(null);
const switching = ref(false);
let authRevision = 0;
db.auth.onAuthStateChange((_event, next) => {
  // During explicit transitions, only the latest action may reveal a session.
  if (!switching.value) session.value = next;
});

const columns = 'id,owner_id,project_id,title,active,rank';

const Workspace = defineComponent({
  setup() {
    const owner = session.value!.user.id;
    const page = ref(0);
    const activeOnly = ref(true);
    const title = ref('Browser task');
    const pending = ref(false);
    const message = ref('Ready');
    const selected = ref<number[]>([]);
    const query = useQuery(() => {
      let builder = db
        .from('vue_query_tasks')
        .select(columns, { count: 'exact' });
      if (activeOnly.value) builder = builder.eq('active', true);
      return builder.order('rank').order('id').range(page.value, page.value);
    });
    const head = useQuery(() => {
      let builder = db
        .from('vue_query_tasks')
        .select('id', { count: 'exact', head: true });
      if (activeOnly.value) builder = builder.eq('active', true);
      return builder;
    });
    const projects = useQuery(
      db.from('vue_query_projects').select('id').order('id').limit(1),
    );
    const insert = useInsertMutation(
      db.from('vue_query_tasks'),
      ['id'],
      columns,
    );
    const update = useUpdateMutation(
      db.from('vue_query_tasks'),
      ['id'],
      columns,
    );
    const upsert = useUpsertMutation(
      db.from('vue_query_tasks'),
      ['id'],
      columns,
    );
    const remove = useDeleteMutation(
      db.from('vue_query_tasks'),
      ['id'],
      columns,
    );
    const removeMany = useDeleteManyMutation(
      db.from('vue_query_tasks'),
      ['id'],
      columns,
    );
    async function act(operation: () => Promise<unknown>) {
      pending.value = true;
      message.value = 'Saving';
      try {
        await operation();
        message.value = 'Saved';
      } catch (error) {
        message.value =
          error instanceof Error ? error.message : 'Mutation failed';
      } finally {
        pending.value = false;
        document.dispatchEvent(
          new CustomEvent('mutation-settled', { detail: owner }),
        );
      }
    }
    const button = (label: string, operation: () => Promise<unknown>) =>
      h(
        'button',
        {
          disabled:
            pending.value ||
            query.isFetching.value ||
            !projects.data.value?.length,
          onClick: () => act(operation),
        },
        label,
      );
    const task = (id: number) => ({
      id,
      owner_id: owner,
      project_id: projects.data.value![0].id,
      title: title.value,
      active: true,
      rank: 5,
    });
    return () =>
      h('section', { 'data-testid': 'workspace', 'data-user': owner }, [
        h('h2', 'Private tasks'),
        h('label', [
          h('input', {
            type: 'checkbox',
            checked: activeOnly.value,
            onChange: (event: Event) => {
              activeOnly.value = (event.target as HTMLInputElement).checked;
              page.value = 0;
            },
          }),
          'Active only',
        ]),
        h('div', { class: 'totals' }, [
          h('p', [
            'Page total ',
            h(
              'output',
              { 'data-testid': 'count' },
              String(query.count.value ?? '-'),
            ),
          ]),
          h('p', [
            'HEAD total ',
            h(
              'output',
              { 'data-testid': 'head-count' },
              String(head.count.value ?? '-'),
            ),
          ]),
        ]),
        h(
          'p',
          { 'data-testid': 'query-status' },
          query.isFetching.value || head.isFetching.value
            ? 'Loading'
            : query.isError.value || head.isError.value
              ? 'Query failed'
              : 'Loaded',
        ),
        h(
          'ul',
          query.data.value?.map((row) =>
            h(
              'li',
              { key: row.id, 'data-id': row.id, 'data-owner': row.owner_id },
              [
                h('strong', row.title),
                h('span', `Rank ${row.rank}`),
                h('label', [
                  h('input', {
                    type: 'checkbox',
                    checked: selected.value.includes(row.id),
                    onChange: (event: Event) => {
                      selected.value = (event.target as HTMLInputElement)
                        .checked
                        ? [...selected.value, row.id]
                        : selected.value.filter((id) => id !== row.id);
                    },
                  }),
                  'Select task',
                ]),
                h('div', { class: 'actions' }, [
                  button('Move task first', () =>
                    update.mutateAsync({ id: row.id, rank: -10 }),
                  ),
                  button('Hide task', () =>
                    update.mutateAsync({ id: row.id, active: false }),
                  ),
                  button('Delete task', () =>
                    remove.mutateAsync({ id: row.id }),
                  ),
                ]),
              ],
            ),
          ),
        ),
        !query.isFetching.value && !query.data.value?.length
          ? h('p', { 'data-testid': 'empty' }, 'No tasks on this page')
          : null,
        h('nav', { 'aria-label': 'Pagination' }, [
          h(
            'button',
            {
              disabled: page.value === 0 || pending.value,
              onClick: () => page.value--,
            },
            'Previous page',
          ),
          h('span', { 'data-testid': 'page' }, `Page ${page.value + 1}`),
          h(
            'button',
            { disabled: pending.value, onClick: () => page.value++ },
            'Next page',
          ),
        ]),
        h('label', [
          'Task title',
          h('input', {
            value: title.value,
            onInput: (event: Event) =>
              (title.value = (event.target as HTMLInputElement).value),
          }),
        ]),
        h('div', { class: 'actions' }, [
          button('Add task', () =>
            insert.mutateAsync([task(config.ids.inserted)]),
          ),
          button('Upsert task', () =>
            upsert.mutateAsync([{ ...task(config.ids.upserted), rank: 0 }]),
          ),
          h(
            'button',
            {
              disabled: pending.value || !selected.value.length,
              onClick: () =>
                act(async () => {
                  await removeMany.mutateAsync(
                    selected.value.map((id) => ({ id })),
                  );
                  selected.value = [];
                }),
            },
            'Delete selected',
          ),
        ]),
        h(
          'p',
          { role: 'status', 'data-testid': 'mutation-status' },
          message.value,
        ),
      ]);
  },
});

const AccountScope = defineComponent({
  setup() {
    // A retired mutation cannot be cancelled; its result must keep the retired client.
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 60_000 },
        mutations: { retry: false },
      },
    });
    client.mount();
    provide(VUE_QUERY_CLIENT, client);
    onUnmounted(() => {
      client.unmount();
      void client.cancelQueries();
      client.clear();
    });
    return () => h(Workspace);
  },
});

createApp({
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    async function signIn() {
      const revision = ++authRevision;
      session.value = null;
      switching.value = true;
      error.value = '';
      const credentials = { email: email.value, password: password.value };
      password.value = '';
      try {
        const result = await db.auth.signInWithPassword(credentials);
        if (revision !== authRevision) return;
        session.value = result.data.session;
        error.value = result.error?.message ?? '';
      } catch (cause) {
        if (revision === authRevision) error.value = String(cause);
      } finally {
        if (revision === authRevision) switching.value = false;
      }
    }
    async function signOut() {
      const revision = ++authRevision;
      session.value = null;
      switching.value = true;
      try {
        const result = await db.auth.signOut();
        if (revision === authRevision)
          error.value = result.error?.message ?? '';
      } catch (cause) {
        if (revision === authRevision) error.value = String(cause);
      } finally {
        if (revision === authRevision) switching.value = false;
      }
    }
    return () =>
      h('main', [
        h('header', [
          h('p', { class: 'eyebrow' }, 'LOCAL SUPABASE / REAL BROWSER'),
          h('h1', 'Account & cache lab'),
        ]),
        h(
          'form',
          {
            onSubmit: (event: Event) => {
              event.preventDefault();
              void signIn();
            },
          },
          [
            h('label', [
              'Email',
              h('input', {
                type: 'email',
                autocomplete: 'username',
                value: email.value,
                onInput: (event: Event) =>
                  (email.value = (event.target as HTMLInputElement).value),
              }),
            ]),
            h('label', [
              'Password',
              h('input', {
                type: 'password',
                autocomplete: 'current-password',
                value: password.value,
                onInput: (event: Event) =>
                  (password.value = (event.target as HTMLInputElement).value),
              }),
            ]),
            h('div', { class: 'actions' }, [
              h(
                'button',
                { type: 'submit', disabled: switching.value },
                'Sign in',
              ),
              h('button', { type: 'button', onClick: signOut }, 'Sign out'),
            ]),
          ],
        ),
        error.value ? h('p', { role: 'alert' }, error.value) : null,
        h(
          'p',
          { 'data-testid': 'identity' },
          session.value ? session.value.user.id : 'Signed out',
        ),
        session.value
          ? h(AccountScope, { key: session.value.user.id })
          : h(
              'p',
              { 'data-testid': 'signed-out' },
              'Sign in to view private tasks.',
            ),
      ]);
  },
}).mount('#app');
