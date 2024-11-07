import React from 'react'
import {Navigate} from "react-router-dom"
import {getAccessToken} from "../utils/getAccessToken"
import {getRefreshToken} from "../utils/getRefreshToken"
import Cookies from "universal-cookie/es6";

const PrivateRouteScientist = ({children}) => {
    const cookies = new Cookies()
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()
    const role = cookies.get("role")
    return accessToken && refreshToken && role === "ROLE_SCIENTIST" ? children : <Navigate to="/"/>
}

export default PrivateRouteScientist
