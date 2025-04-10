import { updateSliderLabel } from "./script.js";

var minSmokeAge = 21; // Default minimum smoking age

function updateMinSmokeAge() {
    minSmokeAge = parseFloat(document.getElementById("min-age").value) || 21;
    console.log("Minimum smoking age set to: ", retirementAge);
}

function updateSugarLevel(value) {
    sugarLevel = parseFloat(value);
    updateSliderLabel(value, "reco-sugar-value");
}

export {
    updateMinSmokeAge,
    updateSugarLevel
};