export async function storeData(key, value) {
    return new Promise((resolve) =>{
        chrome.storage.local.set({ [key]: value }, function () {
            console.log('Data stored:', key, value);
            resolve()
        });
    })
}
export async function getData(key) {
    return new Promise((resolve)=>{
        chrome.storage.local.get([key], function (result) {
            if (result[key] !== undefined) {
                console.log('Data retrieved:', key, result[key]);
                resolve(result[key])
            } else {
                console.log('No data found for', key);
                resolve(null)
            }
        });
    })
}
