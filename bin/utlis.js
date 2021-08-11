const generateTags = (tag) => {
  let [major, minor, patch] = tag.split('.')
  return `${major}.${minor}.${parseInt(patch) + 1}`
}

module.exports = {
  generateTags
}