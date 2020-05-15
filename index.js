const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')

const PERSONAL_ACCESS_TOKEN = core.getInput('PERSONAL_ACCESS_TOKEN')
const octokit = new github.GitHub(PERSONAL_ACCESS_TOKEN)

const SLACK_URL = core.getInput('SLACK_URL')

const SINCE = core.getInput('SINCE')

async function postNotifications() {
  const notifs = await octokit.activity.listNotifications({since: SINCE, participating: true, per_page: 100})
  core.info(`Found ${notifs.data.length} notifications since ${SINCE}`)

  notifs.data.filter(({reason}) => {
    if (['mention', 'assign', ''].includes(reason)) {
      return true
    }
    if (reason == 'review_requested') {
      return 
    }
  }).
  map(async (item) => {
    const {subject: {title, url, type: itemType}} = item
    
    const res = await octokit.request(`GET ${url}`)

    if (item.reason == 'review_requested') {
      core.info("body", res.data.requested_reviewers)
    }
    return `Title: ${title} URL: ${res.data.html_url}`
  }).
  forEach(async body => {
    body = await body
    core.info(`Posting: ${body}`)
    await fetch(SLACK_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text: body})
    })
  })
}

async function run() {
  try {
      await postNotifications()
    } catch (error) {
      core.setFailed(error.message)
    }
}

run()
