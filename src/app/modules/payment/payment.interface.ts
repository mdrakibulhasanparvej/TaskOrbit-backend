export interface IPlanDefinition {
	label: string;
	/** monthly price in USD — 0 for the free tier */
	price: number;
	/** null = unlimited */
	projects: number | null;
	/** null = unlimited */
	members: number | null;
}

export interface IPaymentQuery {
	page?: string;
	limit?: string;
	sortBy?: string;
	sortOrder?: string;
	status?: string;
	plan?: string;
}
