const dateTimeFormat = new Intl.DateTimeFormat('en',
  {
    timeZone: 'America/Chicago', 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }
);

exports.createDateString = function(date) {
  return dateTimeFormat.format(date).replace(',', '').replaceAll('/', '-');
}
