import Cookies from "universal-cookie/es6";

function clearCookies() {
    const cookies = new Cookies()
    cookies.remove("access_token", { path: '/' })
    cookies.remove("refresh_token", { path: '/' })
    cookies.remove("role", { path: '/' })
    cookies.remove("username", { path: '/' })
}

export {clearCookies}