export const sortSearchParams = (params: URLSearchParams) =>
  new URLSearchParams(
    Array.from(params.entries()).sort((a, b) => {
      const x = `${a[0]}${a[1]}`;
      const y = `${b[0]}${b[1]}`;
      return x > y ? 1 : -1;
    }),
  );
