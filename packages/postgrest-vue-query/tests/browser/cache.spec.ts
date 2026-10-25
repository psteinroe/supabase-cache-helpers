import { columns, fixture } from '../integration/fixture';
import {
  test as base,
  expect,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { fileURLToPath } from 'node:url';

type Local = ReturnType<typeof fixture>;
type User = Awaited<ReturnType<Local['user']>>;
declare global {
  interface Window {
    cacheLeaks: string[];
    settledMutations: string[];
  }
}
const test = base.extend<{ accounts: { local: Local; a: User; b: User } }>({
  accounts: async ({ page, context }, use) => {
    const errors: string[] = [];
    const watchErrors = (tab: Page) => {
      tab.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    };
    watchErrors(page);
    context.on('page', watchErrors);
    const local = fixture(
      fileURLToPath(new URL('../../../../', import.meta.url)),
    );
    try {
      const a = await local.user();
      const b = await local.user();
      await local.reset(a.id, b.id);
      await page.addInitScript(
        (config) => {
          window.localFixture = config;
        },
        { ...local.publicConfig, ids: local.ids },
      );
      await page.addInitScript(() => {
        window.cacheLeaks = [];
        window.settledMutations = [];
        document.addEventListener('mutation-settled', (event) => {
          window.settledMutations.push((event as CustomEvent<string>).detail);
        });
        new MutationObserver(() => {
          const scope = document.querySelector('[data-testid="workspace"]');
          const owner = scope?.getAttribute('data-user');
          document.querySelectorAll('li[data-owner]').forEach((row) => {
            if (!owner || row.getAttribute('data-owner') !== owner)
              window.cacheLeaks.push(
                row.getAttribute('data-owner') ?? 'unknown',
              );
          });
        }).observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
        });
      });
      await page.goto('/');
      await use({ local, a, b });
      expect(await page.evaluate(() => window.cacheLeaks)).toEqual([]);
      expect(errors).toEqual([]);
    } finally {
      await page.close();
      await local.cleanup();
    }
  },
});

test.beforeAll(async ({ browser }, info) => {
  console.log(
    `${info.project.name}: ${browser.browserType().name()} ${browser.version()}`,
  );
});

async function login(page: Page, user: User) {
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByTestId('identity')).toHaveText(user.id);
}

test('isolates fresh caches on direct sign-in, logout, and session restoration', async ({
  page,
  accounts: { local, a, b },
}) => {
  await a.db
    .from('vue_query_tasks')
    .insert(local.task(a.id, local.ids.inserted, 5))
    .throwOnError();
  await login(page, a);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    a.id,
  );
  await expect(page.getByTestId('count')).toHaveText('3');
  await login(page, b);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    b.id,
  );
  await expect(page.getByTestId('count')).toHaveText('2');
  await expect(page.getByTestId('head-count')).toHaveText('2');
  await expect(page.getByText('Secret task B', { exact: true })).toBeVisible();
  await clickMutation(page, 'Hide task');
  await expect(page.getByTestId('count')).toHaveText('1');
  await expect(page.getByTestId('head-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByTestId('workspace')).toHaveCount(0);
  await expect(page.locator('li[data-owner]')).toHaveCount(0);
  await login(page, a);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    a.id,
  );
  await expect(page.getByTestId('count')).toHaveText('3');
  expect(await page.evaluate(() => window.cacheLeaks)).toEqual([]);
  await page.reload();
  await expect(page.getByTestId('identity')).toHaveText(a.id);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    a.id,
  );
  expect(
    (
      await a.db
        .from('vue_query_tasks')
        .select(columns)
        .eq('active', true)
        .throwOnError()
    ).data,
  ).toHaveLength(3);
});

async function clickMutation(page: Page, name: string) {
  const before = await page.evaluate(() => window.settledMutations.length);
  await page.getByRole('button', { name, exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.settledMutations.length))
    .toBe(before + 1);
  await expect(page.getByTestId('mutation-status')).toHaveText('Saved');
  await expect(page.getByTestId('query-status')).toHaveText('Loaded');
}

