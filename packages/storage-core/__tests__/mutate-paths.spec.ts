import { mutatePaths } from '../src/mutate-paths';

describe('mutatePaths', () => {
  it('should call mutate for correct keys', async () => {
    const mutateMock = jest.fn();
    await mutatePaths('bucket', ['one/two', 'two/three', 'one'], {
      cacheKeys: ['one/two/three', 'one/three/two', 'two/one', 'four'],
      decode: (k) => ({ bucketId: 'bucket', path: k }),
      mutate: mutateMock,
    });
    expect(mutateMock).toHaveBeenCalledTimes(2);
    expect(mutateMock).toHaveBeenCalledWith('one/two/three');
    expect(mutateMock).toHaveBeenCalledWith('one/three/two');
  });

  it('should call mutate for correct keys 2', async () => {
    const mutateMock = jest.fn();
    await mutatePaths('bucket', ['one/two/three'], {
      cacheKeys: ['one/two/three', 'one/three/two', 'two/one', 'one/two'],
      decode: (k) => ({ bucketId: 'bucket', path: k }),
      mutate: mutateMock,
    });
    expect(mutateMock).toHaveBeenCalledTimes(2);
    expect(mutateMock).toHaveBeenCalledWith('one/two/three');
    expect(mutateMock).toHaveBeenCalledWith('one/two');
  });

  it('should exit early if paths is empty', async () => {
    const mutateMock = jest.fn();
    await mutatePaths('bucket', [], {
      cacheKeys: ['one/two/three', 'one/three/two', 'two/one', 'four'],
      decode: (k) => ({ bucketId: 'bucket', path: k }),
      mutate: mutateMock,
    });
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });
  it('should not mutate items from another bucket', async () => {
    const mutateMock = jest.fn();
    await mutatePaths('bucket', ['one/two', 'two/three', 'one'], {
      cacheKeys: ['one/two/three', 'one/three/two', 'two/one', 'four'],
      decode: (k) => ({ bucketId: 'another-bucket', path: k }),
      mutate: mutateMock,
    });
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });
  it('should not mutate non-storage items', async () => {
    const mutateMock = jest.fn();
    await mutatePaths('bucket', ['one/two', 'two/three', 'one'], {
      cacheKeys: ['one/two/three', 'one/three/two', 'two/one', 'four'],
      decode: (k) => null,
      mutate: mutateMock,
    });
    expect(mutateMock).toHaveBeenCalledTimes(0);
  });
});
