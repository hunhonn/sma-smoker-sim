import { updateSliderLabel, simulationYear } from "./script.js";

var minSmokeAge = 21; // Default minimum smoking age
var publicSmokingMultiplier = 1;

const C0 = 100;
const elasticity = -0.5;

function consumptionAtTaxRate(taxRate) {
    return C0 * Math.pow(1 + taxRate, elasticity);
};

function updateTaxLevel(slider) {
    const taxRate = parseFloat(slider.value) / 100; // Convert percentage to decimal

    const adjustedConsumption = consumptionAtTaxRate(taxRate); // Calculate adjusted consumption factor
    return adjustedConsumption / 100;
}

function updateMinSmokeAge() {
    minSmokeAge = parseFloat(document.getElementById("min-age").value) || 21;
    console.log("Minimum smoking age set to: ", retirementAge);
}

function updateExerciseLevel(checkbox) {
    exerciseLevel = checkbox.checked;
}

function updatePublicSmokingBan(checkbox) {
    if (checkbox.checked) {
        const tolerance = 1e-6; // Small tolerance for floating-point comparison
        if (Math.abs(simulationYear % 5) < tolerance) {
            publicSmokingMultiplier -= 0.07;
            publicSmokingMultiplier = Math.max(0, publicSmokingMultiplier);
        }
    } else {
        publicSmokingMultiplier = 1;
    }
    // console.log("Public smoking ban multiplier set to:", publicSmokingMultiplier);
}

function updateImagePacks(checkbox){
    if(checkbox.checked){
        return 0.2;
    } else {
        return 0.5;
    }
}

export {
    updateMinSmokeAge,
    updateExerciseLevel,
    updateTaxLevel,
    updatePublicSmokingBan,
    publicSmokingMultiplier,
    updateImagePacks
};