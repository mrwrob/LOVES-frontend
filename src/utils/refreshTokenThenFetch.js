import jwtDecode from "jwt-decode"
import {getAccessToken} from "./getAccessToken"
import {refreshToken} from "./refreshToken"
import Cookies from "universal-cookie/es6";
import {clearCookies} from "./clearCookies";

function refreshTokenThenFetch(func) {
    const cookies = new Cookies()
    const decoded = jwtDecode(getAccessToken())
    if(decoded.exp * 1000 < Date.now()) {
        refreshToken().then(([tokens]) => {
            cookies.set("access_token", JSON.stringify(tokens["access_token"]), { path: '/' })
            cookies.set("refresh_token", JSON.stringify(tokens["refresh_token"]), { path: '/' })
            func()
        }).catch(() => {
            clearCookies()
            window.location = `${window.location.origin}/login`
        })
    }
    else {
        func()
    }
}

export {refreshTokenThenFetch}