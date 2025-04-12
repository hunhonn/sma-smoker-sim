import { updateSliderLabel } from "./script.js";

var minSmokeAge = 21; // Default minimum smoking age

const C0 = 100;
const elasticity = -0.5; 

function consumptionAtTaxRate(taxRate) {
    return C0 * Math.pow(1 + taxRate, elasticity);
};

function updateTaxLevel(slider) {
    const taxRate = parseFloat(slider.value) / 100; // Convert percentage to decimal
    const adjustedConsumption = consumptionAtTaxRate(taxRate); // Calculate adjusted consumption factor

    updateSliderLabel(slider, "tax-value"); // Update the slider label

    const sticksInput = document.getElementById("sticks_a_day");
    if (sticksInput) {
        let currentSticksPerDay = parseFloat(sticksInput.value) || 0; // Get current sticks/day value
        const reducedSticksPerDay = currentSticksPerDay - (adjustedConsumption * currentSticksPerDay); // Reduce by factor
        currentSticksPerDay = Math.max(0, reducedSticksPerDay); // Ensure non-negative value
        sticksInput.value = currentSticksPerDay.toFixed(2); // Update with the reduced value
    }

    console.log(`Tax Rate: ${(taxRate * 100).toFixed(0)}% → Adjusted Consumption Factor: ${adjustedConsumption.toFixed(2)} → Sticks/Day: ${sticksInput.value}`);
    return sticksInput.value;
}

function updateMinSmokeAge() {
    minSmokeAge = parseFloat(document.getElementById("min-age").value) || 21;
    console.log("Minimum smoking age set to: ", retirementAge);
}

function updateSugarLevel(value) {
    sugarLevel = parseFloat(value);
    updateSliderLabel(value, "reco-sugar-value");
}


function updateOilLevel(value) {
    oilLevel = parseFloat(value);
    updateSliderLabel(value, "reco-oil-value");
}

export {
    updateMinSmokeAge,
    updateSugarLevel,
    updateOilLevel,
    updateTaxLevel
};