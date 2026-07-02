import { RedisStore, Value } from '../../src/stores';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Cluster, Redis } from 'ioredis';
import {
  GenericContainer,
  Network,
  StartedNetwork,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

const REDIS_IMAGE = 'redis:7-alpine';
const REDIS_PORT = 6379;

const createCacheValue = (value: string): Value<string> => ({
  data: value,
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK',
});

const createEntry = (value: string) => ({
  value: createCacheValue(value),
  freshUntil: Date.now() + 1000000,
  staleUntil: Date.now() + 100000000,
});

type StartedRedisCluster = {
  cluster: Cluster;
  containers: StartedTestContainer[];
  network: StartedNetwork;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const startRedisCluster = async (): Promise<StartedRedisCluster> => {
  const network = await new Network().start();
  const containers = await Promise.all(
    Array.from({ length: 3 }, (_, index) =>
      new GenericContainer(REDIS_IMAGE)
        .withNetwork(network)
        .withNetworkAliases(`redis-node-${index}`)
        .withExposedPorts(REDIS_PORT)
        .withCommand([
          'redis-server',
          '--port',
          `${REDIS_PORT}`,
          '--cluster-enabled',
          'yes',
          '--cluster-config-file',
          `nodes-${index}.conf`,
          '--cluster-node-timeout',
          '5000',
          '--appendonly',
          'no',
          '--protected-mode',
          'no',
        ])
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(60000)
        .start(),
    ),
  );

  const createResult = await containers[0].exec([
    'redis-cli',
    '--cluster',
    'create',
    ...containers.map((_, index) => `redis-node-${index}:${REDIS_PORT}`),
    '--cluster-replicas',
    '0',
    '--cluster-yes',
  ]);

  if (createResult.exitCode !== 0) {
    throw new Error(createResult.output);
  }

  const host = containers[0].getHost();
  const natMap = Object.fromEntries(
    containers.flatMap((container, index) => {
      const mappedNode = {
        host: container.getHost(),
        port: container.getMappedPort(REDIS_PORT),
      };

      return [
        [
          `${container.getIpAddress(network.getName())}:${REDIS_PORT}`,
          mappedNode,
        ],
        [`redis-node-${index}:${REDIS_PORT}`, mappedNode],
      ];
    }),
  );

  const cluster = new Cluster(
    [{ host, port: containers[0].getMappedPort(REDIS_PORT) }],
    {
      natMap,
      slotsRefreshTimeout: 2000,
      redisOptions: {
        maxRetriesPerRequest: 1,
      },
    },
  );

  await waitForCluster(cluster);

  return { cluster, containers, network };
};

const waitForCluster = async (cluster: Cluster): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await cluster.set('cluster-health-check', 'ok');
      await cluster.del('cluster-health-check');
      return;
    } catch (error) {
      if (attempt === 19) throw error;
      await sleep(250);
    }
  }
};

const stopRedisCluster = async ({
  cluster,
  containers,
  network,
}: StartedRedisCluster): Promise<void> => {
  await cluster.quit();
  await Promise.all(containers.map((container) => container.stop()));
  await network.stop();
};

const flushRedisCluster = async (cluster: Cluster): Promise<void> => {
  await Promise.all(cluster.nodes('master').map((node) => node.flushall()));
};

const scanClient = async (
  client: Redis,
  pattern: string,
): Promise<string[]> => {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await client.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100,
    );
    keys.push(...batch);
    cursor = nextCursor;
  } while (cursor !== '0');

  return keys;
};

const scanCluster = async (
  cluster: Cluster,
  pattern: string,
): Promise<string[]> => {
  const batches = await Promise.all(
    cluster.nodes('master').map((node) => scanClient(node, pattern)),
  );

  return batches.flat();
};

describe('RedisStore', () => {
  const postsNamespace = 'public$posts';
  const commentsNamespace = 'public$comments';
  let container: StartedRedisContainer;
  let redis: Redis;
  let redisStore: RedisStore;

  beforeAll(async () => {
    container = await new RedisContainer(REDIS_IMAGE).start();
    redis = new Redis(container.getConnectionUrl());
  }, 60000);

  afterAll(async () => {
    await redis.quit();
    await container.stop();
  });

  beforeEach(async () => {
    redisStore = new RedisStore({ redis, prefix: 'test' });
    await redis.flushall();
  });

  test('should store value in the cache', async () => {
    const key = 'key';
    const entry = createEntry('name');
    await redisStore.set(postsNamespace, key, entry);
    expect(await redisStore.get(postsNamespace, key)).toEqual(entry);
  });

  test('should return undefined if key does not exist in cache', async () => {
    expect(await redisStore.get(postsNamespace, 'doesnotexist')).toEqual(
      undefined,
    );
  });

  test('should remove value from cache', async () => {
    const entry = createEntry('name');
    await redisStore.set(postsNamespace, 'key', entry);
    await redisStore.remove(postsNamespace, 'key');
    expect(await redisStore.get(postsNamespace, 'key')).toEqual(undefined);
  });

  test('should remove keys by prefix', async () => {
    const entry = createEntry('name');
    await redisStore.set(postsNamespace, 'public$posts$select=*', entry);
    await redisStore.set(postsNamespace, 'public$posts$user_id=eq.5', entry);
    await redisStore.set(commentsNamespace, 'public$comments$select=*', entry);

    await redisStore.removeByPrefix(postsNamespace, 'public$posts');

    expect(
      await redisStore.get(postsNamespace, 'public$posts$select=*'),
    ).toBeUndefined();
    expect(
      await redisStore.get(postsNamespace, 'public$posts$user_id=eq.5'),
    ).toBeUndefined();
    expect(
      await redisStore.get(commentsNamespace, 'public$comments$select=*'),
    ).toBeDefined();
  });

  test('should remove keys by glob pattern', async () => {
    const entry = createEntry('name');
    await redisStore.set(
      postsNamespace,
      'public$posts$select=*&user_id=eq.5',
      entry,
    );
    await redisStore.set(
      postsNamespace,
      'public$posts$select=*&user_id=eq.10',
      entry,
    );
    await redisStore.set(
      postsNamespace,
      'public$posts$select=*&status=eq.active',
      entry,
    );

    // Pattern: match keys containing user_id=eq.5
    await redisStore.removeByPattern(
      postsNamespace,
      'public$posts$*user_id=eq.5*',
    );

    expect(
      await redisStore.get(
        postsNamespace,
        'public$posts$select=*&user_id=eq.5',
      ),
    ).toBeUndefined();
    expect(
      await redisStore.get(
        postsNamespace,
        'public$posts$select=*&user_id=eq.10',
      ),
    ).toBeDefined();
    expect(
      await redisStore.get(
        postsNamespace,
        'public$posts$select=*&status=eq.active',
      ),
    ).toBeDefined();
  });
});

