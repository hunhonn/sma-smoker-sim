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

function updateSodiumLevel(value) {
    sodiumLevel = parseFloat(value);
    updateSliderLabel(value, "reco-sodium-value");
}

function updateOilLevel(value) {
    oilLevel = parseFloat(value);
    updateSliderLabel(value, "reco-oil-value");
}

export {
    updateMinSmokeAge,
    updateSugarLevel,
    updateSodiumLevel,
    updateOilLevel 
};