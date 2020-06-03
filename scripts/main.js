function padLeft(str) {
    return ('00' + str).substring(str.toString().length);
}

function uniqId() {
    return Math.random().toString(36).substr(2, 16);
}

Vue.filter('time', function (value) {
    var time = value / 1000;
    hours = Math.floor(time / 60 / 60),
    minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time - minutes * 60);

    return hours > 0
        ? `${padLeft(hours)}:${padLeft(minutes)}:${padLeft(seconds)}`
        : `${padLeft(minutes)}:${padLeft(seconds)}`;
})

var app = new Vue({
    el: '#root',
    data: {
        categories: [{
            title: 'Working'
        }, {
            title: 'Meetings'
        }, {
            title: 'Lounge'
        }, {
            title: 'Interviewing'
        }, {
            title: 'Discussing'
        }, {
            title: 'Dinner'
        }],
        currenctCategoryId: null,
        trackTimer: null,
        newCagetoryTitle: '',
        lastTrackTime: null
    },

    mounted() {
        this.categories.forEach(c => {
            Vue.set(c, 'id', uniqId());
            Vue.set(c, 'time', 0);
        })
        this.loadState();
    },
    methods: {
        track(categoryId) {
            this.stopTracking();

            if (this.currenctCategoryId == categoryId) {
                this.currenctCategoryId = null
            } else {
                this.currenctCategoryId = categoryId;
                this.startTracking();
            }
            this.toggleBadge();
        },

        startTracking() {
            const now = Date.now();
            const currenctCategory = this.categories.find(c => c.id === this.currenctCategoryId);
            if (!currenctCategory) return;
            if (this.lastTrackTime) {
                currenctCategory.time += now - this.lastTrackTime;
            }
            this.lastTrackTime = now;
            this.saveState();

            this.trackTimer = setTimeout(() => {
                this.startTracking()
            }, 1000)
        },

        stopTracking() {
            this.lastTrackTime = null;
            clearTimeout(this.trackTimer);
        },

        addCategory() {
            if (!this.newCagetoryTitle) return;
            this.categories.push({
                id: uniqId(),
                time: 0,
                title: this.newCagetoryTitle
            })
            this.newCagetoryTitle = '';
            this.saveState();
        },
        removeCategory(category) {
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.saveState();
        },

        addTime(category, time) {
            category.time += time;
            if (category.time < 0) {
                category.time = 0;
            }
            this.saveState();
        },
        loadState() {
            const stateKeys = ['lastTrackTime', 'currenctCategoryId', 'categories'];

            chrome.storage.local.get(stateKeys, (state) => {
                if (state) {
                    state = state;
                    Object.keys(state).forEach((key) => {
                        Vue.set(this.$data, key, state[key]);
                    })
                }
    
                if (this.currenctCategoryId) {
                    this.startTracking();
                }
            });

            
        },
        saveState() {
            const state = {
                lastTrackTime: this.lastTrackTime,
                currenctCategoryId: this.currenctCategoryId,
                categories: this.categories
            }
            chrome.storage.local.set(state, () => {

            })
        },

        reset() {
            this.categories.forEach(c => {
                c.time = 0;
            })
            this.saveState();
        },
        toggleBadge() {
            if (this.currenctCategoryId) {
                chrome.browserAction.setBadgeText({text: "⌛"})
            } else {
                chrome.browserAction.setBadgeText({text: ""})
            }
        }

    },
    computed: {
        totalTime() {
            return this.categories.reduce((total, category) => {
                return total + category.time
            }, 0)
        }
    }
})