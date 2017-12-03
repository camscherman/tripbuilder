function formatDate (DDMMMYYYYTZZTime){
  const day = DDMMMYYYYTZZTime.slice(0,2)
  const month = DDMMMYYYYTZZTime.slice(2,5)
  const year = DDMMMYYYYTZZTime.slice(5,9)
  const time = DDMMMYYYYTZZTime.slice(11)
  const tz = DDMMMYYYYTZZTime.slice(9,11)

  return `${day} ${month} ${year} ${time}`
}

module.exports = formatDate
