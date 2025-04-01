import { updateSliderLabel } from "./script.js";

var familyInfluence = false;
var lifeStressLevel = 0.3;
var socialInfluence = 0;

function updateFamilyInfluence(checkbox) {
    familyInfluence = checkbox.checked; // Set family influence based on checkbox state
    // console.log("Family influence set to:", familyInfluence ? "Present" : "Absent");
}

function updateLifeStressLevel(value) {
    lifeStressLevel = parseFloat(value);
    updateSliderLabel(value, "life-stress-value");
}

function updateSmokerFriends(checkbox) {
    if (checkbox.checked) {
        socialInfluence = 0.4; // Increase influence when checked
    } else {
        // Random chance for social influence to be negative
        const randomChance = Math.random(); // Generates a number between 0 and 1
        if (randomChance < 0.5) {
            // 50% chance for social influence to be negative
            socialInfluence = -(Math.random() * 0.2); // Normalize a negative value between -0.2 and 0
        } else {
            socialInfluence = 0; // Default positive influence when unchecked
        }
    }
    // console.log("Smoker friends influence set to:", socialInfluence);
}

export {familyInfluence,
        lifeStressLevel,
        socialInfluence, 
        updateFamilyInfluence, 
        updateLifeStressLevel,
        updateSmokerFriends
        };