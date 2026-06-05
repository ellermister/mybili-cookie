// https://github.com/kairi003/Get-cookies.txt-Locally
// Modified from

/**
 * Get all cookies that match the given criteria.
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {Promise<chrome.cookies.Cookie[]>}
 */
export default async function getAllCookies(details) {
    details.storeId ??= await getCurrentCookieStoreId();
    const { partitionKey, ...detailsWithoutPartitionKey } = details;
    if (partitionKey) {
      // 优先尝试带 partitionKey 的请求（Chrome ≥ 119），失败则回退
      const cookies = await Promise.resolve()
        .then(() => chrome.cookies.getAll(details))
        .catch(() => chrome.cookies.getAll(detailsWithoutPartitionKey));
      return cookies;
    }
    return await chrome.cookies.getAll(detailsWithoutPartitionKey);
  }
  
  /**
   * Get the current cookie store ID.
   * @returns {Promise<string | undefined>}
   */
  const getCurrentCookieStoreId = async () => {
    // If the extension is in split incognito mode, return undefined to choose the default store.
    if (chrome.runtime.getManifest().incognito === 'split') return undefined;
  
    // Firefox supports the `tab.cookieStoreId` property.
    const [tab] = await chrome.tabs.query({ active: true});
    if (tab.cookieStoreId) return tab.cookieStoreId;
  
    // Chrome does not support the `tab.cookieStoreId` property.
    const stores = await chrome.cookies.getAllCookieStores();
    return stores.find((store) => store.tabIds.includes(tab.id))?.id;
  };
  