import {getRefreshToken} from "./getRefreshToken"
import jwtDecode from "jwt-decode"

async function refreshToken() {
    const rToken = getRefreshToken()
    const decoded = jwtDecode(rToken)
    if(decoded.exp * 1000 < Date.now()) {
        return false
    }

    const url = `${window.location.origin}/refresh`

    return await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${rToken}`
        },
        method: "get",
    })
        .then((response) => {
            if (response.status === 200) {
                return Promise.all([response.json(), response.headers])
            } else return Promise.reject("nested fetch failed")
        })
}

export {refreshToken}