describe('RedisStore with Redis Cluster', () => {
  const postsNamespace = 'public$posts';
  const commentsNamespace = 'public$comments';
  let redisCluster: StartedRedisCluster;
  let cluster: Cluster;
  let redisStore: RedisStore;

  beforeAll(async () => {
    redisCluster = await startRedisCluster();
    cluster = redisCluster.cluster;
  }, 120000);

  afterAll(async () => {
    await stopRedisCluster(redisCluster);
  });

  beforeEach(async () => {
    redisStore = new RedisStore({ redis: cluster, prefix: 'test' });
    await flushRedisCluster(cluster);
  });

  test('should accept a Cluster client', () => {
    expect(new RedisStore({ redis: cluster, prefix: 'test' }).name).toBe(
      'redis',
    );
  });

  test('should store cluster cache keys with namespace hash tags', async () => {
    const entry = createEntry('name');

    await redisStore.set(postsNamespace, 'public$posts$select=*', entry);

    expect(
      await scanCluster(cluster, 'test::{public$posts}::public$posts$select=*'),
    ).toEqual(['test::{public$posts}::public$posts$select=*']);
    expect(
      await redisStore.get(postsNamespace, 'public$posts$select=*'),
    ).toEqual(entry);
  });

  test('should remove multiple values in a namespace', async () => {
    const entry = createEntry('name');
    await redisStore.set(postsNamespace, 'public$posts$select=*', entry);
    await redisStore.set(postsNamespace, 'public$posts$user_id=eq.5', entry);

    await expect(
      redisStore.remove(postsNamespace, [
        'public$posts$select=*',
        'public$posts$user_id=eq.5',
      ]),
    ).resolves.toBeUndefined();

    expect(
      await redisStore.get(postsNamespace, 'public$posts$select=*'),
    ).toBeUndefined();
    expect(
      await redisStore.get(postsNamespace, 'public$posts$user_id=eq.5'),
    ).toBeUndefined();
  });

  test('should remove keys by prefix in a cluster', async () => {
    const entry = createEntry('name');
    await redisStore.set(postsNamespace, 'public$posts$select=*', entry);
    await redisStore.set(postsNamespace, 'public$posts$user_id=eq.5', entry);
    await redisStore.set(commentsNamespace, 'public$comments$select=*', entry);

    await redisStore.removeByPrefix(postsNamespace, 'public$posts');

    expect(
      await redisStore.get(postsNamespace, 'public$posts$select=*'),
    ).toBeUndefined();
    expect(
      await redisStore.get(postsNamespace, 'public$posts$user_id=eq.5'),
    ).toBeUndefined();
    expect(
      await redisStore.get(commentsNamespace, 'public$comments$select=*'),
    ).toBeDefined();
  });

  test('should remove keys by pattern in a cluster', async () => {
    const entry = createEntry('name');
    await redisStore.set(
      postsNamespace,
      'public$posts$select=*&user_id=eq.5',
      entry,
    );
    await redisStore.set(
      postsNamespace,
      'public$posts$select=*&user_id=eq.10',
      entry,
    );
    await redisStore.set(
      postsNamespace,
      'public$posts$select=*&status=eq.active',
      entry,
    );

    await redisStore.removeByPattern(
      postsNamespace,
      'public$posts$*user_id=eq.5*',
    );

    expect(
      await redisStore.get(
        postsNamespace,
        'public$posts$select=*&user_id=eq.5',
      ),
    ).toBeUndefined();
    expect(
      await redisStore.get(
        postsNamespace,
        'public$posts$select=*&user_id=eq.10',
      ),
    ).toBeDefined();
    expect(
      await redisStore.get(
        postsNamespace,
        'public$posts$select=*&status=eq.active',
      ),
    ).toBeDefined();
  });
});
