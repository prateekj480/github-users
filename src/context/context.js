import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser)
    const [repos, setRepos] = useState(mockRepos)
    const [followers, setFollowers] = useState(mockFollowers)
    const [loading, setLoading] = useState(false)
    const [requests, setRequests] = useState(0)
    const [error, setError] = useState({ show: false, msg: "" })

    const toggleError = (show = false, msg = "") => {
        setError({ show, msg })
    }

    const checkRate = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let { rate: { remaining } } = data
                setRequests(remaining)
                if (remaining <= 0) {
                    toggleError(true, 'Sorry, you have exceeded your hourly rate limit')
                }
            }).catch(err => console.log(err))
    }

    const fetchUser = async user => {
        toggleError()
        setLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`).catch(err => console.log(err))
        if (response) {
            setGithubUser(response.data)
            const { login, followers_url } = response.data

            await Promise.allSettled([axios(`${rootUrl}/users/${login}/repos?per_page=100`), axios(`${followers_url}?per_page=100`)])
                .then(response => {
                    const [repos, followers] = response
                    if (repos.status === 'fulfilled') {
                        setRepos(repos.value.data)
                    }
                    if (followers.status === 'fulfilled') {
                        setFollowers(followers.value.data)
                    }
                })

        } else {
            toggleError(true, 'User not found!')
        }
        checkRate()
        setLoading(false)
    }

    useEffect(checkRate, [])

    return <GithubContext.Provider value={{ githubUser, repos, followers, requests, error, fetchUser, loading }}>
        {children}
    </GithubContext.Provider>
}

export { GithubProvider, GithubContext }
