export const ok = (data) => ({ ok: true, data });

export const fail = (error) => ({ ok: false, error });

export const isOk = (result) => Boolean(result?.ok);
