class Cookie {
    constructor() {
        this.key = ""
        this.value = ""
        this.options = []
    }
}

class CookieOption {
    constructor() {
        this.key = ""
        this.value = ""
    }
}

/**
 * @param {string} strCookie
 * @returns {Cookie[]}
 */
function parseCookie(strCookie) {
    var cookies = []

    while(strCookie.indexOf(" ") > -1)
        strCookie = strCookie.replace(" ", "")

    strCookie.split(",").forEach((str) => {
        var cookie = new Cookie()

        parseCookieOptions(str, cookie)

        cookies.push(cookie)
    })

    return cookies
}

/**
 * @param {string} string 
 * @param {Cookie} cookie 
 */
function parseCookieOptions(string, cookie) {
    string.split(";").forEach((value, index) => {
        if(value == "")
            return

        var relative = (index == 0 ? cookie : new CookieOption())

        if(index == 0 || value.indexOf("=") > -1) {
            const array = value.split("=")
            relative.key = array[0]
            relative.value = array[1]
        }
        else if(index > 0 && value.indexOf("=") < 0) {
            relative.key = value
            relative.value = null
        }

        if(index > 0)
            cookie.options.push(relative)
    })
}

/**
 * @param {Cookie[]} cookies 
 * @param {string} key
 * @returns {Cookie}
 */
function findCookieByKey(cookies, key) {
    for(i = 0; i < cookies.length; ++i) {
        if(cookies[i].key.localeCompare(key) == 0)
            return cookies[i]
    }

    return null
}

/**
 * @param {Cookie[]} cookies
 * @returns {string}
 */
function cookiesToString(cookies) {
    var string = ""

    cookies.forEach((cookie, cookieIndex) => {
        string += cookie.key + "=" + cookie.value + (cookieIndex == cookies.length - 1 ? (cookie.options.length == 0 ? "" : ";") : (cookie.options.length == 0 ? "," : ";"))
        
        string += cookiesOptionsToString(cookie.options, string, cookieIndex, cookies.length)
    })

    return string
}

/**
 * @param {CookieOption[]} options 
 * @param {string} string 
 * @returns {string}
 */
function cookiesOptionsToString(options, string, cookieIndex, cookiesLength) {
    options.forEach((option, optionIndex) => {
        string += option.key

        if(option.value != null)
            string += "=" + option.value
        
        if(optionIndex < options.length - 1)
            string += "; "
        else if(cookieIndex < cookiesLength - 1)
            string += ", "
    })

    return string
}

module.exports = { parseCookie, findCookieByKey, cookiesToString, Cookie, CookieOption }