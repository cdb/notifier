const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')

async function run() {
  try {
      const PERSONAL_ACCESS_TOKEN = core.getInput('PERSONAL_ACCESS_TOKEN')
      const SLACK_URL = core.getInput('SLACK_URL')
      const octokit = new github.GitHub(PERSONAL_ACCESS_TOKEN)
      const notifs = await octokit.activity.listNotifications({participating: true, per_page: 100})

      notifs.data.filter(({reason}) => {
        return ['mention', 'assign'].includes(reason)
      }).
      map(async ({subject: {title, url}}) => {
        const res = await octokit.request(`GET ${url}`)
        return `Title: ${title} URL: ${res.data._links.html.href}`
      }).
      forEach(async body => {
        body = await body
        await fetch(SLACK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({text: body})
        })
      })
    } catch (error) {
      core.setFailed(error.message)
    }
}

run()
