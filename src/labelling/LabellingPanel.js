import React, {createRef, useCallback, useMemo, useRef} from 'react'
import {useEffect} from "react"
import {getAccessToken} from "../utils/getAccessToken"
import {useState} from "react"
import ReactPlayer from "react-player"
import "./LabellingPanel.css"
import {refreshTokenThenFetch} from "../utils/refreshTokenThenFetch"
import {Helmet} from "react-helmet"

function useEventListener(eventType, handler) {

    const handlerRef = useRef(handler)

    useEffect(() => {
        handlerRef.current = handler
    })

    useEffect(() => {

        function internalHandler(e) {
            return handlerRef.current(e)
        }

        document.addEventListener(eventType, internalHandler, true)
        return () => document.removeEventListener(eventType, internalHandler)
    }, [eventType])
}

const LabellingPanel = () => {
    const [isLoaded, setLoaded] = useState(false)
    const [error,] = useState(null)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [id, setId] = useState()
    const [, setProjectId] = useState()
    const [labels, setLabels] = useState([])
    const [videoSetId, setVideoSetId] = useState([])
    const [videoIds, setVideoIds] = useState([])
    const [events, setEvents] = useState([])

    const [timeStamp, setTimeStamp] = useState("")
    const [timeStamp2, setTimeStamp2] = useState("")
    const [, setSecondTimeStampInput] = useState(<></>)
    const [videoUrls, setVideoUrls] = useState([])

    const players = [createRef(), createRef()]
    const [playing, setPlaying] = useState(false)
    const [played, setPlayed] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [seeking, setSeeking] = useState(false)
    const duration1 = useRef(0)
    const duration2 = useRef(0)
    const [volume, setVolume] = useState(0.5)
    const [timeGlobal, setTimeGlobal] = useState("")
    const playerW = 700
    const playerH = Math.floor(playerW * 9 / 16)
    const iconSize = 40

    const [lastPressed, setLastPressed] = useState(null)
    const currentLabelId = useRef(null)

    //flag that says if events are ready to be fetched
    const [canEvents, setCanEvents] = useState(false)

    const [parsedDuration, setParsedDuration] = useState("")

    const firstRenderLabelsCheck = useRef(true)
    const firstRenderVideosCheck = useRef(true)
    const firstRenderEventsCheck = useRef(true)

    function getVideo(data) {
        const blob = new Blob([data])
        const url = window.URL.createObjectURL(blob)
        setVideoUrls(oldArray => [...oldArray, url])
    }

    const firstShorter = useCallback(() => {
        return duration2.current === 0 || duration1.current < duration2.current
    }, [duration1, duration2])

    const getHours = useCallback(() => {
        const duration = firstShorter() ? duration1.current : duration2.current
        const hours = Math.floor((played * duration) / 3600)
        return ('0' + hours).slice(-2)
    }, [duration1, duration2, firstShorter, played])

    const getMinutes = useCallback(() => {
        const duration = firstShorter() ? duration1.current : duration2.current
        const minutes = Math.floor((played * duration) / 60) % 60
        return ('0' + minutes).slice(-2)
    }, [duration1, duration2, firstShorter, played])

    const getSeconds = useCallback(() => {
        const duration = firstShorter() ? duration1.current : duration2.current
        const seconds = Math.floor(played * duration) % 60
        return ('0' + seconds).slice(-2)
    }, [duration1, duration2, firstShorter, played])

    const getMilliseconds = useCallback(() => {
        const duration = firstShorter() ? duration1.current : duration2.current
        const milliseconds = Math.floor(1000 * (played * duration)) % 1000
        return ('00' + milliseconds).slice(-3)
    }, [duration1, duration2, firstShorter, played])

    function parseDuration() {
        let result = ''
        const duration = firstShorter() ? duration1.current : duration2.current
        const hours = Math.floor(duration / 3600)
        const minutes = Math.floor(duration / 60) % 60
        const seconds = Math.floor(duration) % 60
        const milliseconds = Math.floor(1000 * duration) % 1000
        if (hours > 0) {
            result += ('0' + hours).slice(-2) + ':'
        }
        if (minutes > 0) {
            result += ('0' + minutes).slice(-2) + ':'
        }
        result += ('0' + seconds).slice(-2) + '.'
        result += ('0' + milliseconds).slice(-3)
        setParsedDuration(result)
    }

    useEffect(function updateTime() {
        const time = getHours() + ":" + getMinutes() + ":" + getSeconds() + "." + getMilliseconds()
        setTimeGlobal(time)
    }, [getMilliseconds, getMinutes, getSeconds, getHours])

    const createEvent = useCallback((type) => {
        let time2 = timeStamp2 === "" ? "00:00:00.000" : timeStamp2
        let time = timeStamp === "" ? "00:00:00.000" : timeStamp
        if (type === "range") {
            time2 = timeGlobal
            if(time > time2)
                [time, time2] = [time2, time]
        }
        if (type === "point") {
            time = timeGlobal
        }

        const event = {
            id: 0,
            labelId: currentLabelId.current,
            assignmentId: id,
            start: time,
            end: time2
        }

        setEvents(oldArray => [...oldArray, event])
    }, [currentLabelId, id, timeGlobal, timeStamp, timeStamp2])

    function detectKeyDown(e) {
        const key = e.key

        //space
        if(e.keyCode === 32) {
            e.preventDefault()
            setPlaying(!playing)
        }
        //right arrow
        if(e.keyCode === 39) {
            e.preventDefault()
            skip(5)
        }
        //left arrow
        if(e.keyCode === 37) {
            e.preventDefault()
            skip(-5)
        }

        //up arrow
        if (e.keyCode === 38) {
            e.preventDefault()
            setSpeed(1)
        }

        //down arrow
        if (e.keyCode === 40) {
            e.preventDefault()
            setSpeed(-1)
        }

        //ctrl + s
        if(e.ctrlKey && e.which === 83) {
            e.preventDefault()
            sendEventsRequest()
            return
        }

        for (const label of labels) {
            if (label.shortcut === key.toUpperCase()) {
                // document.querySelector('#label').value = label.id
                currentLabelId.current = label.id
                handleLabelChange()
                if (label.type === "range") {
                    if (lastPressed === label.shortcut) {
                        setTimeStamp2(timeGlobal)
                        createEvent("range")
                        setLastPressed(null)
                    } else {
                        setTimeStamp(timeGlobal)
                        setLastPressed(label.shortcut)
                    }
                } else {

                    setTimeStamp(timeGlobal)
                    createEvent("point")
                    setLastPressed(key.toUpperCase())
                }
                break
            }
        }
    }

    function deleteEvent(index) {
        const temp = [...events]
        temp.splice(index, 1)
        setEvents(temp)
    }

    //sort events when updated
    useMemo(function sortEvents() {
        const sorted = events.sort((a, b) => {
            const hoursB = parseInt(b.start.substring(0, 2))
            const hoursA = parseInt(a.start.substring(0, 2))
            if (hoursA !== hoursB) {
                return hoursB - hoursA
            } else {
                const minutesB = parseInt(b.start.substring(3, 5))
                const minutesA = parseInt(a.start.substring(3, 5))
                if (minutesB !== minutesA) {
                    return minutesB - minutesA
                } else {
                    const secondsB = parseInt(b.start.substring(6, 8))
                    const secondsA = parseInt(a.start.substring(6, 8))
                    if (secondsB !== secondsA) {
                        return secondsB - secondsA
                    } else {
                        return parseInt(b.start.substring(9)) - parseInt(a.start.substring(9))
                    }
                }
            }
        })
        setEvents(sorted)
    }, [events])

    //initial request
    useEffect( function getAssignment () {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            const url = window.location.href.substring(0, window.location.href.indexOf("/panel"))

            fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get",
            }).then((response) => {
                if (response.status === 200) return Promise.all([response.json(), response.headers])
                else return Promise.reject(["Invalid something", response.status])
            }).then(([body]) => {
                setLoaded(true)
                setName(body.name)
                setId(body.id)
                setProjectId(body.projectId)
                setDescription(body.description)
                setVideoSetId(body["videoSet"].id)
                setVideoIds(body["videoSet"]["videoIdList"])
            }).catch(([rejectMessage, code]) => {
                if(code === 403)
                    window.location = window.location.origin
                console.error(rejectMessage)
            })
        }
    }, [])

    //get videos when video id list is set
    useEffect(function getVideos() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            if (firstRenderVideosCheck.current) {
                firstRenderVideosCheck.current = false
                return
            }
            if (videoUrls.length > 0) {
                return
            }

            videoIds.forEach((videoId) => {
                fetch(`videosets/${videoSetId}/videos/${videoId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    method: "get",
                }).then((response) => {
                    if (response.status === 200) {
                        return Promise.all([response.arrayBuffer(), response.headers])
                    } else {
                        return Promise.reject("Getting video failed, code: " + response.status)
                    }
                }).then(([body]) => {
                    getVideo(body)
                }).catch((rejectMessage) => {
                    console.error(rejectMessage)
                })
            })
        }

    }, [id, videoIds, videoSetId, videoUrls])

    //get labels when (assignment)id is set
    useEffect(function getLabels() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            if (firstRenderLabelsCheck.current) {
                firstRenderLabelsCheck.current = false
                return
            }

            fetch(`labels`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get",
            }).then((response) => {
                if (response.status === 200) return Promise.all([response.json(), response.headers])
                else return Promise.reject("Failed to get labels, code: " + response.status)
            }).then(([body]) => {
                setLabels(body["labelList"])
                setCanEvents(true)
            }).catch((rejectMessage) => {
                console.error(rejectMessage)
            })
        }


    }, [id])

    useEventListener('keydown', detectKeyDown)

    //get events
    useEffect(function getEvents() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()
            if (firstRenderEventsCheck.current) {
                firstRenderEventsCheck.current = false
                return
            }

            if (!canEvents) {
                return
            }
            fetch(`events`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "get",
            }).then((response) => {
                if (response.status === 200) return Promise.all([response.json(), response.headers])
                else return Promise.reject("Failed to get events, code: " + response.status)
            }).then(([body]) => {
                setEvents(body.eventList)
                setCanEvents(false)
            })
                .catch((rejectMessage) => {
                    console.error(rejectMessage)
                })
        }

    }, [canEvents, id])

    function handleVolumeChange(e) {
        setVolume(parseFloat(e.target.value))
    }

    //update event creation form
    function handleLabelChange() {
        const labelType = labels.find(l => l.id === currentLabelId.current).type

        if (labelType === "range") {
            setSecondTimeStampInput(<div>
                <label htmlFor="time2">End</label>
                <button onClick={() => {
                }}>Set
                </button>
                <div>{timeStamp2}</div>
            </div>)
        } else {
            setTimeStamp2("")
            setSecondTimeStampInput(<></>)
        }
    }

    function sendEventsRequest() {
        refreshTokenThenFetch(fetchFunc)

        function fetchFunc() {
            const token = getAccessToken()

            const requestBody = {
                assignmentId: id,
                eventList: events
            }

            fetch(`events`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                method: "post",
                body: JSON.stringify(requestBody)
            }).then((response) => {
                if (response.status === 200) {
                    return Promise.all([response.text(), response.headers])
                } else {
                    return Promise.reject("Failed to send events, code: " + response.status)
                }
            }).then(() => {
                setCanEvents(true)
            }).catch((rejectMessage) => {
                console.error(rejectMessage)
            })
        }
    }

    function handleSeekChange(seconds) {
        setPlayed(seconds.target.value)
    }

    function handleProgress1(state) {
        if (!seeking && firstShorter()) {
            setPlayed(state.played)
        }
    }

    function handleProgress2(state) {
        if (!seeking && !firstShorter()) {
            setPlayed(state.played)
        }
    }

    function setSpeed(value) {
        if (value < 0) {
            if (playbackRate > 0.25) {
                setPlaybackRate(playbackRate - 0.25)
            }
        } else {
            if (playbackRate < 2.0) {
                setPlaybackRate(playbackRate + 0.25)
            }
        }
    }

    function handlePlay() {
        setPlaying(true)
    }

    function handlePause() {
        setPlaying(false)
    }

    function handleSeekMouseDown() {
        setSeeking(true)
    }

    function normalizeSeek(value, index) {
        if (firstShorter()) {
            if (index === 0) {
                return value
            } else {
                return value / (duration2.current / duration1.current)
            }
        } else {
            if (index === 0) {
                return value / (duration1.current / duration2.current)
            } else {
                return value
            }
        }
    }

    function handleSeekMouseUp(e) {
        setSeeking(false)
        players[0].current.seekTo(normalizeSeek(e.target.value, 0))
        if (videoUrls.length > 1) {
            players[1].current.seekTo(normalizeSeek(e.target.value, 1))
        }
    }

    function handleDuration1(newDuration) {
        duration1.current = newDuration
        parseDuration()
    }

    function handleDuration2(newDuration) {
        duration2.current = newDuration
        parseDuration()
    }

    function handleEnded() {
        players[0].current.seekTo(0)
        if (videoUrls.length > 1) {
            players[1].current.seekTo(0)
        }
        setPlaying(false)
    }

    function skip(amount) {
        const duration = firstShorter() ? duration1.current : duration2.current
        if (played + amount / duration > 0.999999) {
            players[0].current.seekTo(normalizeSeek(0.999999, 0))
            if (videoUrls.length > 1) {
                players[1].current.seekTo(normalizeSeek(0.999999, 1))
            }
        } else if (played + amount / duration < 0) {
            players[0].current.seekTo(0)
            if (videoUrls.length > 1) {
                players[1].current.seekTo(0)
            }
        } else {
            players[0].current.seekTo(normalizeSeek(played + amount / duration, 0))
            if (videoUrls.length > 1) {
                players[1].current.seekTo(normalizeSeek(played + amount / duration, 1))
            }
        }
    }

    function sliceTimestamp(timestamp) {
        if (parsedDuration.length > 9) {
            return timestamp
        } else if (parsedDuration.length > 6) {
            return timestamp.slice(3)
        } else {
            return timestamp.slice(6)
        }
    }

    function hexToRgb(hex) {
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b
        })
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null
    }

    if (error) {
        return <div>Error</div>
    } else if (!isLoaded) {
        return <div>Loading...</div>
    } else {

        return (
            <>
                <Helmet>
                    <title>{name} - LOVES</title>
                </Helmet>
                <div>
                    <div className="wrapper">
                        <div className="restWrapper">
                            <div className="videosBox">
                                <div className="videoBox">
                                    <ReactPlayer width={playerW}
                                                 height={playerH}
                                                 url={videoUrls[0]}
                                                 ref={players[0]}
                                                 playing={playing}
                                                 onProgress={handleProgress1}
                                                 onPlay={handlePlay}
                                                 onPause={handlePause}
                                                 onDuration={handleDuration1}
                                                 onEnded={handleEnded}
                                                 progressInterval={10}
                                                 playbackRate={playbackRate}
                                                 volume={volume}
                                    />
                                </div>
                                {videoUrls.length > 1 ? <div className="videoBox">
                                    <ReactPlayer width={playerW}
                                                 height={playerH}
                                                 url={videoUrls[1]}
                                                 ref={players[1]}
                                                 playing={playing}
                                                 onProgress={handleProgress2}
                                                 onPlay={handlePlay}
                                                 onPause={handlePause}
                                                 onDuration={handleDuration2}
                                                 onEnded={handleEnded}
                                                 progressInterval={10}
                                                 playbackRate={playbackRate}
                                                 volume={volume}
                                    />
                                </div> : null}
                            </div>
                            <div className="controlsWrapper">
                                <div className="controlsLeft">
                                    <div className="subControls">
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            setSpeed(-1)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-rewind-fill icon-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M8.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L8.404 7.304Z"/>
                                                <path
                                                    d="M.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L.404 7.304Z"/>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-rewind icon-no-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M9.196 8 15 4.633v6.734L9.196 8Zm-.792-.696a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L8.404 7.304Z"/>
                                                <path
                                                    d="M1.196 8 7 4.633v6.734L1.196 8Zm-.792-.696a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L.404 7.304Z"/>
                                            </svg>
                                        </button>
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            skip(-5)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-backward-fill icon-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5z"/>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-backward icon-no-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M.5 3.5A.5.5 0 0 1 1 4v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v2.94l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L8.5 8.752v2.94c0 .653-.713.998-1.233.696L1 8.752V12a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm7 1.133L1.696 8 7.5 11.367V4.633zm7.5 0L9.196 8 15 11.367V4.633z"/>
                                            </svg>
                                        </button>
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            skip(-1)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-start-fill icon-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.54-.313 1.232.066 1.232.696v7.384c0 .63-.692 1.01-1.232.697L5 8.753V12a.5.5 0 0 1-1 0V4z"/>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-start icon-no-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L5 8.752V12a.5.5 0 0 1-1 0V4zm7.5.633L5.696 8l5.804 3.367V4.633z"/>
                                            </svg>
                                        </button>
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            setPlaying(!playing)
                                        }}>
                                            {playing ?
                                                <svg xmlns="http://www.w3.org/2000/svg" width={iconSize}
                                                     height={iconSize}
                                                     fill="currentColor" className="bi bi-pause icon-no-fill"
                                                     viewBox="0 0 16 16">
                                                    <path
                                                        d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
                                                </svg>
                                                : <svg xmlns="http://www.w3.org/2000/svg" width={iconSize}
                                                       height={iconSize}
                                                       fill="currentColor" className="bi bi-play icon-no-fill"
                                                       viewBox="0 0 16 16">
                                                    <path
                                                        d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
                                                </svg>
                                            }
                                            {playing ?
                                                <svg xmlns="http://www.w3.org/2000/svg" width={iconSize}
                                                     height={iconSize}
                                                     fill="currentColor" className="bi bi-pause-fill icon-fill"
                                                     viewBox="0 0 16 16">
                                                    <path
                                                        d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                                                </svg>
                                                : <svg xmlns="http://www.w3.org/2000/svg" width={iconSize}
                                                       height={iconSize}
                                                       fill="currentColor" className="bi bi-play-fill icon-fill"
                                                       viewBox="0 0 16 16">
                                                    <path
                                                        d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                                                </svg>
                                            }

                                        </button>
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            skip(1)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-end-fill icon-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0V4z"/>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-end icon-no-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.713 3.31 4 3.655 4 4.308v7.384c0 .653.713.998 1.233.696L11.5 8.752V12a.5.5 0 0 0 1 0V4zM5 4.633 10.804 8 5 11.367V4.633z"/>
                                            </svg>
                                        </button>
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            skip(5)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-forward-fill icon-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5z"/>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-skip-forward icon-no-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.752l-6.267 3.636c-.52.302-1.233-.043-1.233-.696v-2.94l-6.267 3.636C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696L7.5 7.248v-2.94c0-.653.713-.998 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5zM1 4.633v6.734L6.804 8 1 4.633zm7.5 0v6.734L14.304 8 8.5 4.633z"/>
                                            </svg>
                                        </button>
                                        <button className="controlsButton iconHoverButton" onClick={() => {
                                            setSpeed(1)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-fast-forward-fill icon-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"/>
                                                <path
                                                    d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"/>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
                                                 fill="currentColor" className="bi bi-fast-forward icon-no-fill"
                                                 viewBox="0 0 16 16">
                                                <path
                                                    d="M6.804 8 1 4.633v6.734L6.804 8Zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"/>
                                                <path
                                                    d="M14.804 8 9 4.633v6.734L14.804 8Zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>


                                <div className="controlsRight">
                                    <div className="progressWrapper">
                                        <input className="progressBar"
                                               type='range' min={0} max={0.999999} step='any'
                                               value={played}
                                               onMouseDown={handleSeekMouseDown}
                                               onChange={handleSeekChange}
                                               onMouseUp={handleSeekMouseUp}/>
                                    </div>
                                    <div className="playerInfoWrapper">
                                        <div className="speedInfo">
                                            Speed: {playbackRate}x
                                        </div>
                                        <div
                                            className="durationInfo">{parsedDuration.length > 9 ? getHours() + ":" : null}
                                            {parsedDuration.length > 6 ? getMinutes() + ":" : null}
                                            {getSeconds() + "."}
                                            {getMilliseconds()} / {parsedDuration}
                                        </div>
                                        <div className="volumeWrapper">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"
                                                 fill="currentColor" className="bi bi-volume-up" viewBox="0 0 16 16">
                                                {volume > 0.66 ?
                                                    <path
                                                        d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                                                    : null}
                                                {volume > 0.33 ?
                                                    <path
                                                        d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                                                    : null}
                                                {volume > 0.0001 ?
                                                    <path
                                                        d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 10.025"/>
                                                    : null}
                                                {volume <= 0.0001 ?
                                                    <path
                                                        d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/> :
                                                    <path transform="translate(-4 0)"
                                                          d="M10.717 3.55A.5.5 0 0 1 11 4v8a.5.5 0 0 1-.812.39L7.825 10.5H5.5A.5.5 0 0 1 5 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM10 5.04 8.312 6.39A.5.5 0 0 1 8 6.5H6v3h2a.5.5 0 0 1 .312.11L10 10.96V5.04z"/>
                                                }
                                            </svg>
                                            <input className="volumeBar" type="range" min={0} max={1} step={"any"}
                                                   value={volume} onChange={handleVolumeChange}/>
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div className="labellingBox">
                                <div className="labelsBox">
                                    <div className="labelCardsWrapper labellingScrollable">
                                        {labels.map(function (label, i) {
                                            let rgb = hexToRgb(label.color)
                                            const brightness = Math.round(((rgb.r * 299) +
                                                (rgb.g * 587) +
                                                (rgb.b * 114)) / 1000)

                                            const textColor = brightness > 125 ? "black" : "white"

                                            return <div className="labellingLabelCard" key={i}>
                                                <div className="labelTypeBox">
                                                    {label.type === "range" ?
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="19"
                                                             fill="currentColor" className="bi bi-pin-map"
                                                             viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" transform="translate(-2 0)"
                                                                  d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                                                            <path fillRule="evenodd" transform="translate(2 0)"
                                                                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                                                        </svg>
                                                        :
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="19"
                                                             fill="currentColor" className="bi bi-geo-alt"
                                                             viewBox="0 0 16 16">
                                                            <path
                                                                d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                                                            <path
                                                                d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                                        </svg>
                                                    }
                                                </div>
                                                <div className="shortcutBox"
                                                     style={{"backgroundColor": label.color, "color": textColor}}>
                                                    {label.shortcut}
                                                </div>
                                                <div className="labelNameBox">
                                                    {label.name}
                                                </div>
                                                <div className="labelCreateButtonWrapper">
                                                    {label.type === "range" && lastPressed === label.shortcut ?
                                                        <button className="labelCreateButton labelCreateButtonOrange"
                                                                onClick={() => {
                                                                    // document.querySelector('#label').value = label.id
                                                                    currentLabelId.current = label.id
                                                                    handleLabelChange()
                                                                    setTimeStamp2(timeGlobal)
                                                                    createEvent("range")
                                                                    setLastPressed(null)
                                                                }
                                                                }>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="19"
                                                                 height="19" fill="currentColor"
                                                                 className="bi bi-plus-square-dotted"
                                                                 viewBox="0 0 16 16">
                                                                <path
                                                                    d="M2.5 0c-.166 0-.33.016-.487.048l.194.98A1.51 1.51 0 0 1 2.5 1h.458V0H2.5zm2.292 0h-.917v1h.917V0zm1.833 0h-.917v1h.917V0zm1.833 0h-.916v1h.916V0zm1.834 0h-.917v1h.917V0zm1.833 0h-.917v1h.917V0zM13.5 0h-.458v1h.458c.1 0 .199.01.293.029l.194-.981A2.51 2.51 0 0 0 13.5 0zm2.079 1.11a2.511 2.511 0 0 0-.69-.689l-.556.831c.164.11.305.251.415.415l.83-.556zM1.11.421a2.511 2.511 0 0 0-.689.69l.831.556c.11-.164.251-.305.415-.415L1.11.422zM16 2.5c0-.166-.016-.33-.048-.487l-.98.194c.018.094.028.192.028.293v.458h1V2.5zM.048 2.013A2.51 2.51 0 0 0 0 2.5v.458h1V2.5c0-.1.01-.199.029-.293l-.981-.194zM0 3.875v.917h1v-.917H0zm16 .917v-.917h-1v.917h1zM0 5.708v.917h1v-.917H0zm16 .917v-.917h-1v.917h1zM0 7.542v.916h1v-.916H0zm15 .916h1v-.916h-1v.916zM0 9.375v.917h1v-.917H0zm16 .917v-.917h-1v.917h1zm-16 .916v.917h1v-.917H0zm16 .917v-.917h-1v.917h1zm-16 .917v.458c0 .166.016.33.048.487l.98-.194A1.51 1.51 0 0 1 1 13.5v-.458H0zm16 .458v-.458h-1v.458c0 .1-.01.199-.029.293l.981.194c.032-.158.048-.32.048-.487zM.421 14.89c.183.272.417.506.69.689l.556-.831a1.51 1.51 0 0 1-.415-.415l-.83.556zm14.469.689c.272-.183.506-.417.689-.69l-.831-.556c-.11.164-.251.305-.415.415l.556.83zm-12.877.373c.158.032.32.048.487.048h.458v-1H2.5c-.1 0-.199-.01-.293-.029l-.194.981zM13.5 16c.166 0 .33-.016.487-.048l-.194-.98A1.51 1.51 0 0 1 13.5 15h-.458v1h.458zm-9.625 0h.917v-1h-.917v1zm1.833 0h.917v-1h-.917v1zm1.834-1v1h.916v-1h-.916zm1.833 1h.917v-1h-.917v1zm1.833 0h.917v-1h-.917v1zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
                                                            </svg>
                                                        </button> :
                                                        <button className="labelCreateButton" onClick={() => {
                                                            currentLabelId.current = label.id
                                                            handleLabelChange()
                                                            if (label.type === "range") {
                                                                setTimeStamp(timeGlobal)
                                                                setLastPressed(label.shortcut)
                                                            } else {
                                                                setTimeStamp(timeGlobal)
                                                                createEvent("point")
                                                                setLastPressed(null)
                                                            }
                                                        }
                                                        }>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="19"
                                                                 height="19"
                                                                 fill="currentColor" className="bi bi-plus-square"
                                                                 viewBox="0 0 16 16">
                                                                <path
                                                                    d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                                                                <path
                                                                    d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                                            </svg>
                                                        </button>
                                                    }
                                                </div>
                                            </div>
                                        })}
                                    </div>
                                </div>
                                <div className="eventsBox">
                                    <div className="eventSaveButtonWrapper">
                                        <button className="eventSaveButton" onClick={() => sendEventsRequest()}>Save
                                        </button>
                                    </div>
                                    <div className="eventCardsWrapper labellingScrollable">
                                        {events.map(function (evt, i) {
                                            const label = labels.find(label => label.id === evt.labelId)

                                            let rgb = hexToRgb(label.color)
                                            const brightness = Math.round(((rgb.r * 299) +
                                                (rgb.g * 587) +
                                                (rgb.b * 114)) / 1000)

                                            const textColor = brightness > 125 ? "black" : "white"

                                            let eventNameClass = {"backgroundColor": `${label.color}`, "color": `${textColor}`}
                                            let newClass = null
                                            if (evt.id === 0) {
                                                newClass = {"textShadow": `1px 1px 15px lime`}
                                            }
                                            return <div className="eventCard" key={i}>
                                                <div className="eventName" style={eventNameClass}>
                                                    {label.name}
                                                </div>
                                                {label.type === "range" ?
                                                    <div className="eventStart" style={newClass}>
                                                        {sliceTimestamp(evt.start)}
                                                    </div> :
                                                    <div className="eventStartOnly" style={newClass}>
                                                        {sliceTimestamp(evt.start)}
                                                    </div>
                                                }
                                                {label.type === "range" ?
                                                    <div className="eventEnd" style={newClass}>
                                                        {sliceTimestamp(evt.end)}
                                                    </div> : null}
                                                <div className="deleteButtonWrapper">

                                                    <button className="deleteButton iconHoverButton"
                                                            onClick={() => deleteEvent(i)}>
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
                                                </div>
                                            </div>
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="assignmentInfoBox">
                        <div className="assignmentTitleBox">
                            <p className="assignmentTitle">{name}</p>
                        </div>
                        <div className="assignmentDescBox">
                            <p className="assignmentDesc">{description}</p>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default LabellingPanel