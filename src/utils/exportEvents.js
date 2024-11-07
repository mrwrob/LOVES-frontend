import randomstring from "randomstring";

function exportEvents(eventList, videoSetName, labels, assigneeName) {
    eventList.forEach(event => {
        const label = labels.find(label => label.id === event.labelId)
        event.label = JSON.parse(JSON.stringify(label))
        delete event.id
        delete event.assignmentId
        delete event.labelId
        delete event.label.id
        delete event.label.projectId
        delete event.label.eventIdList
    })
    const jsonReady = {
        "videoSetName": videoSetName,
        "assigneeName": assigneeName,
        eventList
    }
    const fileName = videoSetName.replaceAll(" ", "_") + "_" + randomstring.generate(10)
    const json = JSON.stringify(jsonReady, null, 2)
    const blob = new Blob([json], {type: "application/json"})
    const href = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = href
    link.download = fileName + ".json"
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(href)
}

export {exportEvents}