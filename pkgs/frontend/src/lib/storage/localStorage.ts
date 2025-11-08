import type { Friend, UserProfile, StorageData } from "./types";
import { type Hex } from "viem";

export type { Friend, UserProfile } from "./types";

const STORAGE_KEY = "jpyc-ai-agent-data";

function getStorageData(): StorageData {
	if (typeof window === "undefined") {
		return { profile: null, friends: [] };
	}

	const data = localStorage.getItem(STORAGE_KEY);
	if (!data) {
		return { profile: null, friends: [] };
	}

	try {
		return JSON.parse(data);
	} catch {
		return { profile: null, friends: [] };
	}
}

function setStorageData(data: StorageData): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Profile管理
export function getProfile(): UserProfile | null {
	return getStorageData().profile;
}

export function setProfile(name: string, address: Hex): UserProfile {
	const data = getStorageData();
	const profile: UserProfile = {
		name,
		address,
		updatedAt: new Date().toISOString(),
	};
	data.profile = profile;
	setStorageData(data);
	return profile;
}

export function deleteProfile(): void {
	const data = getStorageData();
	data.profile = null;
	setStorageData(data);
}

// Friends管理
export function getFriends(): Friend[] {
	return getStorageData().friends;
}

export function getFriendByName(name: string): Friend | undefined {
	const friends = getFriends();
	return friends.find((f) => f.name.toLowerCase() === name.toLowerCase());
}

export function getFriendById(id: string): Friend | undefined {
	const friends = getFriends();
	return friends.find((f) => f.id === id);
}

export function addFriend(name: string, address: Hex): Friend {
	const data = getStorageData();

	// 同じ名前が既に存在するかチェック
	const existingFriend = data.friends.find(
		(f) => f.name.toLowerCase() === name.toLowerCase(),
	);
	if (existingFriend) {
		throw new Error(`友達リストに「${name}」は既に登録されています`);
	}

	const friend: Friend = {
		id: crypto.randomUUID(),
		name,
		address,
		createdAt: new Date().toISOString(),
	};

	data.friends.push(friend);
	setStorageData(data);
	return friend;
}

export function updateFriend(id: string, name: string, address: Hex): Friend {
	const data = getStorageData();
	const index = data.friends.findIndex((f) => f.id === id);

	if (index === -1) {
		throw new Error("友達が見つかりません");
	}

	// 他の友達と名前が重複しないかチェック
	const duplicateFriend = data.friends.find(
		(f, i) => i !== index && f.name.toLowerCase() === name.toLowerCase(),
	);
	if (duplicateFriend) {
		throw new Error(`友達リストに「${name}」は既に登録されています`);
	}

	const friend: Friend = {
		...data.friends[index],
		name,
		address,
	};

	data.friends[index] = friend;
	setStorageData(data);
	return friend;
}

export function deleteFriend(id: string): void {
	const data = getStorageData();
	data.friends = data.friends.filter((f) => f.id !== id);
	setStorageData(data);
}
