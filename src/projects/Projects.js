import React, {useEffect, useState} from 'react'
import './Projects.css'
import Moment from 'moment'
import {getAccessToken} from "../utils/getAccessToken"
import {refreshTokenThenFetch} from "../utils/refreshTokenThenFetch"
import {Helmet} from "react-helmet";
import {normalizeTime} from "../utils/normalizeTime";

const Projects = () => {
    const [isLoaded, setLoaded] = useState(false)
    const [error,] = useState(null)
    const [projects, setProjects] = useState([])

    const [showProjectButton, setShowProjectButton] = useState(true)
    const [showProjectForm, setShowProjectForm] = useState(false)
    const [projectFormName, setProjectFormName] = useState("")
    const [projectFormDesc, setProjectFormDesc] = useState("")

    const [showProjectFormNameError, setShowProjectNameError] = useState(false)
    const [showProjectFormDescError, setShowProjectDescError] = useState(false)
    const projectFormNameError = <div className="error">Please enter name</div>
    const projectFormDescError = <div className="error">Please enter description</div>

    const projectForm = <div className="projectForm">
        <div>
            <div className="formText"><label htmlFor="newProjectName">Name</label></div>
            {showProjectFormNameError ? projectFormNameError : null}
            <input type="text"
                   id="newProjectName"
                   value={projectFormName}
                   maxLength={50}
                   onChange={(e) => setProjectFormName(e.target.value)}/>
        </div>
        <div>
            <div className="formText"><label htmlFor="newProjectDesc">Description</label></div>
            {showProjectFormDescError ? projectFormDescError : null}
            <textarea className="descriptionBox"
                      id="newProjectDesc"
                      value={projectFormDesc}
                      maxLength={250}
                      onChange={(e) => setProjectFormDesc(e.target.value)}/>
        </div>
        <div>
            <button className="createButton" id="submit" type="button" onClick={() => {
                sendProjectRequest()
            }}>Create
            </button>
            <button className="cancelButton" type="button" onClick={() => {
                setShowProjectForm(false)
                setProjectFormName("")
                setProjectFormDesc("")
                setShowProjectButton(true)
                setShowProjectNameError(false)
                setShowProjectDescError(false)
            }
            }>Cancel
            </button>
        </div>
    </div>


    function sendProjectRequest() {

        let error = false

        if (projectFormName === "") {
            setShowProjectNameError(true)
            error = true
        }

        if (projectFormDesc === "") {
            setShowProjectDescError(true)
            error = true
        }

        if (error) {
            return
        }

        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = "projects"
            const requestBody = {
                name: projectFormName,
                description: projectFormDesc
            }

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "post",
                body: JSON.stringify(requestBody)
            }).then((response) => {
                if (response.status === 201) {
                    return Promise.all([response.text(), response.headers])
                } else {
                    return Promise.reject("Something went wrong")
                }
            })
                .then(() => {
                    window.location = "/projects"
                })
        }
    }

    useEffect(() => {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            fetch("", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get",
            })
                .then(async (response) => {
                    if (response.status === 200) return Promise.all([response.json(), response.headers])
                    else return Promise.reject("Something went wrong, code: " + response.status)
                })
                .then(([body]) => {
                    setLoaded(true)
                    setProjects(body["projectList"])
                }).catch((rejectMessage) => {
                console.error(rejectMessage)
            })
        }
    }, [])


    function sendDeleteProjectRequest(projectId) {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = `projects/${projectId}`

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "delete",
            }).then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.text(), response.headers])
                } else {
                    return Promise.reject("Something went wrong")
                }
            })
                .then(() => {
                    window.location = `/projects`
                })
        }
    }


    if (error) {
        return <div>Error</div>
    } else if (!isLoaded) {
        return <div className="loading">Loading...</div>
    } else {
        return (<>
            <Helmet>
                <title>Projects - LOVES</title>
            </Helmet>
            <div className="projectsColumn">
                <div className="columnTitle">
                    <p className="columnTitleText">Projects</p>
                </div>
                {showProjectButton ? <button className="newProjectButton"
                                             type="button" onClick={() => {
                    setShowProjectForm(true)
                    setShowProjectButton(false)
                }}>New Project
                </button> : null}
                {showProjectForm ? projectForm : null}
                <div className="scrollableProjectList">
                    {projects.map(function (object, i) {

                        let created = Moment().diff(Moment(object.creationTime), 'seconds')
                        let modified = Moment().diff(Moment(object.modificationTime), 'seconds')
                        let createdText = normalizeTime(created)
                        let modifiedText = normalizeTime(modified)

                        return <div className="projectCard" key={i}>
                            <button className="projectDeleteButton iconHoverButton" onClick={() => {
                                sendDeleteProjectRequest(object.id)
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     fill="currentColor" className="bi bi-trash icon-no-fill"
                                     viewBox="0 0 16 16">
                                    <path
                                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                    <path fillRule="evenodd"
                                          d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     fill="currentColor" className="bi bi-trash-fill icon-fill"
                                     viewBox="0 0 16 16">
                                    <path
                                        d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                                </svg>
                            </button>
                            <div className="projectLinkWrapper">
                                <button className="projectLink" onClick={() => {
                                    window.location = `projects/${object.id}`
                                }}>{object.name}</button>
                            </div>
                            <div className="projectCardInfo">
                                <div className="projectsDesc">{object.description} </div>
                                <div className="projectDetails">
                                    <div className="projectDetailsRow"> Created: <span className="smallerText">{createdText} ago</span></div>
                                    <div className="projectDetailsRow"> Modified: <span className="smallerText">{modifiedText} ago</span></div>
                                    <div className="projectDetailsRow"> Assignments: <span className="smallerText">{object["numberOfAssignments"]}</span></div>
                                    <div className="projectDetailsRow"> Video sets: <span className="smallerText">{object["numberOfVideoSets"]}</span></div>
                                    <div className="projectDetailsRowLast"> Labels: <span className="smallerText">{object["numberOfLabels"]}</span></div>
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            </div>
        </>)
    }

}

export default Projects
