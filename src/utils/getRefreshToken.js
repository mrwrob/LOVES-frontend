import Cookies from "universal-cookie/es6";

function getRefreshToken() {
    const cookies = new Cookies()
    const token = cookies.get("refresh_token")
    return token !== undefined ? token : null
}

export {getRefreshToken}