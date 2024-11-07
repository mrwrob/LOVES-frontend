import React, {useCallback, useEffect, useState} from 'react'
import {getAccessToken} from "../utils/getAccessToken"
import Moment from "moment"
import {exportEvents} from "../utils/exportEvents"
import './ProjectPage.css'
import {normalizeTime} from "../utils/normalizeTime"
import Select from "react-select"
import {refreshTokenThenFetch} from "../utils/refreshTokenThenFetch"
import {Helmet} from "react-helmet";

const ProjectPage = () => {
    const [isLoaded, setLoaded] = useState(false)
    const [error,] = useState(null)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [id, setId] = useState()
    const [assignments, setAssignments] = useState([])
    const [videoSets, setVideoSets] = useState([])
    const [labels, setLabels] = useState([])
    const [maxVideoCounts, setMaxVideoCounts] = useState([])

    const [showAssignmentButton, setShowAssignmentButton] = useState(true)
    const [showAssignmentForm, setShowAssignmentForm] = useState(false)
    const [assignmentFormName, setAssignmentFormName] = useState("")
    const [assignmentFormDesc, setAssignmentFormDesc] = useState("")
    const [assignmentFormAssignee, setAssignmentFormAssignee] = useState("")
    const [assignmentFormVideoSet, setAssignmentFormVideoSet] = useState("")
    const [showAssignmentNameError, setShowAssignmentNameError] = useState(false)
    const assignmentNameError = <div className="error">Please enter name</div>
    const [showAssignmentDescriptionError, setShowAssignmentDescriptionError] = useState(false)
    const assignmentDescriptionError = <div className="error">Please enter description</div>
    const [showAssignmentAssigneeError, setShowAssignmentAssigneeError] = useState(false)
    const assignmentAssigneeError = <div className="error">Please choose assignees</div>
    const [showAssignmentVideoSetError, setShowAssignmentVideoSetError] = useState(false)
    const assignmentVideoSetError = <div className="error">Please choose video sets</div>

    const [showVideoSetButton, setShowVideoSetButton] = useState(true)
    const [showVideoSetForm, setShowVideoSetForm] = useState(false)
    const [videoSetFormName, setVideoSetFormName] = useState("")
    const [videoSetFormCount, setVideoSetFormCount] = useState(1)
    const [showVideoSetNameError, setShowVideoSetNameError] = useState(false)
    const videoSetNameError = <div className="error">Please enter name</div>

    const [showLabelButton, setShowLabelButton] = useState(true)
    const [showLabelForm, setShowLabelForm] = useState(false)
    const [labelFormName, setLabelFormName] = useState("")
    const [labelFormColor, setLabelFormColor] = useState("#ff0000")
    const [labelFormType, setLabelFormType] = useState("point")
    const [labelFormShortcut, setLabelFormShortcut] = useState("")
    const [showLabelNameError, setShowLabelNameError] = useState(false)
    const labelNameError = <div className="error">Please enter name</div>
    const [showLabelShortcutError, setShowLabelShortcutError] = useState(false)
    const labelShortcutError = <div className="error">Please enter shortcut</div>

    const [showProjectEditForm, setShowProjectEditForm] = useState(false)
    const [showProjectFormError, setShowProjectFormError] = useState(false)
    const projectFormNameError = <div className="error">No changes made</div>
    const [projectFormName, setProjectFormName] = useState("")
    const [projectFormDesc, setProjectFormDesc] = useState("")
    const [showProjectButton, setShowProjectButton] = useState(true)


    const [assignees, setAssignees] = useState([])
    const [chosenAssignees, setChosenAssignees] = useState([])
    const [chosenVideoSets, setChosenVideoSets] = useState([])
    const [assigneeSearch, setAssigneeSearch] = useState("")
    const [videoSetSearch, setVideoSetSearch] = useState("")

    const [filterName, setFilerName] = useState("")
    const [filterFinished, setFilerFinished] = useState("false")

    const projectEditForm = <div className="projectEditForm">
        <div>
            <div className="formText"><label htmlFor="newProjectName">Name</label></div>
            {showProjectFormError ? projectFormNameError : null}
            <input type="text"
                   id="newProjectName"
                   maxLength={50}
                   value={projectFormName}
                   onChange={(e) => setProjectFormName(e.target.value)}/>
        </div>
        <div>
            <div className="formText"><label htmlFor="newProjectDesc">Description</label></div>
            <textarea className="descriptionBox"
                      id="newProjectDesc"
                      maxLength={250}
                      value={projectFormDesc}
                      onChange={(e) => setProjectFormDesc(e.target.value)}/>
        </div>
        <div>
            <button className="createButton" id="submit" type="button" onClick={() => {
                sendProjectEditRequest()
            }}>Update
            </button>
            <button className="cancelButton" type="button" onClick={() => {
                setShowProjectEditForm(false)
                setProjectFormName("")
                setProjectFormDesc("")
                setShowProjectButton(true)
                setShowProjectFormError(false)
            }
            }>Cancel
            </button>
        </div>
    </div>

    function sendProjectEditRequest() {
        let error = false

        if (projectFormName === "" && projectFormDesc === "") {
            setShowProjectFormError(true)
            error = true
        }

        if (error) {
            return
        }

        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const requestBody = {
                name: projectFormName === "" ? name : projectFormName,
                description: projectFormDesc === "" ? description : projectFormDesc
            }

            fetch("", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "put",
                body: JSON.stringify(requestBody)
            }).then((response) => {
                if (response.status === 200) return Promise.all([response.text(), response.headers])
                else return Promise.reject("Creating project failed, code: " + response.status)
            }).then(() => {
                window.location = `/projects/${id}`
            }).catch((e) => {
                console.error(e)
            })
        }
    }

    const updateAssignees = useCallback(function getAssigneesRequest() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            let url
            if(assigneeSearch === "") {
                url = `${window.location.origin}/assignees/`
            } else {
                url = `${window.location.origin}/assignees/search/${assigneeSearch}`
            }


            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get",
            }).then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.json(), response.headers])
                } else {
                    return Promise.reject("Creating project failed, code: " + response.status)
                }
            }).then(([body]) => {
                setAssignees(body.assigneeList)
            }).catch((e) => {
                console.error(e)
            })
        }
    },[assigneeSearch])

    function chooseAssignee(login) {
        if (!chosenAssignees.includes(login) && login !== "") {
            setChosenAssignees(oldArray => [...oldArray, login])
        }
    }

    function chooseVideoSet(videoSet) {
        if (!chosenVideoSets.find(vs => vs.id === videoSet.id) && videoSet !== undefined) {
            setChosenVideoSets(oldArray => [...oldArray, videoSet])
        }
    }

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            updateAssignees()
        },500)
        return () => clearTimeout(timeOutId)
    },[assigneeSearch, updateAssignees])

    const assignmentForm = <div className="assignmentForm">
        <div>
            <div className="formText"><label htmlFor="newAssignmentName">Name</label></div>
            {showAssignmentNameError ? assignmentNameError : null}
            <input type="text" spellCheck={false}
                   id="newAssignmentName"
                   maxLength={50}
                   value={assignmentFormName}
                   onChange={(e) => setAssignmentFormName(e.target.value)}/>
        </div>
        <div>
            <div className="formText"><label htmlFor="newAssignmentDesc">Description</label></div>
            {showAssignmentDescriptionError ? assignmentDescriptionError : null}
            <textarea className="descriptionBox" spellCheck={false}
                      id="newAssignmentDesc"
                      maxLength={250}
                      value={assignmentFormDesc}
                      onChange={(e) => setAssignmentFormDesc(e.target.value)}/>
        </div>
        <div>
            <div className="formText"><label htmlFor="newAssignmentAssignee">Assignee(s)</label></div>
            {showAssignmentAssigneeError ? assignmentAssigneeError : null}
            <div className="chosenAssignees">{chosenAssignees.map((object, i) => {
                if (i !== chosenAssignees.length - 1) {
                    return object + ", "
                }
                return object
            })}</div>
            <Select className="assigneeList formText"
                    // isDisabled={chosenAssignees.length === assignees.length}
                    inputValue={assigneeSearch}
                    onChange={(e) => {
                        setAssignmentFormAssignee(e.value)
                    }}
                    onInputChange={(e) => {
                        if(e.length <= 50)
                            setAssigneeSearch(e)
                    }}
                    options={assignees.filter(ass => !chosenAssignees.includes(ass.login)).map((object) => {
                        return {value: object.login, label: object.login}
                    })}/>
            <button className="addAssigneeButton" onClick={() => chooseAssignee(assignmentFormAssignee)}>Add</button>
        </div>
        <div>
            <div className="formText"><label htmlFor="videoSetSelect">Video Set(s)</label></div>
            {showAssignmentVideoSetError ? assignmentVideoSetError : null}
            <div className="chosenVideoSets">{chosenVideoSets.map((object, i) => {
                if (i !== chosenVideoSets.length - 1) {
                    return object.name + ", "
                }
                return object.name
            })}</div>
            <Select className="videoSetList formText"
                    inputValue={videoSetSearch}
                    onInputChange={(e) => {
                        setVideoSetSearch(e)
                    }}
                    isDisabled={chosenVideoSets.length === videoSets.length}
                    onChange={(e) => {
                        setAssignmentFormVideoSet(videoSets.find(vs => vs.id === e.value))
                    }}
                    options={videoSets.filter(vs => !chosenVideoSets.includes(vs)).map((object) => {
                        return {value: object.id, label: object.name}
                    })}/>
            <button className="addAssigneeButton" onClick={() => chooseVideoSet(assignmentFormVideoSet)}>Add</button>
        </div>
        <div>
            <button className="createButton" id="submit" type="button" onClick={() => {
                sendAssignmentRequest()
            }}>Create
            </button>
            <button className="cancelButton" type="button" onClick={() => {
                setShowAssignmentForm(false)
                setAssignmentFormName("")
                setAssignmentFormDesc("")
                setAssignmentFormAssignee("")
                setShowAssignmentButton(true)
                setShowAssignmentDescriptionError(false)
                setShowAssignmentAssigneeError(false)
                setShowAssignmentNameError(false)
                setChosenAssignees([])
                setChosenVideoSets([])
            }
            }>Cancel
            </button>
        </div>
    </div>

    const videoSetForm = <div className="videoSetForm">
        <div>
            <div className="formText">
                <label htmlFor="newVideoSetName">Name</label>
            </div>
            {showVideoSetNameError ? videoSetNameError : null}
            <input type="text"
                   id="newVideoSetName"
                   maxLength={50}
                   value={videoSetFormName}
                   onChange={(e) => setVideoSetFormName(e.target.value)}/>
        </div>
        <div>
            <div className="formText">Video Count</div>
            <div>
                <input defaultChecked type="radio" id="newVideoSetCount1" name="newVideoSetCount"
                       value={1} onClick={() => setVideoSetFormCount(1)}/>
                <label htmlFor="newVideoSetCount1">1</label>
            </div>
            <div>
                <input type="radio" id="newVideoSetCount2" name="newVideoSetCount"
                       value={2} onClick={() => setVideoSetFormCount(2)}/>
                <label htmlFor="newVideoSetCount2">2</label>
            </div>
        </div>
        <div>
            <button className="createButton" id="submit" type="button" onClick={() => {
                sendVideoSetRequest()
            }}>Create
            </button>
            <button className="cancelButton" type="button" onClick={() => {
                setShowVideoSetForm(false)
                setVideoSetFormName("")
                setVideoSetFormCount(1)
                setShowVideoSetButton(true)
                setShowVideoSetNameError(false)
            }
            }>Cancel
            </button>
        </div>
    </div>

    const labelForm = <div className="labelForm">
        <div>
            <div className="formText">
                <label htmlFor="newLabelName">Name</label>
            </div>
            {showLabelNameError ? labelNameError : null}
            <input type="text"
                   id="newLabelName"
                   maxLength={25}
                   value={labelFormName}
                   onChange={(e) => setLabelFormName(e.target.value)}/>
        </div>
        <div>
            <div className="formText">
                <label htmlFor="newLabelShortcut">Shortcut</label>
            </div>
            {showLabelShortcutError ? labelShortcutError : null}
            <input className="shortCutInput" type="text"
                   id="newLabelShortcut"
                   pattern="[a-zA-Z'-'\s]*"
                   maxLength={1}
                   value={labelFormShortcut}
                   onChange={(e) => setLabelFormShortcut(e.target.value.toUpperCase().replace(/[^a-z]/gi, ''))}
            />
        </div>
        <div>
            <div className="formText">
                <label htmlFor="newLabelColor">Color</label>
            </div>
            <input type="color"
                   id="newLabelColor"
                   value={labelFormColor}
                   onChange={(e) => setLabelFormColor(e.target.value)}/>
        </div>
        <div>
            <div className="formText">Type</div>
            <div>
                <input defaultChecked type="radio" id="newLabelTypePoint" name="newLabelType"
                       value="point" onClick={() => setLabelFormType("point")}/>
                <label htmlFor="newLabelTypePoint">Point</label>
            </div>
            <div>
                <input type="radio" id="newLabelTypeRange" name="newLabelType"
                       value="range" onClick={() => setLabelFormType("range")}/>
                <label htmlFor="newLabelTypeRange">Range</label>
            </div>
        </div>
        <div>
            <button className="createButton" id="submit" type="button" onClick={() => {
                sendLabelRequest()
            }}>Create
            </button>
            <button className="cancelButton" type="button" onClick={() => {
                setShowLabelForm(false)
                setLabelFormName("")
                setLabelFormColor("#ff0000")
                setLabelFormType("point")
                setLabelFormShortcut("")
                setShowLabelButton(true)
                setShowLabelNameError(false)
                setShowLabelShortcutError(false)
            }
            }>Cancel
            </button>
        </div>
    </div>

    function sendLabelRequest() {
        let error = false
        if (labelFormName === "") {
            setShowLabelNameError(true)
            error = true
        }

        if (labelFormShortcut === "") {
            setShowLabelShortcutError(true)
            error = true
        }

        if (error) {
            return
        }

        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = `${id}/labels`
            const requestBody = {
                name: labelFormName,
                color: labelFormColor,
                projectId: id,
                type: labelFormType,
                shortcut: labelFormShortcut
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
                    return Promise.reject("Couldn't create label")
                }
            })
                .then(() => {
                    window.location = `/projects/${id}`
                })
        }
    }

    function sendVideoSetRequest() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            if (videoSetFormName === "") {
                setShowVideoSetNameError(true)
                return
            }

            const token = getAccessToken()
            const url = `${id}/videosets`
            const requestBody = {
                name: videoSetFormName,
                maxVideoCount: videoSetFormCount,
                projectId: id
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
                    return Promise.reject("Couldn't create video set")
                }
            })
                .then(() => {
                    window.location = `/projects/${id}`
                })
        }
    }

    function sendAssignmentRequest() {

        let error = false

        if (assignmentFormName === "") {
            setShowAssignmentNameError(true)
            error = true
        }

        if (assignmentFormDesc === "") {
            setShowAssignmentDescriptionError(true)
            error = true
        }

        if (chosenAssignees.length === 0) {
            setShowAssignmentAssigneeError(true)
            error = true
        }

        if (chosenVideoSets.length === 0) {
            setShowAssignmentVideoSetError(true)
            error = true
        }

        if (error) {
            return
        }

        let combinations = []
        for (const ass of chosenAssignees) {
            for (const vs of chosenVideoSets) {
                combinations.push({
                    name: assignmentFormName,
                    description: assignmentFormDesc,
                    projectId: id,
                    assigneeName: ass,
                    videoSetId: vs.id
                })
            }
        }

        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = `${id}/assignments/many`
            // const videoSetId = parseInt(document.querySelector('#videoSetSelect').value)

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "post",
                body: JSON.stringify(combinations)
            }).then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.text(), response.headers])
                } else {
                    return Promise.reject("Something went wrong")
                }
            })
                .then(() => {
                    window.location = `/projects/${id}`
                })
        }
    }

    function sendDeleteLabelRequest(labelId) {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = `${id}/labels/${labelId}`

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
                    window.location = `/projects/${id}`
                })
        }
    }

    function sendDeleteVideoSetRequest(videoSetId) {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = `${id}/videosets/${videoSetId}`

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
                    window.location = `/projects/${id}`
                })
        }
    }

    function sendDeleteAssignmentRequest(assignmentId) {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = `${id}/assignments/${assignmentId}`

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "delete",
            }).then((response) => {
                if (response.status === 202) {
                    return Promise.all([response.text(), response.headers])
                } else {
                    return Promise.reject("Something went wrong")
                }
            })
                .then(() => {
                    window.location = `/projects/${id}`
                })
        }
    }

    function exportJson(assignmentId) {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const videoSetId = assignments.find(a => a.id === assignmentId).videoSetId
            const assigneeName = assignments.find(a => a.id === assignmentId).assigneeName
            const videoSetName = videoSets.find(v => v.id === videoSetId).name

            fetch(`${id}/assignments/${assignmentId}/events`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get",
            }).then((response) => {
                if (response.status === 200) return Promise.all([response.json(), response.headers])
                else return Promise.reject("Failed to export events, code: " + response.status)
            }).then(([body]) => {
                exportEvents(body.eventList, videoSetName, labels, assigneeName)
            })
                .catch((rejectMessage) => {
                    console.error(rejectMessage)
                })
        }
    }

    //initial request
    useEffect(
        function getProject() {
            refreshTokenThenFetch(fetchFunc)

            function fetchFunc() {
                const token = getAccessToken()

                fetch("", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    method: "get",
                }).then((response) => {
                    if (response.status === 200) return Promise.all([response.json(), response.headers])
                    else return Promise.reject(["Invalid something", response.status])
                }).then(([body]) => {
                    console.log(body)
                    const maxVideos = []
                    let i = 0
                    body.videoSetList.forEach(arr => {
                        maxVideos[i] = arr.maxVideoCount
                        i++
                    })
                    setMaxVideoCounts(maxVideos)
                    setLoaded(true)
                    setName(body.name)
                    setDescription(body.description)
                    setId(body.id)
                    setAssignments(body.assignmentList)
                    setVideoSets(body.videoSetList)
                    setLabels(body.labelList)
                }).catch(([rejectMessage, code]) => {
                    if (code === 403)
                        window.location = window.location.origin
                    console.error(rejectMessage)
                })
            }
        }, [])

    if (error) {
        return <div>Error</div>
    } else if (!isLoaded) {
        return <div className="loading">Loading...</div>
    } else {
        return (
            <>
                <Helmet>
                    <title>{name} - LOVES</title>
                </Helmet>
                <div className="infoBox">
                    <div className="projectTitleBox">
                        <p className="projectTitle">{name}</p>
                    </div>
                    <div className="projectDescBox">
                        <p className="projectDesc">{description}</p>
                    </div>
                    {showProjectButton ? <button className="editProjectButton"
                                                 type="button" onClick={() => {
                        setShowProjectEditForm(true)
                        setShowProjectButton(false)
                    }}>Edit Project
                    </button> : null}
                    {showProjectEditForm ? projectEditForm : null}
                </div>




                <div className="projectRow">
                    <div className="assignmentsColumn">
                        <div className="columnTitle">
                            <p className="columnTitleText">Assignments</p>
                        </div>
                        {showAssignmentButton ?
                            <div>
                                <button className="newButton" type="button" onClick={() => {
                                    setShowAssignmentForm(true)
                                    setShowAssignmentButton(false)
                                }}>New Assignment
                                </button>
                            </div>
                            : null}

                        {showAssignmentForm ? assignmentForm : null}
                        <div className="filterBoxWrapper">
                            <label className="filterBoxLabel" htmlFor="filterBox">Filter:</label>
                            <input id="filterBox"
                                   className="filterBox"
                                   type="text"
                                   maxLength={50}
                                   value={filterName}
                                   onChange={(e) => setFilerName(e.target.value)}
                            />
                            <label className="filterBoxLabel" htmlFor="finishedCheckbox">Finished only: </label>
                            <input type="checkbox" id="finishedCheckbox" value={filterFinished}
                                   onChange={() => {setFilerFinished(filterFinished === "false" ? "true" : "false")}}/>
                        </div>
                        <div className="scrollable">{assignments.filter(
                            a => a.name.includes(filterName) ||
                                a.description.includes(filterName) ||
                                a.assigneeName.includes(filterName) ||
                                a.videoSetName.includes(filterName)
                        ).filter(a => a.finished === true || filterFinished === "false").map(function (object, i) {
                            console.log(typeof object.name)
                            let exportButton = <></>
                            if (object.numberOfEvents > 0) {
                                exportButton = <button className="exportButton" type="button" onClick={() => {
                                    exportJson(object.id)
                                }}>Export</button>
                            }

                            let created = Moment().diff(Moment(object.creationTime), 'seconds')
                            let modified = Moment().diff(Moment(object.modificationTime), 'seconds')
                            let createdText = normalizeTime(created)
                            let modifiedText = normalizeTime(modified)


                            return <div className="assignmentCard" key={i}>
                                <button className="assignmentDeleteButton iconHoverButton" onClick={() => {
                                    sendDeleteAssignmentRequest(object.id)
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
                                <div className="assignmentCardInfo">
                                    <div className="assignmentCardTitle">
                                        <p>{object.name}</p>
                                    </div>
                                    <div className="assignmentCardDesc">
                                        <p> {object.description} </p>
                                    </div>
                                    <div className="assignmentCardDetails">
                                        <div className="detailsRow"> Assignee: <span
                                            className="smallerText">{object.assigneeName}</span></div>
                                        <div className="detailsRow"> Video Set: <span
                                            className="smallerText">{object.videoSetName}</span></div>
                                        <div className="detailsRow"> Created: <span
                                            className="smallerText">{createdText} ago</span></div>
                                        <div className="detailsRow"> Modified: <span
                                            className="smallerText">{modifiedText} ago</span></div>
                                        <div className="detailsRow"> Events: <span
                                            className="smallerText">{object.numberOfEvents}</span></div>
                                        <div className="detailsRowLast"> Finished: <span
                                            className="smallerText">{object.finished === true ? "Yes" : "No"}</span>
                                        </div>
                                    </div>
                                    {exportButton}
                                </div>
                            </div>
                        })}</div>
                    </div>
                    <div className="videoSetsColumn">
                        <div className="columnTitle">
                            <p className="columnTitleText">Video Sets</p>
                        </div>
                        {showVideoSetButton ?
                            <button className="newButton" type="button" onClick={() => {
                                setShowVideoSetForm(true)
                                setShowVideoSetButton(false)
                            }}>New Video Set
                            </button> : null}

                        {showVideoSetForm ? videoSetForm : null}
                        <div className="scrollable">{videoSets.map(function (object, i) {
                            return <div className="videoSetCard" key={i}>
                                <button className="videoSetDeleteButton iconHoverButton" onClick={() => {
                                    sendDeleteVideoSetRequest(object.id)
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
                                <div className="videoSetCardInfo"><h3>{object.name}</h3>
                                    <div> Videos: {object.videoCount}/{maxVideoCounts[i]}</div>

                                    <button className="editButton" type="button" onClick={() => {
                                        window.location = `/projects/${id}/videosets/${object.id}`
                                    }}>Edit
                                    </button>
                                </div>
                            </div>
                        })}</div>
                    </div>
                    <div className="labelsColumn">
                        <div className="columnTitle">
                            <p className="columnTitleText">Labels</p>
                        </div>

                        {showLabelButton ?
                            <button className="newButton" type="button" onClick={() => {
                                setShowLabelForm(true)
                                setShowLabelButton(false)
                            }}>New Label
                            </button> : null}
                        {showLabelForm ? labelForm : null}
                        <div className="scrollable">{labels.map(function (object, i) {
                            return <div className="labelCard" key={i}>
                                <button className="labelDeleteButton iconHoverButton" onClick={() => {
                                    sendDeleteLabelRequest(object.id)
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
                                <div className="labelCardInfo">
                                    <b>{object.name}</b>
                                    <div>
                                        <svg height={20} width={75} className="colorBox">
                                            <rect width={75} height={20} fill={object.color} rx={10}/>
                                        </svg>
                                    </div>
                                    <div>Type: {object.type}</div>
                                    <div>Shortcut: {object.shortcut}</div>
                                </div>
                            </div>
                        })}
                        </div>
                    </div>
                </div>

            </>
        )
    }

}

export default ProjectPage