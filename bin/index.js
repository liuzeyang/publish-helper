#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const execa = require('execa');
const chalk = require('chalk');
const { prompt } = require('enquirer');
const cp = require('child_process');
const { generateTags } = require('./utlis');

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
const step = msg => console.log(chalk.cyan(msg))

async function main() {
  let type = args.type
  if (!type) {
    let { self } = await prompt({
      type: 'select',
      name: 'self',
      message: 'Select op type',
      choices: ['merge', 'publish', 'tag']
    })
    type = self
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Confirm?`
  })

  if (!yes) {
    return
  }

  if (type === 'merge') {
    // merge master
    await run('git', ['merge', 'origin/master'])
  } else {
    // 打包以及提交
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
    // tag 模块 ：1. 自动生成 2.手动输入
    if (type === 'tag') {
      let tagVersion = args.tag;
      if (!tagVersion) {
        let { auto } = await prompt({
          type: 'confirm',
          name: 'auto',
          message: 'need auto create?'
        })
        if (auto) {
          let tags = await cp.execSync('git describe --tags `git rev-list --tags --max-count=1`').toString()
          tagVersion = generateTags(tags)
        } else {
          let { tag } = await prompt({
            type: 'input',
            name: 'tag',
            message: 'input your tag version',
          })
          tagVersion = tag
        }
      }
      // 提交tag
      step('\nPushing tag to GitHub...')
      await run('git', ['tag', tagVersion])
      await run('git', ['push', '--tags'])
    }
    step('\nfinish jpublish')
  }
}


main().catch((error) => {
  console.log(error)
})