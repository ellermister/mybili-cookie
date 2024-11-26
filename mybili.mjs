import {storeData,getData} from './storage.mjs'
export const getApiHost = async()=>{
    return await getData('api_host')
}
// 检查是否登录
export const isLogged = async () => {
    const apiHost = await getApiHost()
    const rsp = await fetch(`${apiHost}/api/cookie/status`);
    const body = await rsp.json();
    if (body && body.logged === true) {
        return true;
    }
    return false;
};

// 上传cookie
export const uploadCookie = async (cookieText) => {
    const apiHost = await getApiHost()
    const formData = new FormData();
    formData.append('file', new File([cookieText], "cookie.txt"));
    const rsp = await fetch(`${apiHost}/api/cookie/upload`, {
        method: "post",
        body: formData
    });
    if (rsp.status == 200) {
        console.log('上传成功');
    } else {
        console.warn('上传失败');
    }
};