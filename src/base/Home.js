import {getAccessToken} from "../utils/getAccessToken"
import {getRefreshToken} from "../utils/getRefreshToken"
import {Navigate} from "react-router-dom"
import React from "react"
import Cookies from "universal-cookie/es6";

const Home = () => {
    const cookies = new Cookies()
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()
    const role = cookies.get("role")
    if (accessToken && refreshToken && role) {
        if (role === "ROLE_ASSIGNEE") {
            return <Navigate to={"/assignments"}/>
        } else if (role === "ROLE_SCIENTIST") {
            return <Navigate to={"/projects"}/>
        } else {
            return <Navigate to={"/login"}/>
        }
    } else {
        return <Navigate to={"/login"}/>
    }
}

export default Home