function gate() {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { ready, release };
}

test('keeps auth locks exclusive across tabs and propagates timeout and operation errors', async ({
  page,
  context,
  accounts: { local },
}) => {
  const other = await context.newPage();
  await other.addInitScript(
    (config) => {
      window.localFixture = config;
    },
    { ...local.publicConfig, ids: local.ids },
  );
  await other.goto('/');
  const held = page.evaluate(async () => {
    const path = '/auth-lock.ts';
    const { authLock }: typeof import('./page/auth-lock') = await import(path);
    await authLock('browser-auth-lock-test', -1, async () => {
      document.body.dataset.lockHeld = 'yes';
      await new Promise<void>((resolve) => {
        document.addEventListener('release-test-lock', () => resolve(), {
          once: true,
        });
      });
    });
  });
  let queued: Promise<string> | undefined;
  try {
    await expect(page.locator('body')).toHaveAttribute('data-lock-held', 'yes');
    expect(
      await other.evaluate(async () => {
        const path = '/auth-lock.ts';
        const { authLock }: typeof import('./page/auth-lock') = await import(
          path
        );
        let calls = 0;
        const timeouts: boolean[] = [];
        for (const timeout of [0, 25]) {
          try {
            await authLock(
              'browser-auth-lock-test',
              timeout,
              async () => calls++,
            );
            timeouts.push(false);
          } catch (error) {
            timeouts.push(
              error instanceof Error &&
                'isAcquireTimeout' in error &&
                error.isAcquireTimeout === true,
            );
          }
        }
        return { calls, timeouts };
      }),
    ).toEqual({ calls: 0, timeouts: [true, true] });
    queued = other.evaluate(async () => {
      const path = '/auth-lock.ts';
      const { authLock }: typeof import('./page/auth-lock') = await import(
        path
      );
      return authLock(
        'browser-auth-lock-test',
        -1,
        async () => 'queued result',
      );
    });
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const state = await navigator.locks.query();
          return state.pending?.some(
            (lock) => lock.name === 'browser-auth-lock-test',
          );
        }),
      )
      .toBe(true);
    await page.evaluate(() =>
      document.dispatchEvent(new Event('release-test-lock')),
    );
    await held;
    expect(await queued).toBe('queued result');
    expect(
      await other.evaluate(async () => {
        const path = '/auth-lock.ts';
        const { authLock }: typeof import('./page/auth-lock') = await import(
          path
        );
        const failure = new Error('operation failed');
        let sameError = false;
        try {
          await authLock('browser-auth-lock-test', -1, async () => {
            throw failure;
          });
        } catch (error) {
          sameError = error === failure;
        }
        const next = await authLock(
          'browser-auth-lock-test',
          0,
          async () => 42,
        );
        return { sameError, next };
      }),
    ).toEqual({ sameError: true, next: 42 });
  } finally {
    await page.evaluate(() =>
      document.dispatchEvent(new Event('release-test-lock')),
    );
    await held;
    await queued;
    await other.close();
  }
});

