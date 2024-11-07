import React, {useEffect, useRef} from 'react'
import {getAccessToken} from "../utils/getAccessToken"
import {useState} from "react"
import axios from "axios"
import "./VideoSetEdit.css"
import {refreshTokenThenFetch} from "../utils/refreshTokenThenFetch"
import {Helmet} from "react-helmet";

const VideoSetEdit = () => {
    const [projectId, setProjectId] = useState("")
    const [name, setName] = useState("")
    const [videosUploadedCount, setVideosUploadedCount] = useState("")
    const [maxVideoCount, setMaxVideoCount] = useState("")
    const [fileProgress, setFileProgress] = useState("")
    const [showFileProgress, setShowFileProgress] = useState(false)

    const [fileUploaded, setFileUploaded] = useState(false)
    const filesCount = useRef(0)
    const [files, setFiles] = useState([])
    const [showVideoUploadError, setShowVideoUploadError] = useState(false)
    const videoUploadError = <div className="error">Too many files</div>

    const handleFileInput = (e) => {
        if(e.target.files.length > maxVideoCount - videosUploadedCount) {
            setShowVideoUploadError(true)
        }
        else {
            Array.from(e.target.files).forEach(f => {
                if(files.length < maxVideoCount - videosUploadedCount) {
                    setFiles(oldArray => [...oldArray, f])
                    filesCount.current += 1
                }
            })
            setFileUploaded(true)
            setShowVideoUploadError(false)
        }
    }

    function sendFileRequest() {
        refreshTokenThenFetch(fetchFunc)
        setShowFileProgress(true)

        function fetchFunc() {
            const token = getAccessToken()
            const form = new FormData()
            for (let i = 0; i < filesCount.current; i++) {
                form.append('file', files[i])
                axios.request({
                    method: "post",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    url: window.location + "/file",
                    data: form,
                    onUploadProgress: (p) => {
                        setFileProgress((p.loaded / p.total).toFixed(2).toString())
                    }
                }).then(() => {
                    if ((filesCount.current - 1) === i) {
                        window.location = "/projects/" + projectId
                    }
                })
                form.delete('file')
            }
        }
    }

    function sendEditRequest() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = window.location.href
            const requestBody = {
                name: name,
                maxVideoCount: maxVideoCount,
            }

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "put",
                body: JSON.stringify(requestBody)
            }).then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.text(), response.headers])
                } else {
                    return Promise.reject("Something went wrong")
                }
            }).then(() => {
                if (fileUploaded === true) {
                    sendFileRequest()
                    setFileUploaded(false)
                } else {
                    window.location = "/projects/" + projectId
                }
            })
        }
    }

    useEffect(function getVideoSet() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = window.location.href

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get"
            }).then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.json(), response.headers])
                } else {
                    return Promise.reject("Couldn't edit video set")
                }
            }).then(([body]) => {
                setProjectId(body.projectId)
                setName(body.name)
                setVideosUploadedCount(body.videoIdList.length)
                setMaxVideoCount(body.maxVideoCount)
                document.querySelector("#file_upload").disabled = body.maxVideoCount === body.videoIdList.length
                document.querySelector("#maxVideoCount").disabled = body.videoIdList.length === 2
            })
        }
    }, [])

    useEffect(function changeUploadEnabled() {
        if(maxVideoCount > videosUploadedCount)
            document.querySelector("#file_upload").disabled = false
        else {
            document.querySelector("#file_upload").disabled = true
            setFiles([])
            setFileUploaded(false)
        }
    }, [maxVideoCount, videosUploadedCount])

    return (
        <>
            <Helmet>
                <title>Edit Video Set - LOVES</title>
            </Helmet>
            <div className="videoSetEditForm">
                <button className="goBackButton" id="submit" type="button" onClick={() => {
                    window.location = "/projects/" + projectId
                }}>Back
                </button>
                <h2 className="videoSetEditFormTitle">Edit Video Set</h2>
                <div>
                    <label htmlFor="name">Name</label>
                    <input type="text"
                           id="name"
                           value={name}
                           maxLength={50}
                           onChange={(e) => setName(e.target.value)}/>
                </div>
                <div>
                    <label htmlFor="maxVideoCount">Videos expected in set</label>
                    <input type="number"
                           min="1"
                           max="2"
                           id="maxVideoCount"
                           value={maxVideoCount}
                           onKeyDown={(e) => e.preventDefault()}
                           onChange={(e) => setMaxVideoCount(e.target.value)}/>
                </div>
                <div>
                    <p>Videos uploaded to set: {videosUploadedCount}</p>
                </div>
                <div>
                    <p>Videos chosen: {files.length}</p>
                </div>
                <div>
                    <label htmlFor="file"> </label>
                    <div className="file-uploader">
                        <input id="file_upload" type="file" onChange={handleFileInput} multiple/>
                    </div>
                    {showVideoUploadError ? videoUploadError : null}
                </div>
                {showFileProgress ?
                    <div>
                        Uploading progress: {fileProgress * 100 + "%"}
                    </div> : null}

                <div>
                    <button className="submitVideoSetButton" id="submit" type="button" onClick={() => {
                        sendEditRequest()
                    }}>Apply Changes
                    </button>
                </div>
            </div>
        </>
    )
}

export default VideoSetEdit