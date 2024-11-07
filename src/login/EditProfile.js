import React, {useState} from 'react'
import "./EditProfile.css"
import {Helmet} from "react-helmet";
import {refreshTokenThenFetch} from "../utils/refreshTokenThenFetch";
import {getAccessToken} from "../utils/getAccessToken";
import Cookies from "universal-cookie/es6";
import {clearCookies} from "../utils/clearCookies";

const EditProfile = () => {
    const cookies = new Cookies()
    const [newUsername, setNewUsername] = useState("")
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const username = cookies.get("username")

    const [showUsernameError, setShowUsernameError] = useState(false)
    const [showUsernameExistsError, setShowUsernameExistsError] = useState(false)
    const [showPasswordError, setShowPasswordError] = useState(false)
    const [showInvalidPasswordError, setShowInvalidPasswordError] = useState(false)
    const [showNewPasswordError, setShowNewPasswordError] = useState(false)
    const [showPasswordConfirmError, setShowPasswordConfirmError] = useState(false)

    const usernameError = <div className="profileError">Please enter username</div>
    const usernameExistsError = <div className="profileError">Username taken</div>
    const passwordError = <div className="profileError">Please enter password</div>
    const invalidPasswordError = <div className="profileError">Invalid password</div>
    const passwordConfirmError = <div className="profileError">Passwords don't match</div>

    function sendNewUsernameRequest() {
        let error = false

        if (newUsername === "") {
            setShowUsernameError(true)
            error = true
        } else {
            setShowUsernameError(false)
        }

        if (error) {
            return
        }

        const requestBody = {
            username: newUsername
        }

        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()

            fetch(`users/${username}/username`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }, method: "put", body: JSON.stringify(requestBody)
            })
                .then((response) => {
                    if (response.status === 200) {
                        return Promise.all([response.text(), response.headers])
                    } else if (response.status === 409) {
                        return Promise.reject(["Failed to update username, code: " + response.status, response.status])
                    } else {
                        return Promise.reject("Failed to update username, code: " + response.status)
                    }
                })
                .then(() => {
                    clearCookies()
                    window.location = "/"
                }).catch(([message, code]) => {
                    if(code === 409) {
                        setShowUsernameExistsError(true)
                    }
                    console.error(message)
            })

        }
    }

    function sendNewPasswordRequest() {
        let error = false
        setShowPasswordConfirmError(false)
        setShowPasswordError(false)
        setShowNewPasswordError(false)
        setShowInvalidPasswordError(false)

        if (newPassword !== confirmPassword) {
            error = true
            setShowPasswordConfirmError(true)
        }

        if (newPassword === "") {
            error = true
            setShowNewPasswordError(true)
        }

        if (oldPassword === "") {
            error = true
            setShowPasswordError(true)
        }

        if (error) {
            return
        }

        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()

            const requestBody = {
                oldPassword: oldPassword,
                newPassword: newPassword
            }

            fetch(`users/${username}/password`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }, method: "put", body: JSON.stringify(requestBody)
            })
                .then((response) => {
                    if (response.status === 200) {
                        return Promise.all([response.text(), response.headers])
                    } else if (response.status === 401) {
                        return Promise.reject(["Failed to update password, code: " + response.status, response.status])
                    }else {
                        return Promise.reject("Failed to update password, code: " + response.status)
                    }
                })
                .then(() => {
                    clearCookies()
                    window.location = "/"
                }).catch(([message, code]) => {
                    if(code === 401) {
                        setShowInvalidPasswordError(true)
                    }
                    console.error(message)
            })
        }
    }


    return (<>
        <Helmet>
            <title>Edit profile - LOVES</title>
        </Helmet>
        <div className="profileEditForm">
            <div>
                <div className="profileFormText"><label htmlFor="login">Change Username</label></div>
                {showUsernameError ? usernameError : null}
                {showUsernameExistsError ? usernameExistsError : null}
                <div className="inputWrapper">
                    <input type="email"
                           id="newUsername"
                           value={newUsername}
                           maxLength={50}
                           onChange={(e) => setNewUsername(e.target.value)}/>
                </div>
                <div className="profileButtonWrapper">
                    <button className="profileButton" id="submitUsername" type="button"
                            onClick={() => sendNewUsernameRequest()}>
                        Save
                    </button>
                </div>
            </div>

            <div>
                <div className="profileFormText">Change Password</div>

                <div className="profileInputLabelWrapper">
                    <label className="profileInputLabel" htmlFor="oldPassword">Old password </label>
                </div>
                {showPasswordError ? passwordError : null}
                {showInvalidPasswordError ? invalidPasswordError : null}
                <div className="profileInputWrapper">
                    <input type="password"
                           id="oldPassword" value={oldPassword}
                           maxLength={50}
                           onChange={(e) => setOldPassword(e.target.value)}/>
                </div>
                <div className="profileInputLabelWrapper">
                    <label className="profileInputLabel" htmlFor="newPassword">New password </label>
                </div>
                {showNewPasswordError ? passwordError : null}
                <div className="profileInputWrapper">
                    <input type="password"
                           id="newPassword" value={newPassword}
                           maxLength={50}
                           onChange={(e) => setNewPassword(e.target.value)}/>
                </div>
                <div className="profileInputLabelWrapper">
                    <label className="profileInputLabel" htmlFor="confirmPassword">Confirm password </label>
                </div>
                {showPasswordConfirmError ? passwordConfirmError : null}
                <div className="profileInputWrapper">
                    <input type="password"
                           id="confirmPassword" value={confirmPassword}
                           maxLength={50}
                           onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>
                <div className="buttonWrapper">
                    <button className="profileButton" id="submit" type="button"
                            onClick={() => sendNewPasswordRequest()}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    </>)
}

export default EditProfile