test('discards a real old-account query response released after switching', async ({
  page,
  accounts: { a, b },
}) => {
  const arrived = gate();
  const response = gate();
  const done = gate();
  let held = false;
  await page.route('**/rest/v1/vue_query_tasks?*', async (route) => {
    if (route.request().method() !== 'GET' || held) return route.continue();
    held = true;
    const actual = await route.fetch();
    expect(actual.ok()).toBe(true);
    expect((await actual.json())[0].owner_id).toBe(a.id);
    arrived.release();
    await response.ready;
    await route.fulfill({ response: actual });
    done.release();
  });
  try {
    await login(page, a);
    await arrived.ready;
    const aborted = page.waitForEvent('requestfailed', {
      predicate: (request) =>
        request.method() === 'GET' &&
        request.url().includes('/rest/v1/vue_query_tasks?'),
    });
    await login(page, b);
    await expect(page.locator('li[data-owner]')).toHaveAttribute(
      'data-owner',
      b.id,
    );
    response.release();
    await done.ready;
    expect((await aborted).failure()).not.toBeNull();
    await expect(
      page.getByText('Secret task B', { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('count')).toHaveText('2');
  } finally {
    response.release();
  }
});

test('keeps a late real mutation result out of the next account cache', async ({
  page,
  accounts: { local, a, b },
}) => {
  await login(page, a);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    a.id,
  );
  const arrived = gate();
  const response = gate();
  const done = gate();
  await page.route('**/rest/v1/vue_query_tasks?*', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const actual = await route.fetch();
    expect(actual.status()).toBe(201);
    expect((await actual.json())[0].owner_id).toBe(a.id);
    arrived.release();
    await response.ready;
    await route.fulfill({ response: actual });
    done.release();
  });
  try {
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await arrived.ready;
    await login(page, b);
    await expect(
      page.getByText('Secret task B', { exact: true }),
    ).toBeVisible();
    response.release();
    await done.ready;
    await expect
      .poll(() => page.evaluate(() => window.settledMutations))
      .toContain(a.id);
    await expect(page.getByTestId('mutation-status')).toHaveText('Ready');
    await expect(page.getByTestId('count')).toHaveText('2');
    await expect(page.getByTestId('head-count')).toHaveText('2');
    await page.unroute('**/rest/v1/vue_query_tasks?*');
    await login(page, a);
    await expect(page.getByTestId('count')).toHaveText('3');
    await expect(page.locator('li[data-owner]')).toHaveAttribute(
      'data-owner',
      a.id,
    );
    expect(
      (
        await a.db
          .from('vue_query_tasks')
          .select('id')
          .eq('id', local.ids.inserted)
          .single()
          .throwOnError()
      ).data.id,
    ).toBe(local.ids.inserted);
  } finally {
    response.release();
  }
});

test('hides private data while login/logout is pending and stays closed after failed sign-in', async ({
  page,
  accounts: { a, b },
}) => {
  await login(page, a);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    a.id,
  );
  const arrived = gate();
  const response = gate();
  await page.route('**/auth/v1/token?*', async (route) => {
    const actual = await route.fetch();
    expect(actual.status()).toBe(400);
    arrived.release();
    await response.ready;
    await route.fulfill({ response: actual });
  });
  try {
    await page.getByLabel('Email', { exact: true }).fill(b.email);
    await page
      .getByLabel('Password', { exact: true })
      .fill('incorrect-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await arrived.ready;
    await expect(page.getByTestId('workspace')).toHaveCount(0);
    response.release();
    await expect(page.getByRole('alert')).toContainText(
      'Invalid login credentials',
    );
    await expect(page.getByTestId('workspace')).toHaveCount(0);
    await page.unroute('**/auth/v1/token?*');
    await login(page, a);
    await expect(page.locator('li[data-owner]')).toHaveAttribute(
      'data-owner',
      a.id,
    );
    const signedOut = gate();
    const logoutResponse = gate();
    const logoutDone = gate();
    await page.route('**/auth/v1/logout?*', async (route) => {
      const actual = await route.fetch();
      expect(actual.ok()).toBe(true);
      signedOut.release();
      await logoutResponse.ready;
      await route.fulfill({ response: actual });
      logoutDone.release();
    });
    try {
      await page.getByRole('button', { name: 'Sign out', exact: true }).click();
      await signedOut.ready;
      await expect(page.getByTestId('workspace')).toHaveCount(0);
    } finally {
      logoutResponse.release();
    }
    await expect(page.getByTestId('identity')).toHaveText('Signed out');
    await logoutDone.ready;
  } finally {
    response.release();
  }
});

