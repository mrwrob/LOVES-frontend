function normalizeTime(seconds) {
        if(seconds < 60) {
            return  seconds + "s"
        }
        else if(seconds >= 60 && seconds < 3600) {
            return  Math.floor(seconds / 60) + "m"
        }
        else if(seconds >= 3600 && seconds < 86400) {
            return  Math.floor(seconds / 3600) + "h"
        }
        else {
            return  Math.floor(seconds / 86400) + "d"
        }
}

export {normalizeTime}