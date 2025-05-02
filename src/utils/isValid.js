// 是否為 undefined 的型態
function isUndefined(value){
    return value === undefined;
}

// 是否可轉換為數字格式
function isparseInt(value){
    const num = Number(value);
    return isNaN(num); 
}

// 是否不為字串的防呆
function isNotValidString(value){
    return typeof value !== "string" || value.trim().length === 0 || value === "";
}

// 是否不為數字(整數)的防呆
function isNotValidInteger(value){
    return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

// 是否為英文數字格式
function isAlphanumeric(value){
    const regex = /^[a-zA-Z0-9]+$/;
    return !regex.test(value);
}

// 是否為英文數字和中文格式
function isAlphanumericChinese(value){
    const regex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
    return !regex.test(value);
}

// 是否為 email 格式
function isValidEmail(value){
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !regex.test(value);
}

// 至少有一個英文字母 (大小寫皆可) 且至少有一個數字
function containsLetterAndNumber(str) {
    const hasLetter = /[a-zA-Z]/.test(str);
    const hasNumber = /\d/.test(str);
    return !(hasLetter && hasNumber);
}

// 文字長度是否符合範圍
function controlDigitalRange(value,min,max){
    return value.length < min || value.length > max;
}

// 是否為圖片格式
function isValidImageUrl(url){
    const regex = /^https:\/\/.*\.(png|jpg)$/i;
    return !regex.test(url);
}

// 是否為網址格式
function isInvalidURL(url){
    const regex = /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/;
    return !regex.test(url);
}

// 是否格式符合 YYYY-MM-DD HH:MM:SS 或 YYYY/MM/DD HH:MM:SS
function isValidDate(dateTimeString) {
    const regex = /^\d{4}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\s(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!regex.test(dateTimeString)) return true; //格式錯誤，回傳 true

    // 解析日期與時間
    const [datePart, timePart] = dateTimeString.split(" ");
    const [year, month, day] = datePart.split(/[-/]/).map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);

    // 檢查是否為有效日期
    const date = new Date(year, month - 1, day, hour, minute, second);

    return !(date.getFullYear() === year &&
             date.getMonth() + 1 === month &&
             date.getDate() === day &&
             date.getHours() === hour &&
             date.getMinutes() === minute &&
             date.getSeconds() === second);
}

// 日期比較是否正確
function isSDataEDataCompare(dateTime1, dateTime2) {
    return !(new Date(dateTime1.replace(" ", "T")) < new Date(dateTime2.replace(" ", "T")));
}

// 資料欄位不符的迴圈 ( String )
const validateFields_String = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (isUndefined(value) || isNotValidString(value)) {
            return `欄位 ${key} 未填寫正確` 
        }
    }
    return null
}

// 資料欄位不符的迴圈 ( Int )
const validateFields_Int = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (isUndefined(value) || isNotValidInteger(value)) {
            return `欄位 ${key} 未填寫正確` 
        }
    }
    return null
}

// 資料欄位不符的迴圈 ( Date )
const validateFields_Date = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (isUndefined(value) || isValidDate(value)) {
            return `欄位 ${key} 未填寫正確` 
        }
    }
    return null
}

// 資料欄位不符的迴圈 ( Password )
const validateFields_Password = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (controlDigitalRange(value,8,16) || containsLetterAndNumber(value)) {
            return `${key} 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個` 
        }
    }
    return null
}

module.exports = {
    isUndefined,
    isparseInt,
    isNotValidString,
    isNotValidInteger,
    isAlphanumeric,
    isAlphanumericChinese,
    isValidEmail,
    containsLetterAndNumber,
    controlDigitalRange,
    isValidImageUrl,
    isInvalidURL,
    isValidDate,
    isSDataEDataCompare,
    validateFields_String,
    validateFields_Int,
    validateFields_Date,
    validateFields_Password
}