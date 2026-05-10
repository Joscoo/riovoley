export const readJsonBody = async <T>(req: Request): Promise<T> => {
  return await req.json().catch(() => ({} as T));
};
