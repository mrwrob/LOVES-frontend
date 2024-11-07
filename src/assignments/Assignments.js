import React, {useEffect, useState} from 'react'
import {getAccessToken} from "../utils/getAccessToken"
import Moment from "moment"
import './Assignments.css'
import {refreshTokenThenFetch} from "../utils/refreshTokenThenFetch"
import {Helmet} from "react-helmet";
import {normalizeTime} from "../utils/normalizeTime";

const Assignments = () => {
    const [isLoaded, setLoaded] = useState(false)
    const [error,] = useState(null)
    const [assignments, setAssignments] = useState([])

    useEffect(function getAssignments() {
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
                else return Promise.reject("Getting assignments failed, code: " + response.status)
            }).then(([body]) => {
                setLoaded(true)
                setAssignments(body.assignmentList)
            }).catch((rejectMessage) => {
                console.error(rejectMessage)
            })
        }
    }, [])

    function finishAssignment(assignmentId) {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()

            fetch(`assignments/${assignmentId}/finish`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "put",
            }).then((response) => {
                if (response.status === 202) return Promise.all([response.text(), response.headers])
                else return Promise.reject("Finishing assignment failed, code: " + response.status)
            }).then(() => {
                window.location = "/assignments"
            }).catch((rejectMessage) => {
                console.error(rejectMessage)
            })
        }
    }

    if (error) {
        return <div>Error</div>
    } else if (!isLoaded) {
        return <div className="loading">Loading...</div>
    } else {
        return (
            <>
                <Helmet>
                    <title>Assignments - LOVES</title>
                </Helmet>
                <div className="assignmentsAColumn">
                    <div className="columnTitle">
                        <p className="columnTitleText">Assignments</p>
                    </div>
                    <div>
                        {assignments.filter(a => a.finished === false).map(function (object, i) {

                            let created = Moment().diff(Moment(object.creationTime), 'seconds')
                            let modified = Moment().diff(Moment(object.modificationTime), 'seconds')
                            let createdText = normalizeTime(created)
                            let modifiedText = normalizeTime(modified)

                            return <div className="assignmentCardA" key={i}>
                                <div className="assignmentLinkWrapper">
                                    <button disabled={!object.accessible} className="assignmentLink" onClick={() => {
                                        window.location += "/" + object.id + "/panel"
                                    }}>{object.name}</button>
                                    {object.accessible ? null :
                                        <div style={{color: "black", margin: "10px 0 0 0"}}>Assignment not ready
                                            yet</div>}
                                </div>
                                <div className="assignmentCardAInfo">
                                    <div className="assignmentsDesc"> {object.description} </div>
                                    <div className="assignmentsCardDetails">
                                        <div className="assignmentDetailsRow">
                                            Video Set: {object.videoSetName}
                                        </div>
                                        <div className="assignmentDetailsRow">
                                            Created: {createdText} ago
                                        </div>
                                        <div className="assignmentDetailsRow">
                                            Modified: {modifiedText} ago
                                        </div>
                                        <div  className="assignmentDetailsRowLast">
                                            Events: {object.numberOfEvents}
                                        </div>
                                    </div>
                                    <button disabled={!object.accessible || object.numberOfEvents === 0}
                                            className="finishButton" onClick={() => {
                                        finishAssignment(object.id)
                                    }}>Finish
                                    </button>
                                </div>
                            </div>
                        })}
                    </div>
                </div>
            </>
        )
    }

}

export default Assignments
