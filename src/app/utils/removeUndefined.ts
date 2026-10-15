type RemoveUndefined<T> = {
	[K in keyof T]-?: Exclude<T[K], undefined>;
};

export const removeUndefined = <T extends Record<string, unknown>>(
	payload: T,
): RemoveUndefined<T> => {
	return Object.fromEntries(
		Object.entries(payload).filter(([, value]) => value !== undefined),
	) as RemoveUndefined<T>;
};