test('does not reopen a superseded sign-in while a later logout is pending', async ({
  page,
  accounts: { a, b },
}) => {
  await login(page, a);
  await expect(page.locator('li[data-owner]')).toHaveAttribute(
    'data-owner',
    a.id,
  );
  const signedIn = gate();
  const signInResponse = gate();
  const signedOut = gate();
  const signOutResponse = gate();
  const done = gate();
  await page.route('**/auth/v1/token?*', async (route) => {
    const actual = await route.fetch();
    expect(actual.ok()).toBe(true);
    signedIn.release();
    await signInResponse.ready;
    await route.fulfill({ response: actual });
  });
  await page.route('**/auth/v1/logout?*', async (route) => {
    const actual = await route.fetch();
    expect(actual.ok()).toBe(true);
    signedOut.release();
    await signOutResponse.ready;
    await route.fulfill({ response: actual });
    done.release();
  });
  try {
    await page.getByLabel('Email', { exact: true }).fill(b.email);
    await page.getByLabel('Password', { exact: true }).fill(b.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await signedIn.ready;
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    signInResponse.release();
    await signedOut.ready;
    await expect(page.getByTestId('workspace')).toHaveCount(0);
  } finally {
    signInResponse.release();
    signOutResponse.release();
  }
  await done.ready;
  await expect(page.getByTestId('identity')).toHaveText('Signed out');
});

async function matchesServer(
  page: Page,
  user: User,
  offset: number,
  activeOnly = true,
) {
  let builder = user.db
    .from('vue_query_tasks')
    .select(columns, { count: 'exact' });
  if (activeOnly) builder = builder.eq('active', true);
  const server = await builder.order('rank').order('id').throwOnError();
  await expect(page.getByTestId('query-status')).toHaveText('Loaded');
  await expect(page.getByTestId('count')).toHaveText(String(server.count));
  await expect(page.getByTestId('head-count')).toHaveText(String(server.count));
  await expect(page.getByTestId('page')).toHaveText(`Page ${offset + 1}`);
  await expect
    .poll(() =>
      page
        .locator('li[data-id]')
        .evaluateAll((rows) =>
          rows.map((row) => Number(row.getAttribute('data-id'))),
        ),
    )
    .toEqual(server.data.slice(offset, offset + 1).map((row) => row.id));
}

async function screenshot(page: Page, info: TestInfo) {
  await page.getByLabel('Email', { exact: true }).fill('');
  await page.screenshot({
    path: info.outputPath('pagination-synced.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test('syncs rendered filtered pages and HEAD totals through every CRUD and empty last pages', async ({
  page,
  accounts: { a },
}, info) => {
  await login(page, a);
  await matchesServer(page, a, 0);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await matchesServer(page, a, 1);
  await clickMutation(page, 'Add task');
  await matchesServer(page, a, 1);
  await page
    .getByRole('button', { name: 'Previous page', exact: true })
    .click();
  await matchesServer(page, a, 0);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await matchesServer(page, a, 1);
  await clickMutation(page, 'Move task first');
  await matchesServer(page, a, 1);
  await clickMutation(page, 'Hide task');
  await matchesServer(page, a, 1);
  await clickMutation(page, 'Upsert task');
  await matchesServer(page, a, 1);
  await clickMutation(page, 'Upsert task');
  await matchesServer(page, a, 1);
  await screenshot(page, info);
  await clickMutation(page, 'Delete task');
  await matchesServer(page, a, 1);
  await clickMutation(page, 'Delete task');
  await matchesServer(page, a, 1);
  await expect(page.getByTestId('empty')).toBeVisible();
  await page
    .getByRole('button', { name: 'Previous page', exact: true })
    .click();
  await matchesServer(page, a, 0);
  await page.getByLabel('Select task', { exact: true }).check();
  await clickMutation(page, 'Delete selected');
  await matchesServer(page, a, 0);
  await expect(page.getByTestId('empty')).toBeVisible();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await matchesServer(page, a, 1);
  await page.getByLabel('Active only', { exact: true }).uncheck();
  await matchesServer(page, a, 0, false);
  await page.getByLabel('Select task', { exact: true }).check();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await matchesServer(page, a, 1, false);
  await page.getByLabel('Select task', { exact: true }).check();
  await clickMutation(page, 'Delete selected');
  await matchesServer(page, a, 1, false);
  await expect(page.getByTestId('empty')).toBeVisible();
});
