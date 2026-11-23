export async function storeData(key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, function () {
            console.log('Data stored:', key, value);
            resolve();
        });
    });
}

export async function getData(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], function (result) {
            if (result[key] !== undefined) {
                console.log('Data retrieved:', key, result[key]);
                resolve(result[key]);
            } else {
                console.log('No data found for', key);
                resolve(null);
            }
        });
    });
}

// 最多保留的历史记录条数
const MAX_HISTORY_COUNT = 50;

/**
 * 获取上传历史记录列表
 * @returns {Promise<Array>}
 */
export async function getUploadHistory() {
    const list = await getData('uploadHistory');
    return Array.isArray(list) ? list : [];
}

/**
 * 添加一条上传历史记录
 * @param {Object} item
 * @param {boolean} item.success - 是否成功
 * @param {'manual'|'auto'} item.trigger - 触发方式：手动或自动
 * @param {string} item.message - 状态描述信息
 * @param {number} [item.cookieCount] - 携带的 Cookie 数量
 */
export async function addUploadHistory(item) {
    const history = await getUploadHistory();
    const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        success: Boolean(item.success),
        trigger: item.trigger || 'auto',
        message: item.message || '',
        cookieCount: typeof item.cookieCount === 'number' ? item.cookieCount : 0
    };
    const updated = [record, ...history].slice(0, MAX_HISTORY_COUNT);
    await storeData('uploadHistory', updated);
    return record;
}

/**
 * 清空上传历史记录
 */
export async function clearUploadHistory() {
    await storeData('uploadHistory', []);
}
