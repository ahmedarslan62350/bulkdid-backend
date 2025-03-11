const date = new Date()

export const REDIS_WALLET_KEY = (email: string): string => `users:wallets:${email}`
export const REDIS_CALLERID_KEY = (email: string): string => `users:callerIds:${email}`
export const REDIS_USER_KEY = (email: string) => `users:${email}`
export const REDIS_USERS_BY_STORE_KEY = (storeId: string) => `usersByStoreId:${storeId}`
export const REDIS_USERS_STORE_KEY = (storeId: string) => `users:stores:${storeId}`
export const REDIS_USERS_TRANSACTIONS_KEY = (email: string) => `users:transactions:${email}`
export const REDIS_TRANSACTION_KEY = (id: string) => `transactions:${id}`
export const REDIS_IP_KEY = (ip: string) => `IP:${ip}`
export const REDIS_BANK_KEY = (name: string) => `banks:${name}`
export const REDIS_FETCH_DID_KEY = () => `analytics:fetchToday:${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
