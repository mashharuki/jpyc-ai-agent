import { type Hex } from 'viem';

export interface Friend {
  id: string;
  name: string;
  address: Hex;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  address: Hex;
  updatedAt: string;
}

export interface StorageData {
  profile: UserProfile | null;
  friends: Friend[];
}
