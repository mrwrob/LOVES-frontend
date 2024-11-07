import React, {useState} from 'react'
import './Login.css'
import {Helmet} from "react-helmet";
import Cookies from "universal-cookie/es6";

const Login = () => {
    const cookies = new Cookies()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const [showUsernameError, setShowUsernameError] = useState(false)
    const [showPasswordError, setShowPasswordError] = useState(false)
    const [showLoginError, setShowLoginError] = useState(false)

    const usernameError = <div className="loginError">Please enter username</div>
    const passwordError = <div className="loginError">Please enter password</div>
    const loginError = <div className="loginError">Invalid credentials</div>

    function sendLoginRequest() {
        let error = false

        if(username === "") {
            setShowLoginError(false)
            setShowUsernameError(true)
            error = true
        } else {
            setShowUsernameError(false)
        }


        if(password === "") {
            setShowLoginError(false)
            setShowPasswordError(true)
            error = true
        } else {
            setShowPasswordError(false)
        }

        if(error) {
            return
        }

        const requestBody = {
            username: username, password: password
        }

        fetch("login", {
            headers: {
                "Content-Type": "application/json",
            }, method: "post", body: JSON.stringify(requestBody)
        })
            .then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.json(), response.headers])
                } else {
                    return Promise.reject(["Failed to log in, code: " + response.status, response.status])
                }
            })
            .then(([body]) => {
                cookies.set("access_token", body.access_token, { path: '/' })
                cookies.set("refresh_token", body.refresh_token, { path: '/' })
                cookies.set("role", body.role, { path: '/' })
                cookies.set("username", username, { path: '/' })
                window.location = "/"
            }).catch(([message, code]) => {
                if(code === 401)
                    setShowLoginError(true)
                else
                    console.error(message)
        })


    }

    return (<>
        <Helmet>
            <title>Login - LOVES</title>
        </Helmet>
        <div className="loginForm">
            <form onSubmit={(e) => {
                e.preventDefault()
                sendLoginRequest()
            }}>
                <div className="loginFormText"><label htmlFor="login">Username</label></div>
                {showUsernameError ? usernameError : null}
                <div className="inputWrapper">
                    <input type="text"
                           id="loginUsername"
                           value={username}
                           maxLength={50}
                           onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div className="loginFormText"><label htmlFor="password">Password</label></div>
                {showPasswordError ? passwordError : null}
                <div className="inputWrapper">
                    <input type="password"
                           maxLength={50}
                           id="loginPassword" value={password}
                           onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className="buttonWrapper">
                    <button className="loginButton" id="submit" type="submit" >
                        Login
                    </button>
                </div>
                {showLoginError ? loginError : null}</form>
        </div>
    </>)
}

export default Login
