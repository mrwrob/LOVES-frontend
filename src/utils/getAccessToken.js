import Cookies from "universal-cookie/es6";

function getAccessToken() {
    const cookies = new Cookies()
    const token = cookies.get("access_token")
    return token !== undefined ? token : null
}

export {getAccessToken}