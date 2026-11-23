import getAllCookies from './get_all_cookies.mjs';
import { formatMap } from './cookie_format.mjs';
import { storeData, getData, addUploadHistory } from './storage.mjs';

export const getApiHost = async () => {
    return await getData('api_host');
};

// 检查 mybili 服务端登录状态
export const isLogged = async () => {
    const apiHost = await getApiHost();
    if (!apiHost) {
        throw new Error('未配置 API URL');
    }
    const rsp = await fetch(`${apiHost}/api/cookie/status`);
    if (!rsp.ok) {
        throw new Error(`状态检查失败 (HTTP ${rsp.status})`);
    }
    const body = await rsp.json();
    return Boolean(body && body.logged === true);
};

// 上传 Cookie 到 mybili 服务端
export const uploadCookie = async (cookieText) => {
    const apiHost = await getApiHost();
    if (!apiHost) {
        throw new Error('未配置 API URL');
    }
    const formData = new FormData();
    formData.append('file', new File([cookieText], 'cookie.txt'));
    const rsp = await fetch(`${apiHost}/api/cookie/upload`, {
        method: 'POST',
        body: formData
    });
    if (rsp.status === 200) {
        console.log('上传成功');
        return { ok: true, status: rsp.status, message: 'Cookie 上传成功' };
    } else {
        let errDetail = `HTTP ${rsp.status}`;
        try {
            const text = await rsp.text();
            if (text) {
                errDetail += `: ${text.slice(0, 80)}`;
            }
        } catch (_) {
            // 忽略读取响应体异常
        }
        console.warn('上传失败:', errDetail);
        return { ok: false, status: rsp.status, message: `上传失败 (${errDetail})` };
    }
};

/**
 * 执行一次完整的 Bilibili Cookie 获取与上传并写入历史记录
 * @param {'manual'|'auto'} trigger - 触发来源
 * @returns {Promise<{ok: boolean, message: string, cookieCount: number}>}
 */
export const performCookieUpload = async (trigger = 'manual') => {
    let cookieCount = 0;
    try {
        const apiHost = await getApiHost();
        if (!apiHost) {
            const msg = '请先配置并保存有效的 API URL';
            return { ok: false, message: msg, cookieCount: 0 };
        }

        const allCookie = await getAllCookies({
            url: 'https://www.bilibili.com',
            partitionKey: { topLevelSite: 'https://www.bilibili.com' }
        });
        cookieCount = Array.isArray(allCookie) ? allCookie.length : 0;

        if (cookieCount === 0) {
            const msg = '未获取到 bilibili.com 的 Cookie，请先在浏览器登录 B 站';
            await addUploadHistory({
                success: false,
                trigger,
                message: msg,
                cookieCount: 0
            });
            return { ok: false, message: msg, cookieCount: 0 };
        }

        const hasSessData = allCookie.some((c) => c.name === 'SESSDATA' && c.value);
        const cookieText = formatMap.netscape.serializer(allCookie);
        const res = await uploadCookie(cookieText);

        // 更新最近一次请求时间
        await storeData('lastRequestTime', Date.now());

        const suffix = hasSessData ? `共 ${cookieCount} 项 (含 SESSDATA)` : `共 ${cookieCount} 项 (未检测到 SESSDATA)`;
        const finalMsg = res.ok ? `上传成功，${suffix}` : res.message;

        await addUploadHistory({
            success: res.ok,
            trigger,
            message: finalMsg,
            cookieCount
        });

        return {
            ok: res.ok,
            message: finalMsg,
            cookieCount
        };
    } catch (e) {
        const errMsg = `请求异常: ${e?.message || String(e)}`;
        await addUploadHistory({
            success: false,
            trigger,
            message: errMsg,
            cookieCount
        });
        return {
            ok: false,
            message: errMsg,
            cookieCount
        };
    }
};
