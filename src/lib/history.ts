import { HISTORY_LIMIT, historyItem } from "@/lib/storage";

export function pushHistory(history: string[], hex: string): string[] {
	return [hex, ...history.filter((h) => h !== hex)].slice(0, HISTORY_LIMIT);
}

export async function addToHistory(hex: string): Promise<void> {
	await historyItem.setValue(pushHistory(await historyItem.getValue(), hex));
}
