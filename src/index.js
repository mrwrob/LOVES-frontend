import ReactDOM from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router-dom"
import Home from "./base/Home"
import Assignments from "./assignments/Assignments"
import NoPage from "./base/NoPage"
import Layout from "./base/Layout"
import Login from "./login/Login"
import PrivateRouteScientist from "./PrivateRoute/PrivateRouteScientist"
import Projects from "./projects/Projects"
import ProjectPage from "./projects/ProjectPage"
import LabellingPanel from "./labelling/LabellingPanel"
import VideoSetEdit from "./videosets/VideoSetEdit"
import PrivateRouteAssignee from "./PrivateRoute/PrivateRouteAssignee"
import EditProfile from "./login/EditProfile";
import PrivateRouteUser from "./PrivateRoute/PrivateRouteUser";


export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<Home/>}/>
                    <Route path="assignments" element={
                        <PrivateRouteAssignee><Assignments/></PrivateRouteAssignee>
                    }/>
                    <Route path="login" element={<Login/>}/>

                    <Route path="projects" element={
                        <PrivateRouteScientist><Projects/></PrivateRouteScientist>}/>
                    <Route path="projects/:id" element={
                        <ProjectPage/>}/>
                    <Route path="assignments/:id/panel" element={<LabellingPanel/>}/>
                    <Route path="projects/:id/videosets/:id" element={<VideoSetEdit/>}/>
                    <Route path="profile" element={
                        <PrivateRouteUser><EditProfile/></PrivateRouteUser>
                    }/>
                    <Route path="*" element={<NoPage/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App/>)

