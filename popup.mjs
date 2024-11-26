import getAllCookies from './get_all_cookies.mjs';
import { formatMap } from './cookie_format.mjs';
import {storeData,getData} from './storage.mjs'
import {isLogged, uploadCookie} from './mybili.mjs'

// 获取上次请求时间
const getLastRequestTime = async() => {
    const lastTime = await getData('lastRequestTime');
    return lastTime ? parseInt(lastTime, 10) : null;
};

// 设置当前请求时间
const setLastRequestTime = async() => {
    await storeData('lastRequestTime', Date.now());
};

// 检查是否超过频率限制（5分钟）
const isTimeIntervalValid = async() => {
    const lastRequestTime = await getLastRequestTime();
    if (!lastRequestTime) {
        return true;  // 如果没有记录时间，默认允许执行
    }
    const timeDiff = Date.now() - lastRequestTime;
    return timeDiff >= 5 * 60 * 1000; // 5分钟 = 300,000 毫秒
};

const onSave = async () => {
    let inputValue = document.getElementById('inputAPIHost').value
    inputValue = inputValue.replace(/\/$/,'')
    if(!inputValue.match(/^https?\:\/\//)){
        return
    }
    storeData('api_host', inputValue)
    if (!await isTimeIntervalValid()) {
        console.log('请求过于频繁，请稍等...');
        return;
    }

    // 更新请求时间
    await setLastRequestTime();

    if (await isLogged() == false) {
        console.log('未登录, 去获取cookie');
        const allCookie = await getAllCookies({ url: 'https://www.bilibili.com', partitionKey: { topLevelSite: 'https://www.bilibili.com' } });
        const cookieText = formatMap.netscape.serializer(allCookie);
        // 上传cookie
        uploadCookie(cookieText);
    } else {
        console.log('已经登录');
    }
};

// 确保 DOM 加载完毕后再添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('getCookiesButton');
    button.addEventListener('click', onSave);

    getData('api_host').then(resultKey => {
        document.getElementById('inputAPIHost').value = resultKey
    })
});
