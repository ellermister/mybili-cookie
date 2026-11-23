/**
 * 获取当前 Cookie Store ID，兼容后台 Service Worker 无活动标签页的情况
 * @returns {Promise<string | undefined>}
 */
export const getCurrentCookieStoreId = async () => {
    try {
        if (chrome.runtime.getManifest().incognito === 'split') return undefined;

        const tabs = await chrome.tabs.query({ active: true });
        const tab = tabs && tabs[0];
        if (!tab) return undefined;

        if (tab.cookieStoreId) return tab.cookieStoreId;

        const stores = await chrome.cookies.getAllCookieStores();
        return stores.find((store) => store.tabIds.includes(tab.id))?.id;
    } catch (_) {
        return undefined;
    }
};

