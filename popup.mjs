import { storeData, getData, getUploadHistory, clearUploadHistory } from './storage.mjs';
import { isLogged, performCookieUpload } from './mybili.mjs';

// 格式化时间戳为 YYYY-MM-DD HH:mm:ss
const formatTime = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 显示提示信息
const showToast = (message, type = 'info') => {
    const toastBox = document.getElementById('toastBox');
    if (!toastBox) return;
    toastBox.textContent = message;
    toastBox.className = `toast show ${type}`;
};

// 更新顶部服务端登录状态徽章
const refreshServerStatus = async () => {
    const badge = document.getElementById('statusBadge');
    const textEl = document.getElementById('statusText');
    const apiHost = await getData('api_host');

    if (!apiHost) {
        badge.className = 'status-badge';
        textEl.textContent = '未配置地址';
        return;
    }

    badge.className = 'status-badge checking';
    textEl.textContent = '检测中...';

    try {
        const logged = await isLogged();
        if (logged) {
            badge.className = 'status-badge online';
            textEl.textContent = '服务端已登录';
        } else {
            badge.className = 'status-badge offline';
            textEl.textContent = '服务端未登录';
        }
    } catch (e) {
        badge.className = 'status-badge offline';
        textEl.textContent = '连接失败';
    }
};

// 渲染上传历史记录列表
const renderHistory = async () => {
    const container = document.getElementById('historyList');
    if (!container) return;

    const history = await getUploadHistory();
    container.innerHTML = '';

    if (!history || history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = '暂无上传记录';
        container.appendChild(empty);
        return;
    }

    for (const item of history) {
        const row = document.createElement('div');
        row.className = `history-item ${item.success ? 'success' : 'fail'}`;

        const top = document.createElement('div');
        top.className = 'history-top';

        const tags = document.createElement('div');
        tags.className = 'history-tags';

        const statusTag = document.createElement('span');
        statusTag.className = `tag ${item.success ? 'ok' : 'err'}`;
        statusTag.textContent = item.success ? '成功' : '失败';

        const triggerTag = document.createElement('span');
        triggerTag.className = 'tag trigger';
        triggerTag.textContent = item.trigger === 'manual' ? '手动上传' : '自动同步';

        tags.appendChild(statusTag);
        tags.appendChild(triggerTag);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-time';
        timeSpan.textContent = formatTime(item.timestamp);

        top.appendChild(tags);
        top.appendChild(timeSpan);

        const msg = document.createElement('div');
        msg.className = 'history-msg';
        msg.textContent = item.message || (item.success ? 'Cookie 上传成功' : 'Cookie 上传失败');

        row.appendChild(top);
        row.appendChild(msg);
        container.appendChild(row);
    }
};

// 校验并保存输入框中的 API URL
const saveApiHostFromInput = async () => {
    const inputEl = document.getElementById('inputAPIHost');
    let inputValue = (inputEl.value || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/i.test(inputValue)) {
        showToast('请输入以 http:// 或 https:// 开头的有效 API URL', 'error');
        return null;
    }
    inputEl.value = inputValue;
    await storeData('api_host', inputValue);
    return inputValue;
};

// 点击“保存”按钮
const onSaveHost = async () => {
    const saved = await saveApiHostFromInput();
    if (!saved) return;
    showToast('API URL 已保存', 'success');
    await refreshServerStatus();
};

// 点击“立即上传一次 Cookie”按钮（不受 5 分钟自动任务冷却限制）
const onUploadNow = async () => {
    const uploadBtn = document.getElementById('uploadNowBtn');
    const saved = await saveApiHostFromInput();
    if (!saved) return;

    uploadBtn.disabled = true;
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = '正在获取并上传 Cookie...';
    showToast('正在从浏览器读取 bilibili.com Cookie 并上传...', 'info');

    try {
        const res = await performCookieUpload('manual');
        if (res.ok) {
            showToast(res.message, 'success');
        } else {
            showToast(res.message, 'error');
        }
        await renderHistory();
        await refreshServerStatus();
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = originalText;
    }
};

// 点击“清空记录”按钮
const onClearHistory = async () => {
    await clearUploadHistory();
    await renderHistory();
    showToast('已清空上传历史记录', 'info');
};

document.addEventListener('DOMContentLoaded', async () => {
    const saveHostBtn = document.getElementById('saveHostBtn');
    const uploadNowBtn = document.getElementById('uploadNowBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const statusBadge = document.getElementById('statusBadge');
    const inputEl = document.getElementById('inputAPIHost');

    saveHostBtn.addEventListener('click', onSaveHost);
    uploadNowBtn.addEventListener('click', onUploadNow);
    clearHistoryBtn.addEventListener('click', onClearHistory);
    statusBadge.addEventListener('click', refreshServerStatus);

    const savedHost = await getData('api_host');
    if (savedHost) {
        inputEl.value = savedHost;
    }

    await renderHistory();
    await refreshServerStatus();

    // 监听 storage 变化，当后台自动任务写入新的上传记录时实时刷新列表
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.uploadHistory) {
            renderHistory();
        }
    });
});
