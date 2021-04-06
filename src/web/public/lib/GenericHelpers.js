var GenericHelpers = (function () { 'use strict';
    return {
        formatTorrentStatus: function (status) {
            if (status === 0) {
                return 'Paused'
            } else if (status === 1) {
                return 'Waiting for check'
            } else if (status === 2) {
                return 'Checking'
            } else if (status === 3) {
                return 'Waiting for download'
            } else if (status === 4) {
                return 'Downloading'
            } else if (status === 5) {
                return 'Waiting for seed'
            } else if (status === 6) {
                return 'Seeding'
            } else if (status === 7) {
                return 'Isolated'
            }
            return 'Unknown status (' + status + ')'
        },
        formatSize: function (size) {
            var unit = 'GB'
            var modifier = 1024 * 1024 * 1024

            if (size < 1024) {
                unit = 'B'
                modifier = 1
            } else if (size < 1024 * 1024) {
                unit = 'kB'
                modifier = 1024
            } else if (size < 1024 * 1024 * 1024) {
                unit = 'MB'
                modifier = 1024 * 1024
            }

            return parseInt(size / modifier * 100) / 100 + ' ' + unit
        },
        formatDate: function (timestamp) {
            return (new Date(timestamp * 1000)).toLocaleString()
        },
        formatDuration: function (time) {
            if (time < 0) {
                return '-'
            }
            var day = Math.trunc(time / (60*60*24))
            var hour = Math.trunc((time - day*60*60*24) / (60*60))
            var min = Math.trunc((time - day*60*60*24 - hour*60*60) / 60)
            var sec = Math.trunc((time - day*60*60*24 - hour*60*60 - min*60))
            if (day) {
                return day + ' day ' + hour + ' hour'
            }
            if (hour) {
                return hour + ' hour ' + min + ' min'
            }
            return min + ' min ' + sec + ' sec'
        }
    }
}());
