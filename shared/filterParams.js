const meaningfulFilterParams = [
  "dateStart",
  "dateEnd",
  "popularityStart",
  "popularityEnd",
  "genres",
];

function haveFilterParamsChanged(oldParams, newParams) {
  return !meaningfulFilterParams.every(
    (param) => oldParams[param] === newParams[param],
  );
}

exports.meaningfulFilterParams = meaningfulFilterParams;
exports.haveFilterParamsChanged = haveFilterParamsChanged;
