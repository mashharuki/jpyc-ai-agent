import { z } from "zod";

export const TransferSchema = z.object({
	to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
	amount: z.number().positive("Amount must be positive"),
});

export const BalanceSchema = z.object({
	address: z
		.string()
		.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
		.optional(),
});

export const TotalSupplySchema = z.object({});

export type TransferParams = z.infer<typeof TransferSchema>;
export type BalanceParams = z.infer<typeof BalanceSchema>;
export type TotalSupplyParams = z.infer<typeof TotalSupplySchema>;
