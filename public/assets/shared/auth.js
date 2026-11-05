let accessToken;
let userDetails// id, username, avatarURL

function decodeToken(token) {
    return token.split('.')[1] ? JSON.parse(atob(token.split('.')[1])) : null
}

function setAccessToken(token) {
    accessToken = token
}

function setUser(id, username, avatarURL) {
    userDetails = {id: id, username: username, avatarURL: avatarURL}
}

async function getAccessToken() {
    try {
        const retrievedAccessToken = (
            await axios.get('api/getAccessToken')
        )

        
    } catch (error) {
        console.error('Error retrieving access token:', error)
    }
}

