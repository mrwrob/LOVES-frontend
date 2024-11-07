import {Outlet, Link} from "react-router-dom"
import './Layout.css'
import logo from "../images/loves192.png"
import Cookies from "universal-cookie/es6";
import {clearCookies} from "../utils/clearCookies";

const Layout = () => {

    function logout() {
        clearCookies()
        window.location = "/login"
    }

    const cookies = new Cookies()
    const accessToken = cookies.get("access_token")
    const username = cookies.get("username")
    const role = cookies.get("role")
    const assignmentsLink = <div className="linkWrapper"><Link className="linkButton" to="/assignments">Assignments</Link></div>
    const projectsLink = <div className="linkWrapper"><Link className="linkButton" to="/projects">Projects</Link></div>

    let hiText
    let loginButton
    let editProfileButton
    if (!accessToken) {
        loginButton = <div className="linkWrapper"><Link className="linkButton" to="/login">Login</Link></div>
        hiText = null
    } else {
        editProfileButton = <div className="linkWrapper"><Link className="linkButton" to="/profile">Edit profile</Link></div>
        loginButton = <div className="linkWrapper"><Link className="linkButton" to="/" onClick={() => logout()}>Logout</Link></div>
        hiText = <div className="hiText">Hi {username}!</div>
    }

    return (<>
        <div className="pageHeader">
            <div className="navWrapper">
                <nav className="nav">
                    {hiText}
                    {role === "ROLE_ASSIGNEE" ? assignmentsLink : null}
                    {role === "ROLE_SCIENTIST" ? projectsLink : null}
                    {editProfileButton}
                    {loginButton}
                </nav>
            </div>
            <div className="appTitle">
                <p className="appTitleText">LOVES</p>
            </div>
            <div className="logoWrapper">
                <img className="logo" src={logo} alt="logo"/>
            </div>
        </div>

        <Outlet/>
    </>)
}

export default Layout
