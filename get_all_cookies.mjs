import { getCurrentCookieStoreId } from './cookie_store_helper.mjs';

/**
 * Get all cookies that match the given criteria.
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {Promise<chrome.cookies.Cookie[]>}
 */
export default async function getAllCookies(details) {
    const queryDetails = { ...details };
    const storeId = queryDetails.storeId ?? (await getCurrentCookieStoreId());
    if (storeId) {
        queryDetails.storeId = storeId;
    } else {
        delete queryDetails.storeId;
    }

    const { partitionKey, ...detailsWithoutPartitionKey } = queryDetails;
    // 始终获取非分区 Cookie；若传入 partitionKey，同时尝试获取分区 Cookie 并合并去重
    const unpartitionedCookies = await chrome.cookies.getAll(detailsWithoutPartitionKey);
    if (!partitionKey) {
        return unpartitionedCookies;
    }

    const partitionedCookies = await Promise.resolve()
        .then(() => chrome.cookies.getAll(queryDetails))
        .catch(() => []);

    const cookieMap = new Map();
    for (const c of [...unpartitionedCookies, ...partitionedCookies]) {
        const key = `${c.domain}|${c.path}|${c.name}|${c.storeId || ''}`;
        if (!cookieMap.has(key)) {
            cookieMap.set(key, c);
        }
    }
    return Array.from(cookieMap.values());
}
