const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

async function run() {
  try {

      const PERSONAL_ACCESS_TOKEN = core.getInput('PERSONAL_ACCESS_TOKEN')
      console.log("length of PERSONAL_ACCESS_TOKEN: ", PERSONAL_ACCESS_TOKEN.length)
      const SLACK_URL = core.getInput('SLACK_URL')
    
      const octokit = new github.GitHub(PERSONAL_ACCESS_TOKEN);

      const notifs = await octokit.activity.listNotifications({participating: true, per_page: 100});

      notifs.data.filter(({reason}) => {
        return ['mention', 'assign'].includes(reason)
      }).
      map(async ({subject: {title, url}}) => {
        const res = await octokit.request(`GET ${url}`);
        console.log("1. fetched url", url, res.data._links.html.href)
        return `Title: ${title} URL: ${res.data._links.html.href}`
      }).
      forEach(async body => {
        body = await body
        console.log("2. body", body)
        await fetch(SLACK_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({text: body})
        });


      })

      // // `who-to-greet` input defined in action metadata file
      // const nameToGreet = core.getInput('who-to-greet');
      // console.log(`Hello ${nameToGreet}!`);
      // const time = (new Date()).toTimeString();
      // core.setOutput("time", time);
      // // Get the JSON webhook payload for the event that triggered the workflow
      // const payload = JSON.stringify(github.context.payload, undefined, 2)
      // console.log(`The event payload: ${payload}`);
    } catch (error) {
      core.setFailed(error.message);
    }
}


run();


