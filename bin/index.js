#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const execa = require('execa');
const chalk = require('chalk');
const { prompt } = require('enquirer');

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
const step = msg => console.log(chalk.cyan(msg))

async function main() {
  let type = args.type
  if (!type) {
    let { slef } = await prompt({
      type: 'select',
      name: 'self',
      message: 'Select op type',
      choices: ['publish', 'tag']
    })
    type = slef
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Confirm?`
  })

  if (!yes) {
    return
  }

  step('\nRunning build...')
  await run('npm', ['run', 'build'])

  step('\nCommitting changes...')
  await run('git', ['add', '-A'])

  let commitMsg = args.commit;
  if (!commitMsg) {
    let { commit } = await prompt({
      type: 'input',
      name: 'commit',
      message: 'input your commit',
    })
    commitMsg = commit
  }
  await run('git', ['commit', '-m', `${commitMsg}--auto`])

  step('\nPushing to GitHub...')
  await run('git', ['push'])

  if (type === 'tag') {
    let tagVersion = args.tag;
    if (!tagVersion) {
      let { tag } = await prompt({
        type: 'input',
        name: 'tag',
        message: 'input your tag version',
      })
      tagVersion = tag
    }
    step('\nPushing tag to GitHub...')
    await run('git', ['tag', tagVersion])
    await run('git', ['push', '--tags'])
  }
  step('\nfinish jpublish')
}


main().catch((error) => {
  console.log(error)
})