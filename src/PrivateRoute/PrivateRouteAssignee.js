import React from 'react'
import {Navigate} from "react-router-dom"
import {getRefreshToken} from "../utils/getRefreshToken"
import {getAccessToken} from "../utils/getAccessToken"
import Cookies from "universal-cookie/es6";

const PrivateRouteAssignee = ({children}) => {
    const cookies = new Cookies()
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()
    const role = cookies.get("role")
    return accessToken && refreshToken && role === "ROLE_ASSIGNEE" ? children : <Navigate to="/"/>
}

export default PrivateRouteAssignee
