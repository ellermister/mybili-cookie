import getAllCookies from './get_all_cookies.mjs';
import { formatMap } from './cookie_format.mjs';
import {storeData,getData} from './storage.mjs'
import {isLogged, uploadCookie, getApiHost} from './mybili.mjs'


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



const timeTask = async()=>{
    const apiHost = await getApiHost()
    if(!apiHost){
        console.log('api host 未正确设置')
        return
    }
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
}

// 当扩展安装或 Chrome 启动时，确保 background 脚本处于活动状态
chrome.runtime.onInstalled.addListener(() => {
    console.log('扩展已安装或更新');
    console.log(new Date())
    timeTask();  // 立即执行一次任务
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Chrome 启动时，确保扩展处于活动状态');
    console.log(new Date())
    timeTask();  // 启动时立即执行一次任务
});

// 创建一个定时任务，每 5 分钟执行一次
chrome.alarms.create('timeTask', {
    periodInMinutes: 5  // 设定每 5 分钟执行一次
});

// 定义定时任务执行的回调函数
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timeTask') {
        timeTask()
    }
});
// console.log(new Date())
// setInterval(timeTask, 1000*60*5)
// timeTask()